import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs/promises";

/**
 * The VP-01 check was about to be a tautology. Chromium only reads the meta
 * viewport tag when the browser context sets isMobile: true; left at its
 * default of false the tag is ignored, so document.documentElement.clientWidth
 * reports 375 whether or not src/app/admin/layout.tsx exports a viewport.
 * "The admin panel now lays out at device width" would then pass just as
 * loudly before the fix as after it, and Phases 13-15 would be planned on a
 * number that proves nothing.
 *
 * This probe measures /admin/login once at 375x667 with isMobile: true and
 * appends the reading to the phase directory. Run it once before VP-01 lands
 * and once after: the afterAll hook compares the two rows and fails if they are
 * identical. That comparison is the only evidence that the VP-01 check can fail
 * at all — it calibrates the instrument, it does not measure the defect.
 *
 * Runs in the "probe" project, which only exists when npm_lifecycle_event is
 * "test:probe", so it never joins the default suite.
 *
 * Output:
 *   .planning/phases/12-viewport-foundation-real-defect-baseline/12-VP01-PROBE.json
 *   .planning/phases/12-viewport-foundation-real-defect-baseline/12-VP01-PROBE.md
 */

const OUT_DIR = path.resolve(
  __dirname,
  "../../.planning/phases/12-viewport-foundation-real-defect-baseline"
);
const JSON_PATH = path.join(OUT_DIR, "12-VP01-PROBE.json");
const MD_PATH = path.join(OUT_DIR, "12-VP01-PROBE.md");

/**
 * The probe deliberately rides the existing dev-server webServer block: it is
 * an instrument calibration, not the D-08 measuring pass. Both runs must report
 * the same serverMode or the pre/post difference is server noise rather than
 * evidence, which is why the value is written into every row.
 */
const SERVER_MODE = "dev";
const ROUTE = "/admin/login";
const VIEWPORT = "375x667";

type ProbeRow = {
  phase: "pre-fix" | "post-fix";
  measuredAt: string;
  serverMode: string;
  route: string;
  viewport: string;
  isMobileEmulation: boolean;
  metaViewportContent: string | null;
  documentElementClientWidth: number;
  windowInnerWidth: number;
  visualViewportWidth: number | null;
  visualViewportScale: number | null;
  devicePixelRatio: number;
};

let captured: ProbeRow | null = null;
let controlClientWidth: number | null = null;

/**
 * Instrument control, and the only thing that separates "the probe is blind" from
 * "the defect VP-01 was written against does not exist".
 *
 * A document with genuinely no meta viewport must NOT measure the emulated width,
 * because that is what an ignored tag looks like. If this passes while the
 * pre/post comparison below reports identical numbers, the probe reads the tag
 * correctly and the two readings match for a substantive reason.
 *
 * The reading goes into the Markdown view only. 12-VP01-PROBE.json stays a
 * two-row pre/post record; this measures a synthetic page, not a route.
 */
test("control: a document with no meta viewport does not measure the emulated width", async ({
  page,
}) => {
  const emulatedWidth = test.info().project.use.viewport?.width;

  await page.setContent("<!doctype html><title>control</title><p>control</p>");
  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth
  );
  controlClientWidth = clientWidth;

  expect(
    clientWidth,
    `a page with NO meta viewport measured ${clientWidth}px, the same as the emulated ` +
      `width — Chromium is ignoring the tag, so isMobile is not in effect on the "probe" ` +
      `project and every reading in 12-VP01-PROBE.json is meaningless`
  ).not.toBe(emulatedWidth);
});

test("probe /admin/login viewport at 375 (isMobile)", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Loading");

  // A silent redirect would measure some other page, and the pre/post numbers
  // would then differ for a reason that has nothing to do with VP-01.
  expect(
    page.url(),
    `probe landed on ${page.url()} instead of ${ROUTE}; measure the login page or the comparison is meaningless`
  ).toContain(ROUTE);

  const meta = page.locator('meta[name="viewport"]');
  const metaViewportContent =
    (await meta.count()) > 0 ? await meta.first().getAttribute("content") : null;

  const measured = await page.evaluate(() => ({
    documentElementClientWidth: document.documentElement.clientWidth,
    windowInnerWidth: window.innerWidth,
    visualViewportWidth: window.visualViewport?.width ?? null,
    visualViewportScale: window.visualViewport?.scale ?? null,
    devicePixelRatio: window.devicePixelRatio,
  }));

  // Self-labelling by the fix's own signature instead of an environment
  // variable: "maximum-scale=5" can only come from the viewport export VP-01
  // adds (D-10), and setting an env var per run needs shell syntax that differs
  // between PowerShell and bash.
  captured = {
    phase: metaViewportContent?.includes("maximum-scale=5")
      ? "post-fix"
      : "pre-fix",
    measuredAt: new Date().toISOString(),
    serverMode: SERVER_MODE,
    route: ROUTE,
    viewport: VIEWPORT,
    isMobileEmulation: test.info().project.use.isMobile === true,
    metaViewportContent,
    ...measured,
  };

  expect(
    captured.isMobileEmulation,
    'the probe ran without isMobile: true, so Chromium ignored the meta viewport tag and every number below is meaningless; set isMobile on the "probe" project in playwright.config.ts'
  ).toBe(true);
});

test.afterAll(async () => {
  const row = captured;
  if (!row) return;

  let rows: ProbeRow[] = [];
  try {
    const existing = await fs.readFile(JSON_PATH, "utf8");
    const parsed: unknown = JSON.parse(existing);
    if (Array.isArray(parsed)) rows = parsed as ProbeRow[];
  } catch {
    rows = [];
  }

  rows = rows.filter((r) => r.phase !== row.phase);
  rows.push(row);
  rows.sort((a, b) => (a.phase === b.phase ? 0 : a.phase === "pre-fix" ? -1 : 1));

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  await fs.writeFile(MD_PATH, renderMarkdown(rows), "utf8");

  const pre = rows.find((r) => r.phase === "pre-fix");
  const post = rows.find((r) => r.phase === "post-fix");
  if (!pre || !post) return;

  // No expected pre-fix constant anywhere: the classic "~980px" figure is
  // contradicted by its own sources, so this compares the two readings instead
  // of asserting either one.
  expect(
    pre.documentElementClientWidth,
    `VP-01 probe is NOT discriminating: pre-fix and post-fix both measured ` +
      `documentElement.clientWidth = ${pre.documentElementClientWidth}px at ${VIEWPORT} ` +
      `(pre meta=${JSON.stringify(pre.metaViewportContent)}, post meta=${JSON.stringify(
        post.metaViewportContent
      )}). A check that passes without the fix proves nothing. Investigate isMobile ` +
      `on the "probe" project in playwright.config.ts before trusting any Phase 12 number.`
  ).not.toBe(post.documentElementClientWidth);
});

function renderMarkdown(rows: ProbeRow[]): string {
  const pre = rows.find((r) => r.phase === "pre-fix");
  const post = rows.find((r) => r.phase === "post-fix");

  const instrumentProven =
    controlClientWidth !== null && String(controlClientWidth) !== VIEWPORT.split("x")[0];

  let verdict: string;
  if (!pre || !post) {
    verdict =
      "**INCOMPLETE** — only one run recorded so far; the comparison needs both a pre-fix and a post-fix row.";
  } else if (
    pre.documentElementClientWidth !== post.documentElementClientWidth
  ) {
    verdict =
      `**DISCRIMINATING** — ${pre.documentElementClientWidth}px before VP-01, ` +
      `${post.documentElementClientWidth}px after. The check can fail, so it means something.`;
  } else if (instrumentProven) {
    verdict =
      `**PREMISE FALSIFIED** — both runs measured ${pre.documentElementClientWidth}px, but the ` +
      `instrument control below proves the meta viewport tag IS being read. The admin panel was ` +
      `never laying out at ~980px: Next already emitted a default \`width=device-width, ` +
      `initial-scale=1\`, so \`clientWidth === 375\` cannot serve as evidence for VP-01. What the ` +
      `fix actually changed is the tag's content (\`maximum-scale=5\`, \`viewport-fit=cover\`); ` +
      `assert that instead.`;
  } else {
    verdict =
      `**NOT DISCRIMINATING** — both runs measured ${pre.documentElementClientWidth}px and the ` +
      `instrument control did not run or did not pass. Do not trust any Phase 12 measurement ` +
      `until this is explained.`;
  }

  const header = [
    "| phase | measuredAt | serverMode | route | viewport | isMobile | meta[name=viewport] | documentElement.clientWidth | window.innerWidth | visualViewport.width | visualViewport.scale | devicePixelRatio |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  const body = rows.map((r) =>
    [
      r.phase,
      r.measuredAt,
      r.serverMode,
      `\`${r.route}\``,
      r.viewport,
      String(r.isMobileEmulation),
      r.metaViewportContent === null ? "_(absent)_" : `\`${r.metaViewportContent}\``,
      String(r.documentElementClientWidth),
      String(r.windowInnerWidth),
      r.visualViewportWidth === null ? "_(n/a)_" : String(r.visualViewportWidth),
      r.visualViewportScale === null ? "_(n/a)_" : String(r.visualViewportScale),
      String(r.devicePixelRatio),
    ].join(" | ")
  );

  return [
    "# VP-01 probe — can the viewport check actually fail?",
    "",
    "> Generated by `hasana-hotel/e2e/viewport-probe.spec.ts` (`npm run test:probe`).",
    "> Do not edit by hand; re-run the probe instead.",
    "",
    `Route \`${ROUTE}\` at ${VIEWPORT}, Chromium with \`isMobile: true\` so the meta viewport`,
    "tag is honoured. One row is captured before VP-01 lands and one after.",
    "",
    "## Verdict",
    "",
    verdict,
    "",
    "## Readings",
    "",
    ...header,
    ...body.map((line) => `| ${line} |`),
    "",
    "## Instrument control",
    "",
    controlClientWidth === null
      ? "Not measured in this run."
      : `A synthetic document with **no** meta viewport, loaded in the same \`isMobile: true\` ` +
        `context, measured \`documentElement.clientWidth = ${controlClientWidth}px\` — not ` +
        `${VIEWPORT.split("x")[0]}px. Chromium is therefore reading the tag, and the two readings ` +
        `above are equal for a substantive reason rather than because the probe is blind.`,
    "",
    "## Scope limit",
    "",
    "This probe runs against the **dev server**, while D-08 requires the measuring pass to use a",
    "production build. It calibrates the VP-01 check; it does **not** on its own establish ROADMAP",
    "criterion 1. That credit belongs to Plan 03, which re-asserts the meta tag and the `aside`",
    "computed style across all 17 admin routes on a production build.",
    "",
  ].join("\n");
}
