import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Sign in once and save the session for every authenticated spec.
 *
 * Signing in per test tripped better-auth's rate limiter once the admin suite
 * grew, which surfaced as unrelated 401s across the run.
 */

export const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");

const EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@lullaby.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

setup("authenticate as admin", async ({ context }) => {
  const res = await context.request.post("/api/auth/sign-in/email", {
    data: { email: EMAIL, password: PASSWORD },
  });

  expect(
    res.status(),
    `sign-in failed (${res.status()}). Seed an admin: npx tsx scripts/seed-auth.ts`
  ).toBe(200);

  await context.storageState({ path: ADMIN_STATE });
});
