import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getPublishedPosts } from "@/lib/data/blog";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Blog - Câu Chuyện & Khám Phá" : "Blog - Stories & Insights",
    description:
      locale === "vi"
        ? "Cảm hứng du lịch, tin tức khách sạn và khám phá địa phương từ Lullaby Sky Villa"
        : "Travel inspiration, hotel news, and local discoveries from Lullaby Sky Villa",
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BlogContent locale={locale} />;
}

function BlogContent({ locale }: { locale: string }) {
  const t = useTranslations("blog");
  const posts = getPublishedPosts(locale);

  return (
    <>
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 bg-[var(--color-surface-dim)]">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl md:text-6xl mb-4">
              {t("title")}
            </h1>
            <p className="text-[var(--color-text-light)] text-base sm:text-lg max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
            <div className="luxury-divider mx-auto mt-6" />
          </ScrollReveal>
        </div>
      </section>

      {/* Blog Listing */}
      <section className="py-[var(--spacing-section-sm)] sm:py-[var(--spacing-section)] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <p className="text-center text-[var(--color-text-light)]">
              {t("noPosts")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post, idx) => (
                <ScrollReveal key={post.id} delay={idx * 0.1}>
                  <Link
                    href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
                    className="group block overflow-hidden rounded-sm bg-white border border-[var(--color-border)] hover:shadow-[var(--shadow-medium)] transition-shadow duration-[var(--duration-slow)]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs uppercase tracking-widest text-[var(--color-primary)]">
                          {t(`categories.${post.category}` as never)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      <time className="text-xs text-[var(--color-text-light)] uppercase tracking-wider">
                        {new Date(post.publishedAt).toLocaleDateString(
                          locale === "vi" ? "vi-VN" : "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </time>
                      <h2 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl leading-snug group-hover:text-[var(--color-accent-dark)] transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-[var(--color-text-light)] line-clamp-3">
                        {post.excerpt}
                      </p>
                      <span className="inline-block text-xs uppercase tracking-widest text-[var(--color-accent)] pt-2 group-hover:translate-x-1 transition-transform">
                        {t("readMore")} →
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
