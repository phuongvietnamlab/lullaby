import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs/promises";

/**
 * VP-01 was nearly signed off against a tautology, twice over.
 *
 * First trap: Chromium only reads the meta viewport tag when the context sets
 * isMobile: true. Left at its default the tag is ignored entirely, so any
 * width reading is just the emulated window size. The control test below pins
 * that down by measuring a document with no tag at all.
 *
 * Second trap, and the one that actually bit: document.documentElement
 * .clientWidth is NOT evidence for VP-01 on this codebase. Next 16 emits a
 * default "width=device-width, initial-scale=1" for every App Router layout
 * (node_modules/next/dist/lib/metadata/default-metadata.js createDefaultViewport),
 * so /admin/login measured 375px before the viewport export existed and 375px
 * after. Measured, not assumed — both rows are in 12-VP01-PROBE.json.
 *
 * So the pass/fail criterion is the part of the tag Next does NOT default:
 * maximum-scale=5 and viewport-fit=cover. Neither token appears in the recorded
 * pre-fix reading, and deleting either field from src/app/admin/layout.tsx turns
 * this spec red. clientWidth is still recorded as data; it is simply not a gate.
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

/**
 * The two tokens VP-01 actually contributes. Next defaults width and
 * initial-scale on its own, so asserting those would pass with the export
 * deleted — which is exactly how the original clientWidth criterion failed.
 * Each token maps to one field of the export: maximumScale and viewportFit.
 */
const VP01_TOKENS = ["maximum-scale=5", "viewport-fit=cover"] as const;

/** Which VP-01 tokens a rendered meta tag carries. Order follows VP01_TOKENS. */
function vp01TokensIn(metaContent: string | null): string[] {
  return VP01_TOKENS.filter((token) => (metaContent ?? "").includes(token));
}

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

  const present = vp01TokensIn(metaViewportContent);

  // Self-labelling by the fix's own signature instead of an environment
  // variable: these tokens can only come from the viewport export VP-01 adds
  // (D-10), and setting an env var per run needs shell syntax that differs
  // between PowerShell and bash.
  captured = {
    phase: present.length === VP01_TOKENS.length ? "post-fix" : "pre-fix",
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
    'the probe ran without isMobile: true, so Chromium ignored the meta viewport tag and every reading is meaningless; set isMobile on the "probe" project in playwright.config.ts'
  ).toBe(true);

  // THE VP-01 GATE. Asserted against the live page rather than against the
  // persisted rows, so deleting a field from the export cannot be hidden by a
  // stale post-fix row sitting in the artifact.
  const missing = VP01_TOKENS.filter((token) => !present.includes(token));
  expect(
    missing,
    `${ROUTE} served meta[name=viewport]="${metaViewportContent}", which is missing ` +
      `${missing.join(" and ")}. Each token maps to one field of the viewport export in ` +
      `src/app/admin/layout.tsx: maximum-scale=5 <- maximumScale: 5, viewport-fit=cover <- ` +
      `viewportFit: "cover". Restore the field rather than relaxing this assertion — ` +
      `clientWidth cannot substitute for it, because Next defaults width=device-width and ` +
      `the pre-fix row in 12-VP01-PROBE.json measured the same 375px without the export.`
  ).toEqual([]);
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

  // The pre-fix row is history and can never be legitimately re-measured now
  // that VP-01 is in the tree — a run that lacks the tokens today is a
  // regression, not a fresh baseline. Keep the original reading and let the gate
  // in the test report the regression instead of quietly rewriting the evidence.
  const overwritesHistory =
    row.phase === "pre-fix" && rows.some((r) => r.phase === "pre-fix");
  if (!overwritesHistory) {
    rows = rows.filter((r) => r.phase !== row.phase);
    rows.push(row);
    rows.sort((a, b) =>
      a.phase === b.phase ? 0 : a.phase === "pre-fix" ? -1 : 1
    );
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  await fs.writeFile(MD_PATH, renderMarkdown(rows), "utf8");

  const pre = rows.find((r) => r.phase === "pre-fix");
  const post = rows.find((r) => r.phase === "post-fix");
  if (!pre || !post) return;

  // Proves the gate in the test is not vacuous. The gate demands both tokens;
  // this shows the pre-fix page carried neither, so the demand is one the
  // codebase genuinely failed before VP-01. If a future Next release starts
  // defaulting these tokens the recorded pre-fix row would gain them, and this
  // line goes red to say the gate has stopped discriminating.
  expect(
    vp01TokensIn(pre.metaViewportContent),
    `VP-01 gate is no longer discriminating: the pre-fix reading ` +
      `${JSON.stringify(pre.metaViewportContent)} already carries ` +
      `${vp01TokensIn(pre.metaViewportContent).join(" and ")}, so requiring those tokens ` +
      `would have passed without the fix. Pick a criterion the pre-fix page fails before ` +
      `trusting any Phase 12 number. (post-fix reading: ${JSON.stringify(
        post.metaViewportContent
      )})`
  ).toEqual([]);
});

function renderMarkdown(rows: ProbeRow[]): string {
  const pre = rows.find((r) => r.phase === "pre-fix");
  const post = rows.find((r) => r.phase === "post-fix");

  const instrumentProven =
    controlClientWidth !== null && String(controlClientWidth) !== VIEWPORT.split("x")[0];

  const preTokens = pre ? vp01TokensIn(pre.metaViewportContent) : [];
  const postTokens = post ? vp01TokensIn(post.metaViewportContent) : [];

  let verdict: string;
  if (!pre || !post) {
    verdict =
      "**INCOMPLETE** — only one run recorded so far; the comparison needs both a pre-fix and a post-fix row.";
  } else if (postTokens.length === VP01_TOKENS.length && preTokens.length === 0) {
    verdict =
      `**DISCRIMINATING** — the post-fix tag carries \`${VP01_TOKENS.join("` and `")}\`; the ` +
      `pre-fix tag carried neither. Deleting \`maximumScale\` or \`viewportFit\` from ` +
      `\`src/app/admin/layout.tsx\` turns the probe red, so the check can fail and therefore ` +
      `means something.`;
  } else if (postTokens.length !== VP01_TOKENS.length) {
    verdict =
      `**REGRESSION** — the post-fix tag is missing ` +
      `\`${VP01_TOKENS.filter((t) => !postTokens.includes(t)).join("` and `")}\`. Restore the ` +
      `matching field on the viewport export in \`src/app/admin/layout.tsx\`.`;
  } else {
    verdict =
      `**NOT DISCRIMINATING** — the pre-fix tag already carried ` +
      `\`${preTokens.join("` and `")}\`, so requiring those tokens would have passed without ` +
      `the fix. Pick a criterion the pre-fix page fails.`;
  }

  const clientWidthNote =
    pre && post && pre.documentElementClientWidth === post.documentElementClientWidth
      ? `\`documentElement.clientWidth\` is recorded below but is **not** the criterion: it read ` +
        `${pre.documentElementClientWidth}px both before and after VP-01, because Next already ` +
        `emits a default \`width=device-width, initial-scale=1\` for every App Router layout ` +
        `(\`next/dist/lib/metadata/default-metadata.js\` → \`createDefaultViewport\`). The ` +
        `~980px admin defect the roadmap described never existed;` +
        `${instrumentProven ? ` the control below measures ${controlClientWidth}px, which is what a page with no tag actually looks like.` : ""}`
      : "`documentElement.clientWidth` is recorded below as data, not as the pass/fail criterion.";

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
    "tag is honoured. One row was captured before VP-01 landed and one after; the pre-fix row is",
    "preserved verbatim on every later run, because it can no longer be re-measured.",
    "",
    `Criterion: the rendered tag must carry \`${VP01_TOKENS.join("` and `")}\`.`,
    "",
    "## Verdict",
    "",
    verdict,
    "",
    clientWidthNote,
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
        `${VIEWPORT.split("x")[0]}px. Chromium is therefore reading the tag, and the equal ` +
        `clientWidth readings above reflect Next's default viewport rather than a blind probe.`,
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
