import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth-utils";

// Free-form moderation status (D-04): any status is directly settable from any
// current status. There is intentionally NO transition state machine here — do
// NOT reintroduce a TRANSITIONS map or a transition-conflict response.
const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const MAX_REJECT_REASON = 2000;
const MAX_RESPONSE = 5000;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session (T-10-03)
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (typeof id !== "string" || id.length === 0) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const body = await request.json();
    // Read ONLY the whitelisted fields — never spread the body (T-10-04 mass-assignment)
    const { status, rejectReason, response } = body as {
      status?: unknown;
      rejectReason?: unknown;
      response?: unknown;
    };

    // Validate status against the allowlist when present (no transition check, D-04)
    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !VALID_STATUSES.includes(status as ValidStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid status. Must be one of: PENDING, APPROVED, REJECTED" },
          { status: 400 }
        );
      }
    }

    // Bound free-text lengths (T-10-04 / T-10-06). null/"" are valid (clearing).
    if (
      rejectReason !== undefined &&
      rejectReason !== null &&
      (typeof rejectReason !== "string" || rejectReason.length > MAX_REJECT_REASON)
    ) {
      return NextResponse.json(
        { error: `rejectReason must be a string of at most ${MAX_REJECT_REASON} characters` },
        { status: 400 }
      );
    }
    if (
      response !== undefined &&
      response !== null &&
      (typeof response !== "string" || response.length > MAX_RESPONSE)
    ) {
      return NextResponse.json(
        { error: `response must be a string of at most ${MAX_RESPONSE} characters` },
        { status: 400 }
      );
    }

    // Find-then-update
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Conditionally build update data from only the present fields
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status; // MOD-02 / MOD-03
    if (rejectReason !== undefined) updateData.rejectReason = rejectReason; // MOD-03 (blank/null clears, D-02)
    if (response !== undefined) updateData.response = response; // MOD-04 (editable/clearable, D-08)

    const updated = await db.review.update({ where: { id }, data: updateData });

    return NextResponse.json({
      success: true,
      review: {
        id: updated.id,
        status: updated.status,
        response: updated.response,
        rejectReason: updated.rejectReason,
      },
    });
  } catch (error) {
    console.error("Admin review update error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
