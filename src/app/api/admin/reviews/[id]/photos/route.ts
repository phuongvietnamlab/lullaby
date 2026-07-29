import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";

export async function DELETE(
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
    const body = await request.json();
    const { photoUrl } = body as { photoUrl?: unknown };

    if (typeof photoUrl !== "string" || photoUrl.length === 0) {
      return NextResponse.json(
        { error: "photoUrl is required" },
        { status: 400 }
      );
    }

    // Primary array removal (authoritative — D-06)
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Path-safety / IDOR guard: the URL must belong to THIS review (T-10-05).
    // Never accept an arbitrary caller-supplied storage path.
    if (!review.photos.includes(photoUrl)) {
      return NextResponse.json(
        { error: "Photo not found on this review" },
        { status: 404 }
      );
    }

    const nextPhotos = review.photos.filter((url) => url !== photoUrl);
    await db.review.update({ where: { id }, data: { photos: nextPhotos } });

    // Best-effort storage hard-delete (MUST NOT block the array removal — D-06).
    // Storage path is derived only by stripping the "/images/" prefix; a caller
    // path is never reused for anything other than .remove().
    try {
      const marker = "/images/";
      const idx = photoUrl.indexOf(marker);
      if (idx !== -1) {
        const path = photoUrl.slice(idx + marker.length);
        await supabase.storage.from("images").remove([path]);
      }
    } catch (e) {
      console.error("Photo storage delete failed (non-fatal):", e);
    }

    return NextResponse.json({ success: true, photos: nextPhotos });
  } catch (error) {
    console.error("Admin review photo delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove photo" },
      { status: 500 }
    );
  }
}
