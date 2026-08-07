import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";

// GET: Return a blog post for preview (even if unpublished)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Preview serves unpublished drafts, so it is staff-only.
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const { id } = await params;

    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, nameEn: true } },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to fetch preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}
