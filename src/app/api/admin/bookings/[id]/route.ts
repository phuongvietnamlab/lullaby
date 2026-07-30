import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth-utils";

const VALID_STATUSES = [
  "CONFIRMED",
  "CANCELLED",
  "CHECK_IN",
  "CHECK_OUT",
  "COMPLETED",
  "NO_SHOW",
] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

// Allowed status transitions. Prevents illegal jumps (e.g. pending -> completed).
const TRANSITIONS: Record<string, ValidStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECK_IN", "CANCELLED", "NO_SHOW"],
  CHECK_IN: ["CHECK_OUT"],
  CHECK_OUT: ["COMPLETED"],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: string };

    // Validate status
    if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: CONFIRMED, CANCELLED, CHECK_IN, CHECK_OUT" },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Enforce valid state transition
    const allowed = TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status as ValidStatus)) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${booking.status} to ${status}`,
        },
        { status: 409 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status: status as ValidStatus,
    };

    if (status === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      if (body.cancelReason) {
        updateData.cancelReason = body.cancelReason;
      }
    }

    // Update booking
    const updated = await db.booking.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: updated.id,
        status: updated.status,
        confirmedAt: updated.confirmedAt,
        cancelledAt: updated.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Admin booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
