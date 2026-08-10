import { test, expect } from "@playwright/test";
import { ADMIN_ROUTES } from "./admin-routes";

/**
 * The VP-02 measuring harness. It REPORTS, it does not assert defects.
 *
 * Phase 12 exists because no systematic measurement of the admin route set has
 * ever been taken; Phase 13 and 14 are planned from the numbers this file
 * produces, and Phase 15 promotes them into a failing gate. That inverts the
 * usual risk: a wrong number here does not turn anything red, it quietly
 * misdirects three later phases. So every guard below asserts something about
 * the MEASUREMENT ENVIRONMENT rather than about the pages — a harness that
 * cannot prove it measured the right thing is worse than no harness.
 *
 * Runs in the "measure" project, which only exists when npm_lifecycle_event is
 * "test:measure", against a production build (D-08) started by the config's
 * webServer on the same port the setup project signs in on.
 *
 * Run it with: npm run test:measure
 *
 * Output (added in Plan 03):
 *   .planning/phases/12-viewport-foundation-real-defect-baseline/12-DEFECTS.json
 *   .planning/phases/12-viewport-foundation-real-defect-baseline/12-DEFECTS.md
 */

/**
 * Module-scope state, shared by every test in this file.
 *
 * Safe without any locking: fullyParallel is false, workers is 1, and all of
 * this lives in one file, so the tests run sequentially in a single worker.
 * That is also the whole reason D-06's two viewport passes are two describes in
 * this file rather than two projects — see the comment on the measure project in
 * playwright.config.ts.
 */
let blogPostId: string | null = null;
let preflightOk = false;
let buildMode: "production" | "dev" | "unknown" = "unknown";

test("route module sanity", () => {
  const paths = ADMIN_ROUTES.map((route) => route.path);

  expect(
    ADMIN_ROUTES.length,
    `e2e/admin-routes.ts declares ${ADMIN_ROUTES.length} routes; D-01 put all 17 admin routes in scope (the 10 named in REQUIREMENTS.md plus 7 sub-routes). A short list here silently shrinks the baseline AND the Phase 15 gate.`
  ).toBe(17);

  expect(
    new Set(paths).size,
    `${paths.length} entries collapse to ${new Set(paths).size} distinct paths — a duplicate would be measured twice and another route not at all`
  ).toBe(17);

  expect(
    ADMIN_ROUTES.filter((route) => route.auth === "anonymous").map((r) => r.path),
    "/admin/login is the only anonymous admin route (D-03); anything else marked anonymous would be measured signed-out and report a login page"
  ).toEqual(["/admin/login"]);

  const needsId = ADMIN_ROUTES.filter((route) => route.needsId === "blogPost");
  expect(
    needsId.map((route) => route.path),
    `${needsId.length} routes declare needsId; blog/edit, blog/history and blog/preview all read ?id= from the query string (D-02)`
  ).toHaveLength(3);

  const badPaths = paths.filter((path) => !path.startsWith("/admin"));
  expect(
    badPaths,
    `these paths are not under /admin: ${badPaths.join(", ")}`
  ).toEqual([]);

  // The failure this catches is Pitfall 3: every modal in this repo is a
  // div.fixed.inset-0 overlay wrapping the real panel, and inset-0 always
  // measures exactly the viewport. A panel selector that equals its own trigger,
  // or is empty, means TAP-02 gets a baseline of clean-looking nonsense.
  const brokenModals: string[] = [];
  for (const route of ADMIN_ROUTES) {
    for (const modal of route.modals ?? []) {
      if (!modal.panel) brokenModals.push(`${route.path}/${modal.name}: empty panel`);
      if (!modal.dismiss) brokenModals.push(`${route.path}/${modal.name}: empty dismiss`);
      if (modal.panel === modal.trigger) {
        brokenModals.push(
          `${route.path}/${modal.name}: panel equals trigger (${modal.panel})`
        );
      }
    }
  }
  expect(
    brokenModals,
    `modal specs must name a panel distinct from their trigger: ${brokenModals.join("; ")}`
  ).toEqual([]);
});

/**
 * A normal test(), deliberately not test.beforeAll.
 *
 * beforeAll only receives worker-scoped fixtures, so a context created there
 * with browser.newContext() does NOT inherit the signed-in state the measure
 * project declares — the admin session would be missing and every following
 * measurement would be taken on the login page. A plain test with
 * { page, context } is the only way to get the real session without
 * hand-building a context.
 *
 * This harness never serialises that session anywhere (T-12-07): it reads the
 * session, it never exports it.
 */
test("preflight: production build, admin session, blog post id", async ({
  page,
  context,
}) => {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  // Resource timing is what the HMR check reads, and it is empty at
  // domcontentloaded. Without this wait the check would look thorough and prove
  // nothing.
  await page.waitForLoadState("load");

  const devSignals = await page.evaluate(() => ({
    // Custom element injected by Next's dev overlay; absent from a production build.
    devOverlay: document.querySelector("nextjs-portal") !== null,
    hmrResources: performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => /hmr|react-refresh/i.test(name)),
  }));

  const isDev = devSignals.devOverlay || devSignals.hmrResources.length > 0;
  buildMode = isDev ? "dev" : "production";

  expect(
    isDev,
    `the measuring pass is running against the DEV server (nextjs-portal present: ${devSignals.devOverlay}; HMR resources: ${devSignals.hmrResources.slice(0, 3).join(", ") || "none"}). D-08 requires next build + next start, and dev numbers are unusable: unoptimised CSS, the dev overlay in the DOM, and Fast Refresh wrappers around components. Run it as "npm run test:measure" so the config starts a production server; do not relax this assertion.`
  ).toBe(false);

  const res = await context.request.get("/api/admin/blog");
  expect(
    res.status(),
    `GET /api/admin/blog returned ${res.status()}, so the admin session did not reach the server under measurement. 401 means the stored state is stale or absent — seed an admin and re-run: npx tsx scripts/seed-auth.ts. It can also mean the setup project signed in on a different port than the one being measured (Pitfall 9); both must be ${test.info().project.use.baseURL}.`
  ).toBe(200);

  const body: { posts?: Array<{ id: string }> } = await res.json();
  blogPostId = body.posts?.[0]?.id ?? null;

  // Deliberately NOT asserted. An empty blog table is a legitimate state; Plan 03
  // skips the three needsId routes with a loud reason and records them as
  // "skipped" in the artifact. Recording zero defects for a route that was never
  // measured is the fastest way to let a real defect through a whole milestone.
  preflightOk = true;
  console.log(
    `[preflight] buildMode=${buildMode} ok=${preflightOk} blogPostId=${
      blogPostId ?? "none (blog table is empty — the 3 ?id= routes will be skipped, not measured)"
    }`
  );
});
