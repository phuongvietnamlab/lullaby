import { test, expect } from "@playwright/test";

/**
 * The counterpart to admin-auth.spec.ts: locking the admin APIs must not have
 * locked out real staff. Requires the seeded SUPER_ADMIN account
 * (scripts/seed-auth.ts). Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to override.
 *
 * Everything runs on `context.request` so the API calls and the page share one
 * cookie jar — the standalone `request` fixture has its own jar, and
 * `page.request` sends a page Origin that better-auth rejects.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@lullaby.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

test.describe("signed-in staff", () => {
  test.beforeEach(async ({ context }) => {
    const res = await context.request.post("/api/auth/sign-in/email", {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(
      res.status(),
      `sign-in failed (${res.status()}). Seed an admin: npx tsx scripts/seed-auth.ts`
    ).toBe(200);
  });

  test("admin APIs return data once signed in", async ({ context }) => {
    for (const url of [
      "/api/admin/bookings",
      "/api/admin/dashboard",
      "/api/admin/rooms",
      "/api/admin/blog",
      "/api/admin/gallery",
    ]) {
      const res = await context.request.get(url);
      expect(res.status(), `${url} for a signed-in admin`).toBe(200);
    }
  });

  test("payment settings never return the raw hash secret", async ({ context }) => {
    const res = await context.request.get("/api/admin/payment");
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
