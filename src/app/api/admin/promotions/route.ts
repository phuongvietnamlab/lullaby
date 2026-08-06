import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";
import { revalidatePromotions } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

/** Creating or changing a discount is managers-and-up. */
const PROMO_ROLES = ["SUPER_ADMIN", "MANAGER"] as const;

const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;
type DiscountType = (typeof DISCOUNT_TYPES)[number];

type PromoInput = {
  name?: unknown;
  nameEn?: unknown;
  description?: unknown;
  code?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  isActive?: unknown;
  roomTypeIds?: unknown;
};

/** Status shown in the UI, derived from the date window and the active flag. */
function statusFor(promo: {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}): "active" | "scheduled" | "expired" | "inactive" {
  const now = new Date();
  if (!promo.isActive) return "inactive";
  if (promo.endDate < now) return "expired";
  if (promo.startDate > now) return "scheduled";
  return "active";
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

/**
 * Validate the shared create/update payload.
 * `partial` skips required-field checks so PUT can send only what changed.
 */
function parseInput(body: PromoInput, partial: boolean) {
  const errors: string[] = [];

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (!partial && !name) errors.push("name is required");
  if (name !== undefined && name.length > 200) errors.push("name is too long");

  const code =
    typeof body.code === "string" ? body.code.trim().toUpperCase() : undefined;
  if (!partial && !code) errors.push("code is required");
  if (code !== undefined && !/^[A-Z0-9-]{1,50}$/.test(code)) {
    errors.push("code must be 1-50 characters of A-Z, 0-9 or -");
  }

  const discountType =
    typeof body.discountType === "string"
      ? (body.discountType.toUpperCase() as DiscountType)
      : undefined;
  if (!partial && !discountType) errors.push("discountType is required");
  if (discountType !== undefined && !DISCOUNT_TYPES.includes(discountType)) {
    errors.push("discountType must be PERCENTAGE or FIXED_AMOUNT");
  }

  const discountValue =
    body.discountValue === undefined ? undefined : Number(body.discountValue);
  if (!partial && discountValue === undefined) {
    errors.push("discountValue is required");
  }
  if (discountValue !== undefined) {
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      errors.push("discountValue must be a positive number");
    } else if (
      (discountType ?? "PERCENTAGE") === "PERCENTAGE" &&
      discountValue > 100
    ) {
      // A percentage over 100 would hand out more than the booking is worth.
      errors.push("a percentage discount cannot exceed 100");
    }
  }

  if (!partial || body.startDate !== undefined) {
    if (!isValidDate(body.startDate)) errors.push("startDate is invalid");
  }
  if (!partial || body.endDate !== undefined) {
    if (!isValidDate(body.endDate)) errors.push("endDate is invalid");
  }
  if (isValidDate(body.startDate) && isValidDate(body.endDate)) {
    if (new Date(body.endDate) < new Date(body.startDate)) {
      errors.push("endDate must be on or after startDate");
    }
  }

  const roomTypeIds =
    body.roomTypeIds === undefined
      ? undefined
      : Array.isArray(body.roomTypeIds)
        ? body.roomTypeIds.filter((id): id is string => typeof id === "string")
        : [];

  return {
    errors,
    values: {
      name,
      nameEn: typeof body.nameEn === "string" ? body.nameEn.trim() : undefined,
      description:
        typeof body.description === "string" ? body.description.trim() : undefined,
      code,
      discountType,
      discountValue,
      startDate: isValidDate(body.startDate) ? new Date(body.startDate) : undefined,
      endDate: isValidDate(body.endDate) ? new Date(body.endDate) : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      roomTypeIds,
    },
  };
}

// GET: all promotions plus the room types available to attach
export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const [promotions, roomTypes] = await Promise.all([
      db.promotion.findMany({
        orderBy: { endDate: "desc" },
        include: { roomTypes: { include: { roomType: true } } },
      }),
      db.roomType.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, nameEn: true, slug: true },
      }),
    ]);

    const formatted = promotions.map((promo) => ({
      id: promo.id,
      name: promo.name,
      nameEn: promo.nameEn || "",
      description: promo.description || "",
      code: promo.code || "",
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      startDate: promo.startDate.toISOString().split("T")[0],
      endDate: promo.endDate.toISOString().split("T")[0],
      isActive: promo.isActive,
      status: statusFor(promo),
      // Empty means "every room type" — matches how checkout validates it.
      roomTypeIds: promo.roomTypes.map((rt) => rt.roomTypeId),
      roomTypeNames: promo.roomTypes.map((rt) => rt.roomType.name),
    }));

    return NextResponse.json({ promotions: formatted, roomTypes });
  } catch (error) {
    console.error("Admin promotions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

// POST: create a promotion
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdminApi(PROMO_ROLES);
    if (guard instanceof NextResponse) return guard;

    const body = (await request.json()) as PromoInput;
    const { errors, values } = parseInput(body, false);
    if (errors.length) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    }

    const existing = await db.promotion.findUnique({
      where: { code: values.code! },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A promotion with this code already exists" },
        { status: 409 }
      );
    }

    const promotion = await db.promotion.create({
      data: {
        name: values.name!,
        nameEn: values.nameEn || null,
        description: values.description || null,
        code: values.code!,
        discountType: values.discountType!,
        discountValue: values.discountValue!,
        startDate: values.startDate!,
        endDate: values.endDate!,
        isActive: values.isActive ?? true,
        roomTypes: values.roomTypeIds?.length
          ? {
              create: values.roomTypeIds.map((roomTypeId) => ({ roomTypeId })),
            }
          : undefined,
      },
    });

    revalidatePromotions();

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error("Admin promotion create error:", error);
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
  }
}

// PUT: update a promotion
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdminApi(PROMO_ROLES);
    if (guard instanceof NextResponse) return guard;

    const body = (await request.json()) as PromoInput & { id?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { error: "Promotion ID is required" },
        { status: 400 }
      );
    }

    const current = await db.promotion.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    const { errors, values } = parseInput(body, true);
    if (errors.length) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    }

    // Cross-check a changed date against the stored one, not just the payload
    const nextStart = values.startDate ?? current.startDate;
    const nextEnd = values.endDate ?? current.endDate;
    if (nextEnd < nextStart) {
      return NextResponse.json(
        { error: "endDate must be on or after startDate" },
        { status: 400 }
      );
    }

    if (values.code && values.code !== current.code) {
      const clash = await db.promotion.findFirst({
        where: { code: values.code, NOT: { id } },
      });
      if (clash) {
        return NextResponse.json(
          { error: "A promotion with this code already exists" },
          { status: 409 }
        );
      }
    }

    const promotion = await db.$transaction(async (tx) => {
      // Replace the room-type links wholesale when the caller sent them
      if (values.roomTypeIds !== undefined) {
        await tx.promotionRoomType.deleteMany({ where: { promotionId: id } });
        if (values.roomTypeIds.length) {
          await tx.promotionRoomType.createMany({
            data: values.roomTypeIds.map((roomTypeId) => ({
              promotionId: id,
              roomTypeId,
            })),
          });
        }
      }

      return tx.promotion.update({
        where: { id },
        data: {
          name: values.name,
          nameEn: values.nameEn === undefined ? undefined : values.nameEn || null,
          description:
            values.description === undefined ? undefined : values.description || null,
          code: values.code,
          discountType: values.discountType,
          discountValue: values.discountValue,
          startDate: values.startDate,
          endDate: values.endDate,
          isActive: values.isActive,
        },
      });
    });

    revalidatePromotions();

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Admin promotion update error:", error);
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    );
  }
}

// DELETE: remove a promotion
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdminApi(PROMO_ROLES);
    if (guard instanceof NextResponse) return guard;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Promotion ID is required" },
        { status: 400 }
      );
    }

    const existing = await db.promotion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    // PromotionRoomType cascades on delete; bookings keep their promoCode
    // string as a historical record and are deliberately untouched.
    await db.promotion.delete({ where: { id } });

    revalidatePromotions();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin promotion delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
