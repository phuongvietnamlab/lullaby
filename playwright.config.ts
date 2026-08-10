import { defineConfig } from "@playwright/test";
import path from "path";

const PORT = Number(process.env.E2E_PORT || 3000);
// Must be "localhost", not "127.0.0.1": the Next dev server's HMR client binds
// to localhost and fails its websocket handshake over the loopback IP, which
// leaves the page un-hydrated. Every interaction test then passes vacuously
// against dead server-rendered HTML.
const BASE_URL = `http://localhost:${PORT}`;

const ADMIN_STATE = path.join(__dirname, "e2e", ".auth", "admin.json");

// npm sets npm_lifecycle_event to the name of the running script, so "npm run
// test:probe" is the only way the probe project comes into existence. Without a
// gate, "npx playwright test" runs EVERY declared project, so the one-off VP-01
// probe would wedge itself into the daily 86-test suite and rewrite its artifact
// on every run.
const LIFECYCLE = process.env.npm_lifecycle_event ?? "";
const PROBE = LIFECYCLE === "test:probe";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "off",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Specs that must be unauthenticated (401 guards, public pages)
      name: "anonymous",
      testMatch: /(admin-auth|booking|public-pages)\.spec\.ts/,
    },
    {
      // Specs that need a staff session, reusing the one sign-in from setup
      name: "authenticated",
      testMatch: /(admin-session|admin-pages|blog-and-settings)\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: ADMIN_STATE },
    },
    // Calibrates the VP-01 check itself; only exists under "npm run test:probe".
    // No storageState and no setup dependency on purpose: it only touches
    // /admin/login, which is anonymous, so no session cookie can reach the
    // artifact it writes.
    ...(PROBE
      ? [
          {
            name: "probe",
            testMatch: /viewport-probe\.spec\.ts/,
            // isMobile is the single switch that makes Chromium READ the meta
            // viewport tag. Left at its default of false the tag is ignored
            // entirely, documentElement.clientWidth reports 375 with or without
            // the fix, and "the admin panel lays out at device width" passes
            // before VP-01 exists — a tautology three later phases would be
            // planned on.
            use: {
              viewport: { width: 375, height: 667 },
              isMobile: true,
              hasTouch: true,
              deviceScaleFactor: 3,
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
