import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs/promises";
import { execSync } from "child_process";
import { ADMIN_ROUTES, SENSITIVE_NOTE, type AdminRoute } from "./admin-routes";
import { buildUrl, scanPage, settle, type PageScan } from "./measure-lib";

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
 * Output:
 *   .planning/phases/12-viewport-foundation-real-defect-baseline/12-DEFECTS.json
 *   .planning/phases/12-viewport-foundation-real-defect-baseline/12-DEFECTS.md
 *     (the .md summary is Plan 04's; this file writes the JSON)
 */

const OUT_DIR = path.resolve(
  __dirname,
  "../../.planning/phases/12-viewport-foundation-real-defect-baseline"
);
const JSON_PATH = path.join(OUT_DIR, "12-DEFECTS.json");

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
let measuredBaseURL: string | null = null;

/**
 * The two D-06 passes, declared once each and then used twice: once as the
 * context options of a test.describe, and once as the viewport record written
 * into the artifact. Two hand-maintained copies of these numbers is the exact
 * failure mode this whole milestone is about (Phase 15 criterion 4).
 *
 * isMobile is the ONE switch that makes Chromium read the meta viewport tag at
 * all. Left at its default the tag is ignored, documentElement.clientWidth
 * reports the emulated width with or without VP-01, and every mobile reading in
 * 12-DEFECTS.json becomes a restatement of the number we typed in. Measured, not
 * assumed: 12-VP01-PROBE.md records a tagless document at 980px in the same
 * emulation.
 *
 * Written out by hand rather than spread from Playwright's built-in iPhone 13
 * device profile: that profile carries defaultBrowserType "webkit", so spreading
 * it would silently swap the browser out from under a baseline REQUIREMENTS.md:10
 * pins to Chromium.
 */
const MOBILE_PASS = {
  viewport: { width: 375, height: 667 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
};

const DESKTOP_PASS = {
  viewport: { width: 1440, height: 900 },
  isMobile: false,
  hasTouch: false,
  deviceScaleFactor: 1,
};

type ViewportId = "375x667" | "1440x900";

type RouteMeasurement = {
  path: string;
  url: string;
  auth: AdminRoute["auth"];
  status: "measured" | "skipped" | "error";
  skipReason: string | null;
  scan: PageScan | null;
  /** Plan 04 fills these in; an empty array here means "not measured yet". */
  modals: unknown[];
};

/**
 * One accumulator for both passes, which is what makes this "one run" in D-06's
 * sense. Safe without locking for the same reason the module-scope state above
 * is: fullyParallel is false, workers is 1, and every test lives in this one
 * file, so they run sequentially in a single worker.
 */
const results: Record<ViewportId, RouteMeasurement[]> = {
  "375x667": [],
  "1440x900": [],
};

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
  // Captured here rather than in afterAll: test.info() is bound to a running
  // test, and the artifact has to record which server these numbers came from.
  measuredBaseURL = test.info().project.use.baseURL ?? null;
  console.log(
    `[preflight] worker=${test.info().workerIndex} pid=${process.pid} buildMode=${buildMode} ok=${preflightOk} blogPostId=${
      blogPostId ?? "none (blog table is empty — the 3 ?id= routes will be skipped, not measured)"
    }`
  );
});

/**
 * The body every measuring test shares.
 *
 * The assertions here are all about the MEASUREMENT being valid — the right URL,
 * the right page, VP-01's own evidence. Nothing about overflow, touch-target
 * size or font size is asserted anywhere: those are the numbers this phase is
 * gathering, and turning them into a gate is Phase 13/14/15's job. A harness
 * that failed on the defects it is supposed to catalogue would stop at the first
 * one and catalogue nothing.
 */
async function measureRoute(
  page: Page,
  viewportId: ViewportId,
  isMobileEmulation: boolean,
  route: AdminRoute
): Promise<void> {
  expect(
    preflightOk,
    `the preflight test did not run or went red in this worker (worker=${test.info().workerIndex} pid=${process.pid}), so neither the build mode nor the admin session has been established — refusing to record measurements that cannot be trusted`
  ).toBe(true);

  if (route.needsId === "blogPost" && blogPostId === null) {
    const skipReason =
      `GET /api/admin/blog returned 0 posts, so there is no ?id= to load ${route.path} with. ` +
      `This route's baseline is MISSING, not clean: seed a blog post and re-run ` +
      `"npm run test:measure".`;
    results[viewportId].push({
      path: route.path,
      url: route.path,
      auth: route.auth,
      status: "skipped",
      skipReason,
      scan: null,
      modals: [],
    });
    // Recorded BEFORE skipping. Writing zero defects for a route that was never
    // measured is the fastest way to let a real defect through a whole milestone.
    test.skip(true, skipReason);
    return;
  }

  const url = buildUrl(route, blogPostId);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settle(page, route);

  // Pitfall 9. A stale or wrongly-scoped session makes every authenticated route
  // redirect to /admin/login, and the artifact then holds 16 well-formed
  // measurements of the same login page.
  expect(
    new URL(page.url()).pathname,
    `asked for ${url} and landed on ${page.url()}. A redirect to /admin/login means the session did not reach the measured server — check that the setup project signed in on the same port this pass is measuring (playwright.config.ts PORT).`
  ).toBe(route.path);

  if (route.auth === "authenticated") {
    expect(
      await page.locator("aside").count(),
      `${route.path} rendered no sidebar. AdminShell always renders one <aside> (admin-shell.tsx:92); zero of them means this is the login page wearing the wrong route's name, not an admin page with a clean layout.`
    ).toBe(1);
  }

  const scan = await scanPage(page, route, isMobileEmulation);

  if (viewportId === "375x667") {
    // VP-01 evidence, layer 1: the tag itself. maximum-scale=5 is the token Next
    // does NOT default, so it is the half of this assertion that can fail —
    // width=device-width would pass with the export deleted (12-VP01-PROBE.md).
    expect(
      scan.viewportProof.metaViewportContent,
      `${route.path} served meta[name=viewport]="${scan.viewportProof.metaViewportContent}". src/app/admin/layout.tsx must export const viewport (VP-01).`
    ).toContain("width=device-width");
    expect(
      scan.viewportProof.metaViewportContent,
      `${route.path} served meta[name=viewport]="${scan.viewportProof.metaViewportContent}", which is missing maximum-scale=5 — the token that maps to maximumScale: 5 on the viewport export in src/app/admin/layout.tsx. Restore the field rather than relaxing this.`
    ).toContain("maximum-scale=5");

    // Layer 2: recorded as data and asserted only as a sanity check on the
    // emulation. It is NOT evidence for VP-01 — it reads 375 with the export
    // deleted too. If this fails, isMobile is not in effect.
    expect(
      scan.viewportProof.documentElementClientWidth,
      `${route.path} laid out at ${scan.viewportProof.documentElementClientWidth}px inside a 375px emulation, so the meta viewport tag is not being honoured and every mobile number in this run is meaningless`
    ).toBe(375);

    if (route.auth === "authenticated") {
      // Layer 3: the sm:/lg: variants really are resolving against a 375px
      // screen. lg:static has NOT engaged and -translate-x-full is applied, so
      // the sidebar is the off-canvas drawer rather than a fixed column
      // (ROADMAP criterion 2).
      expect(
        scan.viewportProof.sidebarPosition,
        `${route.path} computed position: ${scan.viewportProof.sidebarPosition} on <aside> at 375px. "fixed" is expected; "static" means the lg: breakpoint engaged, so the page is being measured at desktop width.`
      ).toBe("fixed");
      // Geometry, not a named CSS property. The plan asked for
      // transform ~ "-256"; measured, that reads "none", because Tailwind v4
      // compiles -translate-x-full to the standalone `translate` property
      // instead of a transform function. Asserting on the box states the claim
      // itself — the drawer is off the left edge of the screen — and survives
      // whichever property the next Tailwind major picks. Both computed strings
      // are still recorded in the artifact.
      const sidebarBox = scan.viewportProof.sidebarBox;
      expect(sidebarBox, `${route.path}: <aside> reported no box`).not.toBeNull();
      expect(
        (sidebarBox?.x ?? 0) + (sidebarBox?.width ?? 0),
        `${route.path}: <aside> sits at x=${sidebarBox?.x} width=${sidebarBox?.width} at 375px, so its right edge is on screen. -translate-x-full should push the w-64 drawer fully off the left edge. computed transform=${scan.viewportProof.sidebarTransform}, translate=${scan.viewportProof.sidebarTranslate}.`
      ).toBeLessThanOrEqual(0);
    }
  } else if (route.auth === "authenticated") {
    // ROADMAP criterion 5 — desktop is unchanged — answered by a number from the
    // same run as the mobile baseline rather than by a separate manual check.
    expect(
      scan.viewportProof.sidebarPosition,
      `${route.path} computed position: ${scan.viewportProof.sidebarPosition} on <aside> at 1440px. "static" is expected: the sidebar must go back to being a fixed column of the desktop layout.`
    ).toBe("static");
  }

  results[viewportId].push({
    path: route.path,
    url,
    auth: route.auth,
    status: "measured",
    skipReason: null,
    scan,
    modals: [],
  });
}

/**
 * One test() per (viewport, route), never one test looping 17 routes: the 60s
 * timeout in playwright.config.ts is PER TEST, so a combined test would blow
 * through it and one broken route would take the whole pass down with it.
 *
 * The route path appears verbatim in each title so `--grep "/admin/gallery"`
 * selects exactly that route in both passes. Plan 04 depends on that property.
 */
function declareRoutes(viewportId: ViewportId, isMobileEmulation: boolean): void {
  test.describe("authenticated routes", () => {
    for (const route of ADMIN_ROUTES.filter((r) => r.auth === "authenticated")) {
      test(`measure ${route.path}`, async ({ page }) => {
        await measureRoute(page, viewportId, isMobileEmulation, route);
      });
    }
  });

  test.describe("anonymous", () => {
    /**
     * An explicit empty state. Passing `undefined` here instead would NOT work.
     *
     * An undefined value does not override a project-level session — it reads as
     * "not specified" and the project's value stands (Playwright #17396,
     * #15977, #26374). /admin/login would then be measured signed-in, which is a
     * different page from the one D-03 asks for. Nested test.use merges, so the
     * viewport and isMobile of the enclosing pass still apply.
     */
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const route of ADMIN_ROUTES.filter((r) => r.auth === "anonymous")) {
      test(`measure ${route.path}`, async ({ page }) => {
        // Proof rather than trust: if the override silently failed, this is
        // cheaper to read than working out afterwards why the login page had a
        // sidebar. Checked before goto, so no signed-in request is ever made.
        expect(
          (await page.context().cookies()).length,
          `the context measuring ${route.path} still carries cookies, so the empty storageState did not take effect and this route is about to be measured with a staff session`
        ).toBe(0);

        await measureRoute(page, viewportId, isMobileEmulation, route);
      });
    }
  });
}

test.describe("375x667 mobile pass", () => {
  test.use(MOBILE_PASS);
  declareRoutes("375x667", MOBILE_PASS.isMobile);
});

test.describe("1440x900 desktop pass", () => {
  test.use(DESKTOP_PASS);
  declareRoutes("1440x900", DESKTOP_PASS.isMobile);
});

/** Installed version of a dependency, or null — the artifact must not fail over this. */
async function packageVersion(name: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(
      path.resolve(__dirname, "..", "node_modules", name, "package.json"),
      "utf8"
    );
    const parsed: { version?: string } = JSON.parse(raw);
    return parsed.version ?? null;
  } catch {
    return null;
  }
}

function headCommit(): string | null {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/**
 * A route with no entry at all was never reached — a crash between goto and the
 * push. It is recorded as "error", not omitted: a missing row reads as "clean"
 * to anything that iterates the artifact.
 */
function measurementFor(viewportId: ViewportId, route: AdminRoute): RouteMeasurement {
  const found = results[viewportId].find((entry) => entry.path === route.path);
  if (found) return found;
  return {
    path: route.path,
    url: route.path,
    auth: route.auth,
    status: "error",
    skipReason:
      "no measurement was recorded for this route in this pass — the test did not reach the point where it pushes a result. Treat as NOT MEASURED, never as zero defects.",
    scan: null,
    modals: [],
  };
}

/**
 * Playwright starts a FRESH WORKER PROCESS after every failed test — measured,
 * not assumed: a red run logs worker=2, worker=3, worker=4 ... one per failure.
 * A new process means a new module instance, so `results`, `blogPostId` and
 * `buildMode` all reset, and this afterAll then runs once per worker.
 *
 * On a green run that is invisible: one worker, one afterAll, one artifact,
 * which is D-06's "one run" exactly. On a red run it means the last worker —
 * which measured nothing — would otherwise overwrite a good artifact with 34
 * rows of status: "error". So the write is refused when this worker recorded no
 * measurement at all, and every write carries its own completeness counts.
 */
test.afterAll(async () => {
  const measurements = ADMIN_ROUTES.flatMap((route) => [
    measurementFor("375x667", route),
    measurementFor("1440x900", route),
  ]);
  const measuredCount = measurements.filter((m) => m.status === "measured").length;
  const skippedCount = measurements.filter((m) => m.status === "skipped").length;
  const errorCount = measurements.filter((m) => m.status === "error").length;

  if (measuredCount === 0) {
    console.log(
      `[artifact] worker=${test.info().workerIndex} recorded no measurements; refusing to overwrite ${JSON_PATH} with an all-error artifact. Playwright restarts the worker after a failed test, so this is the tail of a red run — fix the failure and re-run.`
    );
    return;
  }

  const artifact = {
    schemaVersion: 1,
    /** false means this file is a partial record — do not read it as a baseline. */
    runComplete: errorCount === 0,
    counts: { measured: measuredCount, skipped: skippedCount, error: errorCount },
    measuredAt: new Date().toISOString(),
    supersedes:
      "Every pre-VP-02 figure quoted for the admin panel, including the scoping-era " +
      '"12 settings inputs at 38-39px". Those numbers were never produced by a systematic ' +
      "pass over the route set on a production build. This file is the authoritative " +
      "baseline; do not merge it with an older list.",
    sensitiveNote: SENSITIVE_NOTE,
    build: {
      // Set by the preflight test from what it observed, never hardcoded: the
      // whole point of that guard is that config can lie about which server is up.
      mode: buildMode,
      baseURL: measuredBaseURL,
      nextVersion: await packageVersion("next"),
      playwrightVersion: await packageVersion("@playwright/test"),
      commit: headCommit(),
    },
    blogPostId,
    viewports: [
      {
        id: "375x667",
        width: MOBILE_PASS.viewport.width,
        height: MOBILE_PASS.viewport.height,
        isMobile: MOBILE_PASS.isMobile,
        deviceScaleFactor: MOBILE_PASS.deviceScaleFactor,
      },
      {
        id: "1440x900",
        width: DESKTOP_PASS.viewport.width,
        height: DESKTOP_PASS.viewport.height,
        isMobile: DESKTOP_PASS.isMobile,
        deviceScaleFactor: DESKTOP_PASS.deviceScaleFactor,
      },
    ],
    routes: ADMIN_ROUTES.map((route) => ({
      path: route.path,
      auth: route.auth,
      sensitive: route.sensitive === true,
      measurements: {
        "375x667": measurementFor("375x667", route),
        "1440x900": measurementFor("1440x900", route),
      },
    })),
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(
    `[artifact] wrote ${JSON_PATH} — ${artifact.routes.length} routes x 2 viewports; measured=${measuredCount} skipped=${skippedCount} error=${errorCount} complete=${artifact.runComplete}`
  );
});
