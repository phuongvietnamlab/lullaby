import { test, expect } from "@playwright/test";

/**
 * The counterpart to admin-auth.spec.ts: locking the admin APIs must not have
 * locked out real staff. Requires the seeded SUPER_ADMIN account
 * (scripts/seed-auth.ts). Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to override.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@lullaby.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

test.describe("signed-in staff", () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post("/api/auth/sign-in/email", {
      data: { email: EMAIL, password: PASSWORD },
    });
    if (res.status() !== 200) {
      test.skip(
        true,
        `No usable admin account (sign-in returned ${res.status()}). Run: npx tsx scripts/seed-auth.ts`
      );
    }
  });

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

  test("dashboard page renders for a signed-in admin", async ({ page, context }) => {
    const res = await context.request.post("/api/auth/sign-in/email", {
      data: { email: EMAIL, password: PASSWORD },
    });
    test.skip(res.status() !== 200, "No usable admin account");

    await page.goto("/admin/bookings", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
});
