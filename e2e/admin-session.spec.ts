import { test, expect } from "@playwright/test";

/**
 * The counterpart to admin-auth.spec.ts: locking the admin APIs must not have
 * locked out real staff.
 *
 * Runs in the "authenticated" project, which reuses the single sign-in from
 * auth.setup.ts. Requires the seeded SUPER_ADMIN account
 * (npx tsx scripts/seed-auth.ts).
 */

test.describe("signed-in staff", () => {
  test("admin APIs return data once signed in", async ({ request }) => {
    for (const url of [
      "/api/admin/bookings",
      "/api/admin/dashboard",
      "/api/admin/rooms",
      "/api/admin/blog",
      "/api/admin/gallery",
    ]) {
      const res = await request.get(url);
      expect(res.status(), `${url} for a signed-in admin`).toBe(200);
    }
  });

  test("payment settings never return the raw hash secret", async ({ request }) => {
    const res = await request.get("/api/admin/payment");
    expect(res.status()).toBe(200);
    const { settings } = await res.json();
    const secret = settings?.vnpay_hash_secret;
    if (secret) {
      expect(String(secret)).toMatch(/•/);
    }
  });

  test("dashboard page renders for a signed-in admin", async ({ page }) => {
    await page.goto("/admin/bookings", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page.locator("body")).toContainText(/Bookings|Dashboard/i);
  });
});
