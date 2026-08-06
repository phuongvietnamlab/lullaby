import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";
import { revalidateBlog } from "@/lib/revalidate";

// Helper: save a revision snapshot of a blog post
async function saveRevision(
  postId: string,
  data: Record<string, unknown>,
  note?: string,
  createdBy?: string
) {
  await db.contentRevision.create({
    data: {
      entityType: "blog_post",
      entityId: postId,
      data: data as object,
      createdBy: createdBy || null,
      note: note || null,
    },
  });
}

/**
 * Normalise an optional text field for a partial update: an absent field is
 * left untouched (`undefined`), an explicitly emptied one is cleared (`null`).
 */
function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  return value ? String(value) : null;
}

// Helper: determine post status label
function getPostStatus(post: { isPublished: boolean; scheduledAt: Date | null }) {
  if (post.isPublished) return "published";
  if (post.scheduledAt && post.scheduledAt > new Date()) return "scheduled";
  return "draft";
}

// GET: Fetch all blog posts with author and category info
export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const posts = await db.blogPost.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, nameEn: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add status field to each post
    const postsWithStatus = posts.map((post: { isPublished: boolean; scheduledAt: Date | null; [key: string]: unknown }) => ({
      ...post,
      status: getPostStatus(post),
    }));

    return NextResponse.json({ posts: postsWithStatus });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST: Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const body = await request.json();
    const {
      title,
      titleEn,
      content,
      contentEn,
      excerpt,
      excerptEn,
      slug,
      coverImage,
      categoryId,
      isPublished,
      scheduledAt,
    } = body;

    // Authorship comes from the session, never from the request body.
    const authorId = guard.user.id;

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: "Title, content, and slug are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      );
    }

    // Determine publish state
    const shouldPublish = isPublished && !scheduledAt;
    const publishedAt = shouldPublish ? new Date() : null;

    const post = await db.blogPost.create({
      data: {
        title,
        titleEn: titleEn || null,
        content,
        contentEn: contentEn || null,
        excerpt: excerpt || null,
        excerptEn: excerptEn || null,
        slug,
        coverImage: coverImage || null,
        categoryId: categoryId || null,
        authorId,
        isPublished: shouldPublish,
        publishedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Save initial revision
    await saveRevision(
      post.id,
      { title, titleEn, content, contentEn, excerpt, excerptEn, slug, coverImage, categoryId, isPublished: shouldPublish, scheduledAt },
      shouldPublish ? "Published" : "Created as draft",
      authorId
    );

    revalidateBlog();

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing blog post
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const body = await request.json();
    const {
      id,
      title,
      titleEn,
      content,
      contentEn,
      excerpt,
      excerptEn,
      slug,
      coverImage,
      categoryId,
      isPublished,
      scheduledAt,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await db.blogPost.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Determine publishedAt
    const currentPost = await db.blogPost.findUnique({ where: { id } });
    if (!currentPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // A partial update must not silently unpublish. Only recompute the publish
    // state when the caller actually sent `isPublished`; otherwise keep what is
    // already stored.
    const publishFieldSent = isPublished !== undefined;
    const shouldPublish = publishFieldSent
      ? Boolean(isPublished) && !scheduledAt
      : currentPost.isPublished;

    let publishedAt = currentPost.publishedAt;
    if (shouldPublish && !currentPost.isPublished) {
      publishedAt = new Date();
    } else if (!shouldPublish) {
      publishedAt = null;
    }

    const post = await db.blogPost.update({
      where: { id },
      data: {
        title,
        titleEn: optionalText(titleEn),
        content,
        contentEn: optionalText(contentEn),
        excerpt: optionalText(excerpt),
        excerptEn: optionalText(excerptEn),
        slug,
        coverImage: optionalText(coverImage),
        categoryId: optionalText(categoryId),
        isPublished: shouldPublish,
        publishedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Save revision
    let note = "Updated";
    if (shouldPublish && !currentPost.isPublished) {
      note = "Published";
    } else if (scheduledAt) {
      note = `Scheduled for ${new Date(scheduledAt).toLocaleString()}`;
    }

    await saveRevision(
      post.id,
      { title, titleEn, content, contentEn, excerpt, excerptEn, slug, coverImage, categoryId, isPublished: shouldPublish, scheduledAt },
      note,
      guard.user.id
    );

    revalidateBlog();

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a blog post (and its revision history)
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdminApi(["SUPER_ADMIN", "MANAGER"]);
    if (guard instanceof NextResponse) return guard;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await db.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // ContentRevision has no FK to BlogPost, so its rows have to go explicitly
    // or they outlive the post they describe.
    await db.$transaction([
      db.contentRevision.deleteMany({
        where: { entityType: "blog_post", entityId: id },
      }),
      db.blogPost.delete({ where: { id } }),
    ]);

    revalidateBlog();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
