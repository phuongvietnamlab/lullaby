/**
 * Blog data helpers.
 *
 * Reads published posts from the database — the same rows /admin/blog writes.
 * Falls back to the built-in sample posts only while `blog_posts` is empty,
 * matching how rooms, promotions and the gallery behave.
 */

import { db } from "@/lib/db";
import { sanitizeRichText, stripTags } from "@/lib/sanitize";
import { staticBlogPosts } from "./blog-static";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  /** Resolved category label (DB posts) — already in the right language. */
  categoryLabel?: string;
  /** i18n key under `blog.categories` (built-in sample posts only). */
  categoryKey?: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  coverImage: string;
  /**
   * "html" for admin-authored posts (the editor emits HTML, sanitised here);
   * "markdown" for the built-in samples, which the page parses into blocks.
   */
  format: "html" | "markdown";
  content: string;
};

/** Fallback excerpt when the author left the summary field blank. */
function excerptFrom(html: string, maxLength = 200): string {
  const text = stripTags(html);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

type DbPost = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  content: string;
  contentEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  author: { name: string } | null;
  category: { name: string; nameEn: string | null } | null;
};

/**
 * A post is live when it is published, or when its scheduled time has passed.
 *
 * The scheduled case matters: nothing runs a cron to flip `isPublished`, so
 * without this a post scheduled through the admin editor would never appear.
 */
function publishedWhere() {
  const now = new Date();
  return {
    OR: [{ isPublished: true }, { scheduledAt: { lte: now, not: null } }],
  };
}

/**
 * The DB stores both languages on a single row. Pick the requested one and
 * fall back to Vietnamese when a translation was left blank, so an untranslated
 * post is still readable rather than missing.
 */
function toBlogPost(post: DbPost, locale: string): BlogPost {
  const isEn = locale === "en";

  const title = (isEn ? post.titleEn : post.title) || post.title;
  const content = (isEn ? post.contentEn : post.content) || post.content;
  const excerpt =
    (isEn ? post.excerptEn : post.excerpt) || post.excerpt || "";

  const safeContent = sanitizeRichText(content);
  const categoryLabel = post.category
    ? (isEn ? post.category.nameEn : post.category.name) || post.category.name
    : undefined;

  return {
    id: post.id,
    title,
    slug: post.slug,
    locale,
    categoryLabel,
    author: post.author?.name ?? "",
    publishedAt: (
      post.publishedAt ??
      post.scheduledAt ??
      post.createdAt
    ).toISOString(),
    excerpt: excerpt || excerptFrom(safeContent),
    coverImage: post.coverImage ?? "",
    format: "html",
    content: safeContent,
  };
}

function staticToBlogPost(post: (typeof staticBlogPosts)[number]): BlogPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    locale: post.locale,
    categoryKey: post.category,
    author: post.author,
    publishedAt: post.publishedAt,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    format: "markdown",
    content: post.content,
  };
}

const POST_INCLUDE = {
  author: { select: { name: true } },
  category: { select: { name: true, nameEn: true } },
} as const;

/** Published posts for a locale, newest first. */
export async function getPublishedPosts(locale: string): Promise<BlogPost[]> {
  try {
    const posts = await db.blogPost.findMany({
      where: publishedWhere(),
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: POST_INCLUDE,
    });

    if (posts.length > 0) {
      return posts.map((post) => toBlogPost(post, locale));
    }

    // Reachable but empty table: only then show the built-in samples.
    const total = await db.blogPost.count();
    if (total > 0) return [];
  } catch (error) {
    console.error("Failed to fetch blog posts, using static data:", error);
  }

  return staticBlogPosts
    .filter((post) => post.locale === locale)
    .map(staticToBlogPost);
}

/** A single published post, or undefined. */
export async function getPostBySlug(
  slug: string,
  locale: string
): Promise<BlogPost | undefined> {
  try {
    const post = await db.blogPost.findFirst({
      where: { slug, ...publishedWhere() },
      include: POST_INCLUDE,
    });

    if (post) return toBlogPost(post, locale);

    // Present but not published yet — do not fall through to a static post
    // that happens to share the slug.
    const exists = await db.blogPost.count({ where: { slug } });
    if (exists > 0) return undefined;

    const total = await db.blogPost.count();
    if (total > 0) return undefined;
  } catch (error) {
    console.error("Failed to fetch blog post, using static data:", error);
  }

  const fallback = staticBlogPosts.find(
    (post) => post.slug === slug && post.locale === locale
  );
  return fallback ? staticToBlogPost(fallback) : undefined;
}

/** Slug/locale pairs for static generation. */
export async function getAllPostSlugs(): Promise<
  { slug: string; locale: string }[]
> {
  try {
    const posts = await db.blogPost.findMany({
      where: publishedWhere(),
      select: { slug: true },
    });

    if (posts.length > 0) {
      // One row serves both languages, so emit a pair per locale.
      return posts.flatMap((post) => [
        { slug: post.slug, locale: "vi" },
        { slug: post.slug, locale: "en" },
      ]);
    }

    const total = await db.blogPost.count();
    if (total > 0) return [];
  } catch (error) {
    console.error("Failed to fetch blog slugs, using static data:", error);
  }

  return staticBlogPosts.map((post) => ({
    slug: post.slug,
    locale: post.locale,
  }));
}
