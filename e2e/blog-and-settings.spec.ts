import { test, expect, APIRequestContext } from "@playwright/test";

/**
 * Two "looks wired but isn't" gaps:
 *
 *  - /admin/blog wrote to blog_posts while the public blog served a hardcoded
 *    array, so nothing an admin published ever appeared on the site.
 *  - /admin/settings persisted to site_config, but the footer hardcoded the
 *    address, phone and email and nothing read those values back.
 *
 * Runs in the "authenticated" project (single sign-in from auth.setup.ts).
 */

const unique = () => Date.now().toString(36);

async function createPost(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {}
) {
  const id = unique();
  const res = await request.post("/api/admin/blog", {
    data: {
      title: `E2E bài viết ${id}`,
      titleEn: `E2E post ${id}`,
      slug: `e2e-post-${id}`,
      content: `<p>Nội dung tiếng Việt ${id}</p>`,
      contentEn: `<p>English body ${id}</p>`,
      excerpt: `Tóm tắt ${id}`,
      excerptEn: `Summary ${id}`,
      isPublished: true,
      ...overrides,
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { post } = await res.json();
  return { post, id, slug: post.slug as string };
}

test.describe("a published post reaches the public blog", () => {
  test("appears on the listing and its own page, in both locales", async ({
    request,
    page,
  }) => {
    const { post, id, slug } = await createPost(request);

    try {
      await page.goto("/vi/blog", { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toContainText(`E2E bài viết ${id}`);

      await page.goto(`/vi/blog/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toContainText(`E2E bài viết ${id}`);
      await expect(page.locator("body")).toContainText(`Nội dung tiếng Việt ${id}`);

      // Same row, English fields
      await page.goto(`/en/blog/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toContainText(`E2E post ${id}`);
      await expect(page.locator("body")).toContainText(`English body ${id}`);
    } finally {
      await request.delete(`/api/admin/blog?id=${post.id}`);
    }
  });

  test("an unpublished draft is not public", async ({ request, page }) => {
    const { post, slug } = await createPost(request, { isPublished: false });

    try {
      const res = await page.goto(`/vi/blog/${slug}`, {
        waitUntil: "domcontentloaded",
      });
      expect(res?.status()).toBe(404);
    } finally {
      await request.delete(`/api/admin/blog?id=${post.id}`);
    }
  });

  test("a post scheduled in the past is live without a cron", async ({
    request,
    page,
  }) => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { post, id, slug } = await createPost(request, {
      isPublished: false,
      scheduledAt: past,
    });

    try {
      await page.goto(`/vi/blog/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toContainText(`E2E bài viết ${id}`);
    } finally {
      await request.delete(`/api/admin/blog?id=${post.id}`);
    }
  });

  test("script tags in post content are stripped, not rendered", async ({
    request,
    page,
  }) => {
    const marker = `xss${unique()}`;
    const { post, slug } = await createPost(request, {
      content: `<p>safe body</p><script>window.${marker}=1</script><img src=x onerror="window.${marker}=1">`,
      contentEn: `<p>safe body</p>`,
    });

    try {
      await page.goto(`/vi/blog/${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toContainText("safe body");

      const executed = await page.evaluate(
        (key) => Boolean((window as unknown as Record<string, unknown>)[key]),
        marker
      );
      expect(executed, "post HTML was not sanitised").toBe(false);
      expect(await page.content()).not.toContain("onerror");
    } finally {
      await request.delete(`/api/admin/blog?id=${post.id}`);
    }
  });

  test("content is sanitised on write, not just on read", async ({ request }) => {
    // The admin preview and revision-history screens render stored content with
    // dangerouslySetInnerHTML, so a post written by a receptionist must not be
    // able to run code in a super-admin's session.
    const { post } = await createPost(request, {
      content: `<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>`,
    });

    try {
      const res = await request.get("/api/admin/blog");
      const { posts } = await res.json();
      const stored = posts.find((p: { id: string }) => p.id === post.id);

      expect(stored.content).toContain("ok");
      expect(stored.content).not.toContain("<script");
      expect(stored.content).not.toContain("javascript:");
    } finally {
      await request.delete(`/api/admin/blog?id=${post.id}`);
    }
  });

  test("a deleted post stops being public", async ({ request, page }) => {
    const { post, slug } = await createPost(request);
    expect((await request.delete(`/api/admin/blog?id=${post.id}`)).status()).toBe(
      200
    );

    const res = await page.goto(`/vi/blog/${slug}`, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(404);
  });
});

test.describe("settings reach the public site", () => {
  test("footer contact details come from /admin/settings", async ({
    request,
    page,
  }) => {
    const before = await request.get("/api/admin/settings");
    const original = (await before.json()).settings;

    const phone = `+84 000 ${unique().slice(-6)}`;
    const address = `E2E address ${unique()}`;

    try {
      const saved = await request.put("/api/admin/settings", {
        data: { phone, address },
      });
      expect(saved.status()).toBe(200);

      await page.goto("/vi", { waitUntil: "domcontentloaded" });
      const footer = page.locator("footer");
      await expect(footer).toContainText(address);
      await expect(footer).toContainText(phone);
    } finally {
      await request.put("/api/admin/settings", { data: original });
    }
  });

  test("SEO title from settings is used for the page title", async ({
    request,
    page,
  }) => {
    const before = await request.get("/api/admin/settings");
    const original = (await before.json()).settings;

    const metaTitle = `E2E Title ${unique()}`;

    try {
      const saved = await request.put("/api/admin/settings", {
        data: { seo: { ...original.seo, metaTitle } },
      });
      expect(saved.status()).toBe(200);

      await page.goto("/vi", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveTitle(new RegExp(metaTitle.replace(/\s/g, "\\s")));
    } finally {
      await request.put("/api/admin/settings", { data: original });
    }
  });
});
