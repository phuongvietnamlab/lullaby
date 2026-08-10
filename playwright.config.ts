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
// Same gate for the VP-02 measuring pass. It also decides which server gets
// started below, so a run that is not "npm run test:measure" can neither collect
// the measure spec nor pay for a production build.
const MEASURE = LIFECYCLE === "test:measure";

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
    // The VP-02 measuring pass; only exists under "npm run test:measure", so it
    // stays out of the default 86-test suite and out of its runtime budget.
    //
    // No viewport / isMobile here on purpose. The two passes D-06 asks for are
    // declared with test.use() inside two test.describe blocks in the spec
    // itself, because isMobile is a CONTEXT-level option: page.setViewportSize()
    // cannot change it, so the "parameterised loop" option CONTEXT.md left open
    // is unusable — the 375px pass would silently run in desktop mode. Two
    // separate projects would work but do not reliably share module scope, which
    // would force two partial artifacts plus a teardown project to merge them.
    // With fullyParallel: false and workers: 1, two describes in ONE file give
    // one accumulator, one afterAll and one artifact — D-06's "one run", exactly.
    ...(MEASURE
      ? [
          {
            name: "measure",
            testMatch: /admin-measure\.spec\.ts/,
            dependencies: ["setup"],
            use: { storageState: ADMIN_STATE },
          },
        ]
      : []),
  ],
  // Measure runs on a production build (D-08) but on the SAME port as everything
  // else, and that is deliberate. The setup project signs in with a relative URL
  // resolved against its own project baseURL (auth.setup.ts:17); on a different
  // port the cookie would be scoped to the wrong domain+port, all 16
  // authenticated routes would redirect to /admin/login, and the artifact would
  // hold 16 measurements of the login page while looking perfectly well-formed.
  // The cost of sharing the port is that reuseExistingServer: false makes an
  // already-running dev server on :3000 fail as a busy port — a loud failure,
  // which is the point: the alternative is silently measuring the dev server.
  // 600_000 covers a cold build, since "npm run build" runs prisma generate
  // before next build.
  webServer: MEASURE
    ? {
        command: `npm run build && npx next start -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 600_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : {
        command: `npx next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
