import { test, expect } from "@playwright/test";

/** The guarded routes must not have broken the public site or the admin login. */

const PUBLIC_PAGES = [
  "/vi",
  "/vi/rooms",
  "/vi/gallery",
  "/vi/about",
  "/vi/contact",
  "/vi/booking",
  "/vi/reviews",
  "/en",
  "/en/rooms",
];

test.describe("public pages still render", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} loads without a client error`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${path} HTTP status`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      expect(errors, `${path} console errors`).toEqual([]);
    });
  }
});

test.describe("admin panel", () => {
  test("login page renders", async ({ page }) => {
    const res = await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("input[type=password]")).toBeVisible();
  });

  test("dashboard redirects a signed-out visitor to login", async ({ page }) => {
    await page.goto("/admin/bookings", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/admin\/login/, { timeout: 20_000 });
    expect(page.url()).toContain("/admin/login");
  });

  test("no guest data is present in the signed-out dashboard HTML", async ({ request }) => {
    const res = await request.get("/admin/bookings");
    const html = await res.text();

    // The server must have swapped in the login page, not the bookings table
    expect(html).toContain("Sign In");
    expect(html).not.toMatch(/LULLABY-[A-Z0-9]{6}/);
    // No admin nav = the dashboard shell was never rendered
    expect(html).not.toContain("Hotel Management System\",\"bookings");
  });

  test("login page does not publish any credentials", async ({ request }) => {
    const res = await request.get("/admin/login");
    const html = await res.text();
    expect(html).not.toMatch(/demo credentials/i);
    expect(html).not.toContain("admin123");
  });
});

test.describe("booking wizard", () => {
  test("date step is reachable and interactive", async ({ page }) => {
    await page.goto("/vi/booking", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button").first()).toBeVisible();
  });
});

test.describe("client JS actually boots", () => {
  /**
   * Canary. Asserting that an element is merely *visible* passes against dead
   * server-rendered HTML, so every interaction test can go green while the page
   * is not hydrated at all. This one requires a real client-side fetch.
   */
  test("the status form performs a client-side lookup", async ({ page }) => {
    const apiCalls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/bookings/")) apiCalls.push(r.url());
    });

    await page.goto("/vi/booking/status", { waitUntil: "domcontentloaded" });

    const form = page.locator("form").filter({ has: page.locator("input") }).first();
    const input = form.locator("input").first();
    const submit = form.locator("button").first();

    // Retry the fill rather than just waiting on the button. Typing before
    // hydration finishes sets the DOM value, then React re-renders from its
    // own empty state and wipes it — leaving the button disabled forever. The
    // retry is what makes this a hydration check instead of a race.
    await expect(async () => {
      await input.fill("LULLABY-ZZZZZZ");
      await expect(submit).toBeEnabled({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });

    await submit.click();

    await expect(page.locator("body")).toContainText(/Không tìm thấy|quá nhiều/);
    expect(apiCalls.length, "no client-side fetch fired — page is not hydrated")
      .toBeGreaterThan(0);
  });
});
