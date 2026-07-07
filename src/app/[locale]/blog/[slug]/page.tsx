import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPostSlugs, getPublishedPosts } from "@/lib/data/blog";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return getAllPostSlugs().map(({ slug, locale }) => ({ slug, locale }));
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  return <BlogDetailContent post={post} locale={locale} />;
}

function BlogDetailContent({
  post,
  locale,
}: {
  post: NonNullable<ReturnType<typeof getPostBySlug>>;
  locale: string;
}) {
  const t = useTranslations("blog");

  // Get related posts (same locale, different slug)
  const relatedPosts = getPublishedPosts(locale)
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-0">
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-xs uppercase tracking-widest text-[var(--color-primary)] mb-4">
                {t(`categories.${post.category}` as never)}
              </span>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl text-white leading-tight">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-light)] mb-8 pb-8 border-b border-[var(--color-border)]">
              <time>
                {new Date(post.publishedAt).toLocaleDateString(
                  locale === "vi" ? "vi-VN" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </time>
              <span>·</span>
              <span>{post.author}</span>
            </div>

            {/* Content */}
            <article className="prose prose-lg max-w-none prose-headings:font-[family-name:var(--font-heading)] prose-headings:font-medium prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-[var(--color-text-light)] prose-p:leading-relaxed prose-strong:text-[var(--color-text)] prose-a:text-[var(--color-accent-dark)] prose-li:text-[var(--color-text-light)] prose-hr:border-[var(--color-border)]">
              {post.content.split("\n\n").map((block, idx) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2 key={idx}>{block.replace("## ", "")}</h2>
                  );
                }
                if (block.startsWith("---")) {
                  return <hr key={idx} />;
                }
                if (block.startsWith("*") && block.endsWith("*")) {
                  return (
                    <p key={idx} className="italic">
                      {block.replace(/^\*|\*$/g, "")}
                    </p>
                  );
                }
                if (block.startsWith("- ")) {
                  const items = block.split("\n").map((line) => line.replace(/^- \*\*/, "").replace(/\*\*/, " — "));
                  return (
                    <ul key={idx}>
                      {items.map((item, i) => (
                        <li key={i}>{item.replace(/^- /, "")}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={idx}>{block}</p>;
              })}
            </article>
          </ScrollReveal>

          {/* Back to blog */}
          <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm uppercase tracking-widest text-[var(--color-accent)] hover:text-[var(--color-accent-dark)] transition-colors"
            >
              ← {t("backToBlog")}
            </Link>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl mb-8">
                {t("relatedPosts")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedPosts.map((relPost) => (
                  <Link
                    key={relPost.id}
                    href={{ pathname: "/blog/[slug]", params: { slug: relPost.slug } }}
                    className="group block overflow-hidden rounded-sm border border-[var(--color-border)] hover:shadow-[var(--shadow-medium)] transition-shadow"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={relPost.coverImage}
                        alt={relPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-5">
                      <h4 className="font-[family-name:var(--font-heading)] text-lg group-hover:text-[var(--color-accent-dark)] transition-colors">
                        {relPost.title}
                      </h4>
                      <p className="text-sm text-[var(--color-text-light)] mt-2 line-clamp-2">
                        {relPost.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
