import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createBookingSchema,
  validateDates,
  generateBookingCode,
  calculateStayPrice,
  expirePendingBookings,
  validatePromoCode,
} from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";
import {
  sendBookingConfirmation,
  sendAdminNotification,
  type BookingEmailData,
} from "@/lib/email";

/** Thrown inside the booking transaction when inventory ran out mid-flight. */
class SoldOutError extends Error {
  constructor() {
    super("SOLD_OUT");
    this.name = "SoldOutError";
  }
}

function prismaErrorCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    return (e as { code?: string }).code;
  }
  return undefined;
}

type BookingTx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Run the availability-check + insert transaction, retrying on the two races
 * it can legitimately lose:
 *   P2034 - serialisation conflict with a concurrent booking
 *   P2002 - the random bookingCode collided with an existing one
 */
async function createBookingWithRetry<T>(
  work: (tx: BookingTx) => Promise<T>,
  attempts = 4
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await db.$transaction(work, { isolationLevel: "Serializable" });
    } catch (e) {
      if (e instanceof SoldOutError) throw e;

      const code = prismaErrorCode(e);
      if (code !== "P2034" && code !== "P2002") throw e;

      lastError = e;
      // Small jittered backoff so retries do not collide again immediately
      await new Promise((r) => setTimeout(r, 25 * (i + 1) + Math.random() * 25));
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 bookings per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    const { allowed } = rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "rateLimited" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "invalidInput", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      roomTypeId,
      checkIn,
      checkOut,
      guestCount,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      promoCode,
    } = parsed.data;

    // Validate dates
    const dateValidation = validateDates(checkIn, checkOut);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error, code: dateValidation.code },
        { status: 400 }
      );
    }

    // Release rooms held by expired pending bookings before counting
    await expirePendingBookings();

    // Resolve by slug first, then by id
    const rt =
      (await db.roomType.findFirst({
        where: { slug: roomTypeId },
        include: { rooms: { where: { status: { not: "OUT_OF_ORDER" } }, select: { id: true } } },
      })) ??
      (await db.roomType.findUnique({
        where: { id: roomTypeId },
        include: { rooms: { where: { status: { not: "OUT_OF_ORDER" } }, select: { id: true } } },
      }));

    if (!rt) {
      return NextResponse.json(
        { error: "Room type not found", code: "roomNotFound" },
        { status: 404 }
      );
    }

    // A room type hidden from the public site must not be bookable
    if (!rt.isActive) {
      return NextResponse.json(
        { error: "Room is no longer available for the selected dates", code: "soldOut" },
        { status: 409 }
      );
    }

    // The client filters by occupancy, but the API is callable directly
    if (guestCount > rt.maxGuests) {
      return NextResponse.json(
        {
          error: `This room type accommodates at most ${rt.maxGuests} guests`,
          code: "overCapacity",
          maxGuests: rt.maxGuests,
        },
        { status: 400 }
      );
    }

    // Calculate pricing from the room type's own base price
    const pricing = calculateStayPrice(
      Number(rt.basePrice),
      new Date(checkIn),
      new Date(checkOut)
    );

    // Re-validate the promo code server-side; a bad code is ignored, not fatal
    let appliedCode: string | null = null;
    let discountAmount = 0;
    if (promoCode?.trim()) {
      const promo = await validatePromoCode(promoCode, rt.slug, checkIn, pricing.total);
      if (promo.valid) {
        appliedCode = promo.code;
        discountAmount = promo.discountAmount;
      }
    }
    const finalPrice = pricing.total - discountAmount;

    // Set expiration (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Keep the guest record current — a returning guest may have a new phone
    // number or a corrected name.
    const guest = await db.guest.upsert({
      where: { email: guestEmail },
      update: { name: guestName, phone: guestPhone },
      create: { name: guestName, email: guestEmail, phone: guestPhone },
    });

    const totalRooms = rt.rooms.length;

    // Re-count and insert inside one serialisable transaction. Counting outside
    // the write lets two concurrent requests both see the last free room and
    // both succeed.
    const booking = await createBookingWithRetry(async (tx) => {
      const overlapping = await tx.booking.count({
        where: {
          roomTypeId: rt.id,
          status: { in: ["PENDING", "CONFIRMED", "CHECK_IN"] },
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      });

      if (overlapping >= totalRooms) {
        throw new SoldOutError();
      }

      return tx.booking.create({
        data: {
          bookingCode: generateBookingCode(),
          guestId: guest.id,
          roomTypeId: rt.id,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guestCount,
          totalPrice: finalPrice,
          promoCode: appliedCode,
          discountAmount: discountAmount || null,
          status: "PENDING",
          specialRequests: specialRequests || null,
          expiresAt,
        },
      });
    });

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send emails (fire-and-forget, don't block booking response)
    const emailData: BookingEmailData = {
      bookingCode: booking.bookingCode,
      guestName,
      guestEmail,
      guestPhone,
      roomTypeName: rt.name,
      checkIn,
      checkOut,
      guestCount,
      totalPrice: Number(booking.totalPrice),
      nights,
      status: booking.status,
      expiresAt: booking.expiresAt?.toISOString(),
      promoCode: appliedCode ?? undefined,
      discountAmount: discountAmount || undefined,
    };

    Promise.allSettled([
      sendBookingConfirmation(emailData),
      sendAdminNotification(emailData),
    ]).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `[Email] ${index === 0 ? "Confirmation" : "Admin notification"} failed:`,
            result.reason
          );
        }
      });
    });

    return NextResponse.json({
      success: true,
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        checkIn: checkIn,
        checkOut: checkOut,
        guestCount: booking.guestCount,
        subtotal: pricing.total,
        discountAmount,
        promoCode: appliedCode,
        totalPrice: Number(booking.totalPrice),
        nights,
        expiresAt: booking.expiresAt?.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof SoldOutError) {
      return NextResponse.json(
        { error: "Room is no longer available for the selected dates" },
        { status: 409 }
      );
    }
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "serverError" },
      { status: 500 }
    );
  }
}
