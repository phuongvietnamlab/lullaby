import { expect, type Page } from "@playwright/test";
import { type AdminRoute, type ModalKind } from "./admin-routes";

/**
 * The DOM sweep behind the VP-02 measuring pass.
 *
 * This is a plain .ts module, not a .spec.ts, for the same reason
 * admin-routes.ts is: every project overrides testMatch with a /\.spec\.ts/ or
 * /\.setup\.ts/ regex, so nothing here can be collected as a test.
 *
 * Why it is split out of admin-measure.spec.ts at all: the accumulator that
 * becomes 12-DEFECTS.json has to live in the SPEC's module scope, because only
 * one afterAll there can write one artifact for both viewport passes. The
 * measuring functions themselves are pure — page in, record out — and Phase 15
 * imports them again when the harness is promoted from a reporting pass into a
 * failing gate. Splitting them now is what stops Phase 15 from copy-pasting.
 *
 * It REPORTS, it does not assert defects. The only assertions in this file are
 * in settle(), and they are about the page being ready to measure, never about
 * whether the measurement is good news.
 */

/** TAP-01's threshold: the minimum touch target in CSS px. */
export const SUB_TARGET_PX = 44;

/**
 * TAP-03's threshold. iOS Safari zooms the page in when a text input smaller
 * than 16px receives focus, and does not zoom back out.
 */
export const IOS_ZOOM_THRESHOLD_PX = 16;

/**
 * Every element a person can operate, as one selector.
 *
 * The role-based half matters as much as the tag-based half: this repo builds
 * clickable <div>s in places (there is no design-system button), and a sweep of
 * `button, a` alone would report those pages as having no controls at all —
 * indistinguishable from a page with no defects.
 */
export const CONTROL_SELECTOR = [
  "a[href]",
  "button",
  'input:not([type="hidden"])',
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="tab"]',
  "summary",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Cap on the offender list written per route. The TOTAL is recorded separately
 * in overflowingElementCount, so truncating the list can never turn a page with
 * 300 overflowing nodes into a page that looks clean.
 */
export const MAX_OVERFLOW_ELEMENTS = 20;

/** Labels are identifiers here, not content; 40 chars is plenty to recognise one. */
export const MAX_LABEL_CHARS = 40;

/**
 * The one and only definition of what gets redacted out of a label.
 *
 * Declared as {source, flags} strings rather than as RegExp objects because it
 * has to cross page.evaluate's serialisation boundary: a RegExp does not
 * survive that trip, and a Node-side function cannot be handed to the browser
 * at all. The browser rebuilds the same expressions from these strings, which
 * is what lets the redaction run BEFORE any label leaves the page.
 *
 * commit_docs is true for this project, so 12-DEFECTS.json goes straight into
 * git history. One guest's email landing in it is permanent.
 *
 * The phone pattern deliberately matches from EIGHT characters up
 * (1 + 6 + 1), not nine. The PII gate that audits the artifact rejects any run
 * of 8 or more digits, so a pattern that only caught 9 would leave an 8-digit
 * run un-redacted and fail the very check it exists to satisfy. Over-matching
 * here (a long price or a date can become <phone>) costs nothing; under-matching
 * costs a permanent leak.
 */
export const REDACT_PATTERNS: Array<{
  source: string;
  flags: string;
  replacement: string;
}> = [
  { source: "[\\w.+-]+@[\\w-]+\\.[\\w.]+", flags: "g", replacement: "<email>" },
  { source: "\\+?\\d[\\d\\s.()-]{6,}\\d", flags: "g", replacement: "<phone>" },
];

/** Where a control's label was read from. Recorded so the redaction rule is auditable. */
export type LabelSource = "aria-label" | "title" | "alt" | "textContent" | null;

/** A bounding box, rounded to 1 decimal — sub-pixel noise is not signal here. */
export type BoxRecord = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewportProof = {
  documentElementClientWidth: number;
  windowInnerWidth: number;
  visualViewportWidth: number | null;
  visualViewportScale: number | null;
  devicePixelRatio: number;
  metaViewportContent: string | null;
  /** Passed in from Node: the browser cannot report its own emulation flags. */
  isMobileEmulation: boolean;
  sidebarPresent: boolean;
  sidebarPosition: string | null;
  /**
   * Computed `transform`. On Tailwind v4 this reads "none" even when the drawer
   * IS off-canvas: -translate-x-full compiles to the standalone `translate`
   * property, not to a transform function. Recorded anyway, because a v3-era
   * assumption about it is exactly what a later reader would make.
   */
  sidebarTransform: string | null;
  /** Computed `translate` — where Tailwind v4 actually puts -translate-x-full. */
  sidebarTranslate: string | null;
  /**
   * The sidebar's own box. This is the property-agnostic evidence that the
   * drawer is off-canvas: whichever CSS property moved it, a box whose right
   * edge is at or left of 0 is off the screen.
   */
  sidebarBox: BoxRecord | null;
};

export type OverflowingElement = {
  domPath: string;
  className: string;
  rightEdge: number;
  excessPx: number;
  scrollWidth: number;
  clientWidth: number;
  /** Computed overflow-x is auto or scroll — the element can absorb its own overflow. */
  isScrollContainer: boolean;
  /** Nearest ancestor that could absorb it. null means nothing between here and <body>. */
  nearestScrollAncestor: string | null;
};

export type OverflowRecord = {
  documentElement: { scrollWidth: number; clientWidth: number; overflows: boolean };
  body: { scrollWidth: number; clientWidth: number; overflows: boolean };
  bodyComputedOverflowX: string;
  htmlComputedOverflowX: string;
  /** TOTAL, counted before the list below was sorted and truncated. */
  overflowingElementCount: number;
  overflowingElements: OverflowingElement[];
};

export type ControlRecord = {
  controlKey: string;
  role: string | null;
  tag: string;
  type: string | null;
  inputMode: string | null;
  label: string | null;
  labelSource: LabelSource;
  labelSuppressed: boolean;
  inTableBody: boolean;
  className: string;
  classFingerprint: string;
  domPath: string;
  box: BoxRecord;
  offscreen: boolean;
  fontSizePx: number;
  belowSubTarget: boolean;
  /** Always null at runtime; Plan 05 fills it offline. See the note in collectControls. */
  sourceHint: string | null;
};

export type TextInputRecord = {
  controlKey: string;
  tag: string;
  type: string | null;
  inputMode: string | null;
  autocomplete: string | null;
  computedFontSizePx: number;
  belowIosZoomThreshold: boolean;
  box: BoxRecord;
  label: string | null;
  labelSource: LabelSource;
  labelSuppressed: boolean;
  domPath: string;
  className: string;
  classFingerprint: string;
  sourceHint: string | null;
};

/** One sweep's worth of controls — of a whole page, or of a single modal panel. */
export type ControlSweep = {
  controls: ControlRecord[];
  textInputs: TextInputRecord[];
  controlsScanned: number;
  controlsSubTarget: number;
};

export type PageScan = ViewportAndOverflow & ControlSweep;

type ViewportAndOverflow = {
  viewportProof: ViewportProof;
  overflow: OverflowRecord;
};

/**
 * Everything the in-page code needs, in one serialisable object.
 *
 * page.evaluate cannot close over module scope: the callback is shipped to the
 * browser as source text, so SUB_TARGET_PX and friends simply do not exist
 * there. Every constant travels as data, including redactPatterns — which is
 * precisely what makes redaction a property of the collection step rather than
 * a post-processing step someone can forget to run.
 */
type EvaluateArgs = {
  controlSelector: string;
  sensitive: boolean;
  subTargetPx: number;
  iosThresholdPx: number;
  maxOverflow: number;
  maxLabelChars: number;
  redactPatterns: Array<{ source: string; flags: string; replacement: string }>;
  routePath: string;
  isMobileEmulation: boolean;
  rootSelector: string | null;
  keyPrefix: string | null;
};

function evaluateArgs(
  route: AdminRoute,
  isMobileEmulation: boolean,
  rootSelector: string | null,
  keyPrefix: string | null
): EvaluateArgs {
  return {
    controlSelector: CONTROL_SELECTOR,
    sensitive: route.sensitive === true,
    subTargetPx: SUB_TARGET_PX,
    iosThresholdPx: IOS_ZOOM_THRESHOLD_PX,
    maxOverflow: MAX_OVERFLOW_ELEMENTS,
    maxLabelChars: MAX_LABEL_CHARS,
    redactPatterns: REDACT_PATTERNS,
    routePath: route.path,
    isMobileEmulation,
    rootSelector,
    keyPrefix,
  };
}

/**
 * The Node-side twin of the in-page redactor: same REDACT_PATTERNS, same
 * collapse/trim/truncate.
 *
 * It is NOT the primary defence — by the time a value reaches Node it has
 * already been redacted in the browser. This exists so the rule can be
 * unit-tested without a browser, and so an offline post-processing script
 * (Plan 05) can reuse it instead of inventing a second, drifting copy.
 */
export function redactText(input: string): string {
  let out = input.replace(/\s+/g, " ").trim();
  for (const pattern of REDACT_PATTERNS) {
    out = out.replace(new RegExp(pattern.source, pattern.flags), pattern.replacement);
  }
  return out.length > MAX_LABEL_CHARS ? out.slice(0, MAX_LABEL_CHARS) : out;
}

/**
 * The URL to measure. Sub-routes read ?id= from the query string (D-02), so a
 * path list alone is not enough.
 *
 * Throws rather than silently measuring the no-id empty state: the caller is
 * required to record the route as "skipped" with a loud reason instead, because
 * "not measured" and "clean" are the two readings a later phase most needs to
 * be able to tell apart.
 */
export function buildUrl(route: AdminRoute, blogPostId: string | null): string {
  if (route.needsId === "blogPost") {
    if (blogPostId === null) {
      throw new Error(
        `${route.path} needs a blog post id and none was fetched from GET /api/admin/blog. ` +
          `Record it as status: "skipped" instead of calling buildUrl — measuring the ` +
          `no-id empty state would report a different page under this route's name.`
      );
    }
    return `${route.path}?id=${blogPostId}`;
  }
  return route.path;
}

/**
 * The settle gate: three element-based waits, no sleeps.
 *
 * AdminShell renders a bare "Loading..." screen until the session resolves
 * (admin-shell.tsx:69-75). Measuring that screen yields a page with two or
 * three controls and zero overflow — a perfectly clean-looking result for a
 * page that was never rendered. Step 1 is the repo's existing readiness pair
 * (admin-pages.spec.ts:64-65); step 2 pins the actual page content; step 3
 * keeps a late webfont swap from resizing every box after it was measured.
 *
 * Deliberately no fixed sleep and no network-idle wait: the first is a guess
 * that rots as the machine changes, and the second never settles on a page that
 * polls. Every wait below is an element becoming true.
 */
export async function settle(page: Page, route: AdminRoute): Promise<void> {
  await expect(page.locator("body")).not.toContainText("Loading");

  if (route.auth === "authenticated") {
    await expect(page.locator("main")).toBeVisible();
  } else {
    // /admin/login is not wrapped in AdminShell and renders no <main>
    // (admin/login/page.tsx:34-99). Waiting for one here would burn the full
    // 15s expect timeout and then fail on a page that was ready immediately.
    await expect(page.locator("body")).toBeVisible();
  }

  /**
   * The gate that Plan 03 had to add after measuring: step 1 is not enough.
   *
   * AdminShell's "Loading..." only covers the SESSION. Each page then does its
   * own fetch and, while that is in flight, renders a spinner or a skeleton with
   * no text in it at all — Loader2 with .animate-spin on /admin/content,
   * /admin/content/about, /admin/rooms/edit and inside the refresh buttons on
   * /admin/bookings and /admin/reviews, and a .animate-pulse skeleton on /admin
   * (page.tsx:107-125). <main> is visible the whole time.
   *
   * Measured, not assumed: before this line existed, those four routes reported
   * exactly 13 controls at 375px — the 13 the shell renders — with zero from the
   * page body, and the numeric floor in Task 3's Gate 1 passed anyway because the
   * shell alone clears it. That is Pitfall 4 happening while every check is green.
   *
   * Keyed on the repo's own busy idiom rather than on a per-route "wait for this
   * element", because a per-route list has to be extended for every page added
   * later and is silent when someone forgets. Every occurrence of these two
   * classes under src/app/admin/ and src/components/admin/ is conditional on
   * loading / saving / refreshing / uploading — none is decorative — so waiting
   * for zero of them is waiting for "this page is not busy".
   */
  await expect(page.locator(".animate-spin, .animate-pulse")).toHaveCount(0);

  if (route.settle) {
    await expect(page.locator(route.settle).first()).toBeVisible();
  }

  await page.evaluate(() => document.fonts.ready.then(() => true));
}

/**
 * Enumerate every control and text input in ONE page.evaluate().
 *
 * rootSelector is why this is a separate exported function rather than an inline
 * block of scanPage, and Plan 04 reusing it is a requirement, not a convenience.
 * Modal bodies exist in the DOM only while the modal is open, so a single sweep
 * taken with everything closed misses the entire form of room-form and
 * promotion-form. That is not a narrower baseline, it is a wrong one:
 * rooms/page.tsx:481-482 declares inputClass = "w-full px-3 py-2 ... text-sm",
 * which is roughly 38px tall (under SUB_TARGET_PX, TAP-01) at 14px font (under
 * IOS_ZOOM_THRESHOLD_PX, TAP-03). ROADMAP criterion 3 asks for EVERY sub-44px
 * control and EVERY text input.
 *
 * keyPrefix exists because this function cannot know a modal's name: rootSelector
 * is a CSS selector (ModalSpec.panel), not a stable identifier. Plan 04's
 * measureModals passes `modal:${modal.name}::` so a modal control cannot collide
 * with a same-classed control on the page behind it.
 *
 * One evaluate, not a getByRole sweep: 17 routes x 2 viewports at workers: 1
 * would otherwise be thousands of sequential round-trips.
 */
export async function collectControls(
  page: Page,
  route: AdminRoute,
  rootSelector: string | null,
  keyPrefix: string | null = null
): Promise<ControlSweep> {
  return page.evaluate((a: EvaluateArgs): ControlSweep => {
    const root: ParentNode | null = a.rootSelector
      ? document.querySelector(a.rootSelector)
      : document;

    if (!root) {
      return { controls: [], textInputs: [], controlsScanned: 0, controlsSubTarget: 0 };
    }

    const clientWidth = document.documentElement.clientWidth;

    function domPath(el: Element): string {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body && parts.length < 8) {
        const current: Element = node;
        const parent = current.parentElement;
        let index = 1;
        if (parent) {
          index =
            Array.from(parent.children)
              .filter((child) => child.tagName === current.tagName)
              .indexOf(current) + 1;
        }
        parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
        node = parent;
      }
      return parts.join(" > ");
    }

    // Rebuilt inside the browser from the patterns handed over as data. This is
    // the primary redaction layer: nothing reaches Node un-redacted.
    function redact(input: string): string {
      let out = input.replace(/\s+/g, " ").trim();
      for (const pattern of a.redactPatterns) {
        out = out.replace(new RegExp(pattern.source, pattern.flags), pattern.replacement);
      }
      return out.length > a.maxLabelChars ? out.slice(0, a.maxLabelChars) : out;
    }

    function classOf(el: Element): string {
      // Not el.className: on an <svg> that is an SVGAnimatedString, not a string.
      return el.getAttribute("class") ?? "";
    }

    function round1(value: number): number {
      return Math.round(value * 10) / 10;
    }

    /**
     * aria-label -> title -> alt -> textContent, in that order and for a reason.
     * The first three are strings a developer typed; textContent is where a real
     * guest's name, email or phone reaches the DOM. Recording which one was used
     * is what makes the suppression rule below auditable from the artifact.
     */
    function labelOf(
      el: Element
    ): { text: string; source: Exclude<LabelSource, null> } | null {
      const aria = el.getAttribute("aria-label");
      if (aria && aria.trim()) return { text: aria, source: "aria-label" };

      const title = el.getAttribute("title");
      if (title && title.trim()) return { text: title, source: "title" };

      const altHost = el.querySelector("img[alt], svg[alt]");
      const alt = altHost ? altHost.getAttribute("alt") : el.getAttribute("alt");
      if (alt && alt.trim()) return { text: alt, source: "alt" };

      const text = el.textContent;
      if (text && text.trim()) return { text, source: "textContent" };

      return null;
    }

    function isVisible(el: Element): boolean {
      if (el.getClientRects().length === 0) return false;
      const cs = window.getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") return false;
      if (parseFloat(cs.opacity) <= 0) return false;
      if (el.closest("[aria-hidden='true'],[hidden]") !== null) return false;
      return true;
    }

    const seen = new Set<Element>();
    const controls: ControlRecord[] = [];
    const textInputs: TextInputRecord[] = [];
    let controlsSubTarget = 0;

    for (const el of Array.from(root.querySelectorAll(a.controlSelector))) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!isVisible(el)) continue;

      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const tag = el.tagName.toLowerCase();
      const path = domPath(el);
      const className = classOf(el);

      const found = labelOf(el);
      const labelSource: LabelSource = found ? found.source : null;
      const inTableBody = el.closest("tbody") !== null;

      // Layer 1 blocks DYNAMIC labels only. Dropping every label under a tbody
      // would also throw away title="View details" (bookings/page.tsx:269),
      // which is exactly the "control's text/aria-label" D-09 asks to record.
      const suppress =
        a.sensitive && inTableBody && labelSource === "textContent";
      const labelSuppressed = suppress;
      // Layer 2 runs on EVERY route, sensitive or not: the header user menu
      // renders the signed-in staff member's own email (admin-shell.tsx:176).
      const label = suppress ? null : found ? redact(found.text) : null;

      const classFingerprint = className
        .split(/\s+/)
        .filter((token) => /^(p|px|py|pt|pb|pl|pr|h|w|min-h|min-w|text)-/.test(token))
        .slice(0, 4)
        .join(" ");

      const role = el.getAttribute("role");
      const type = el.getAttribute("type");
      const inputMode = el.getAttribute("inputmode");

      // Falls back to domPath when the label was suppressed, so the key stays
      // stable across runs without carrying a byte of guest data.
      const controlKey = `${a.keyPrefix ?? ""}${a.routePath}::${role ?? tag}::${
        label ?? `dom:${path}`
      }::${classFingerprint}`;

      const box: BoxRecord = {
        x: round1(rect.x),
        y: round1(rect.y),
        width: round1(rect.width),
        height: round1(rect.height),
      };

      const fontSizePx = parseFloat(cs.fontSize);
      const belowSubTarget = box.height < a.subTargetPx || box.width < a.subTargetPx;
      if (belowSubTarget) controlsSubTarget += 1;

      controls.push({
        controlKey,
        role,
        tag,
        type,
        inputMode,
        label,
        labelSource,
        labelSuppressed,
        inTableBody,
        className,
        classFingerprint,
        domPath: path,
        box,
        // <aside> is always in the DOM; at 375px it is only pushed out of view by
        // -translate-x-full (admin-shell.tsx:93-95). Its 10 nav links therefore
        // appear on all 16 authenticated routes with a negative x. They are real
        // defects (staff tap them with the drawer open) so they are recorded, but
        // offscreen: true tells Phase 14 why the coordinates are negative rather
        // than looking like 16 separate faults.
        offscreen: rect.right <= 0 || rect.left >= clientWidth,
        fontSizePx,
        belowSubTarget,
        // Always null at runtime, and no amount of cleverness changes that:
        // React 19 removed the dev-only debug-source field from elements
        // (PR #28265), and it never existed in a production build anyway, which
        // is what D-08 mandates. D-09 says "plus the source file when derivable"
        // — the way to satisfy that is the full className recorded above,
        // grepped offline by Plan 05. Do not try to read React's internal
        // instance properties off the DOM node; there is nothing there to read.
        sourceHint: null,
      });

      const textInputType = (type ?? "text").toLowerCase();
      const isTextInput =
        (tag === "input" &&
          ["hidden", "checkbox", "radio", "submit", "button", "reset", "image"].indexOf(
            textInputType
          ) === -1) ||
        tag === "textarea" ||
        tag === "select" ||
        el.getAttribute("contenteditable") === "true";

      if (isTextInput) {
        textInputs.push({
          controlKey,
          tag,
          type,
          inputMode,
          autocomplete: el.getAttribute("autocomplete"),
          computedFontSizePx: fontSizePx,
          belowIosZoomThreshold: fontSizePx < a.iosThresholdPx,
          box,
          label,
          labelSource,
          labelSuppressed,
          domPath: path,
          className,
          classFingerprint,
          sourceHint: null,
        });
      }
    }

    return {
      controls,
      textInputs,
      controlsScanned: controls.length,
      controlsSubTarget,
    };
  }, evaluateArgs(route, false, rootSelector, keyPrefix));
}

/**
 * The whole-page measurement: viewport proof + overflow in one evaluate, then
 * the control sweep in a second one.
 */
export async function scanPage(
  page: Page,
  route: AdminRoute,
  isMobileEmulation: boolean
): Promise<PageScan> {
  const proof = await page.evaluate((a: EvaluateArgs): ViewportAndOverflow => {
    const de = document.documentElement;
    const clientWidth = de.clientWidth;

    function domPath(el: Element): string {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body && parts.length < 8) {
        const current: Element = node;
        const parent = current.parentElement;
        let index = 1;
        if (parent) {
          index =
            Array.from(parent.children)
              .filter((child) => child.tagName === current.tagName)
              .indexOf(current) + 1;
        }
        parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
        node = parent;
      }
      return parts.join(" > ");
    }

    function round1(value: number): number {
      return Math.round(value * 10) / 10;
    }

    const metaTag = document.querySelector('meta[name="viewport"]');
    const aside = document.querySelector("aside");
    const asideStyle = aside ? window.getComputedStyle(aside) : null;
    const asideRect = aside ? aside.getBoundingClientRect() : null;

    const viewportProof: ViewportProof = {
      documentElementClientWidth: clientWidth,
      windowInnerWidth: window.innerWidth,
      visualViewportWidth: window.visualViewport?.width ?? null,
      visualViewportScale: window.visualViewport?.scale ?? null,
      devicePixelRatio: window.devicePixelRatio,
      metaViewportContent: metaTag ? metaTag.getAttribute("content") : null,
      isMobileEmulation: a.isMobileEmulation,
      sidebarPresent: aside !== null,
      sidebarPosition: asideStyle ? asideStyle.position : null,
      sidebarTransform: asideStyle ? asideStyle.transform : null,
      sidebarTranslate: asideStyle ? asideStyle.translate : null,
      sidebarBox: asideRect
        ? {
            x: round1(asideRect.x),
            y: round1(asideRect.y),
            width: round1(asideRect.width),
            height: round1(asideRect.height),
          }
        : null,
    };

    /**
     * Two independent readings, and the second one is the load-bearing one.
     *
     * globals.css:88 sets body { overflow-x: hidden }, and
     * src/app/admin/layout.tsx:2 imports that same stylesheet. Under the CSS
     * overflow-propagation rule that value can propagate to the viewport and
     * CLAMP documentElement.scrollWidth to clientWidth, so every route reports
     * scrollWidth === clientWidth — "clean" — while content is still cut off the
     * side of the screen. The offender sweep below reads the geometry of the
     * elements themselves and is unaffected by that clamp.
     */
    const bodyEl = document.body;
    const offenders: OverflowingElement[] = [];
    let overflowingElementCount = 0;

    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const cs = window.getComputedStyle(el);
      // position: fixed is measured against the viewport, not the document, so a
      // fixed element hanging off the right edge (the sidebar at -translate-x-full
      // does the same on the left) is not document overflow. sticky is KEPT: it
      // stays in flow and its overflow is real — the admin header is sticky
      // (admin-shell.tsx:144) and a header wider than the screen is a defect.
      const inFlow = cs.position !== "fixed";
      if (!inFlow) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) continue;
      if (rect.right <= clientWidth + 1) continue;

      overflowingElementCount += 1;

      let ancestor = el.parentElement;
      let nearestScrollAncestor: string | null = null;
      while (ancestor && ancestor !== document.documentElement) {
        const ax = window.getComputedStyle(ancestor).overflowX;
        if (ax === "auto" || ax === "scroll") {
          nearestScrollAncestor = domPath(ancestor);
          break;
        }
        ancestor = ancestor.parentElement;
      }

      offenders.push({
        domPath: domPath(el),
        className: el.getAttribute("class") ?? "",
        rightEdge: round1(rect.right),
        excessPx: round1(rect.right - clientWidth),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        isScrollContainer: cs.overflowX === "auto" || cs.overflowX === "scroll",
        nearestScrollAncestor,
      });
    }

    offenders.sort((left, right) => right.excessPx - left.excessPx);

    const overflow: OverflowRecord = {
      documentElement: {
        scrollWidth: de.scrollWidth,
        clientWidth: de.clientWidth,
        overflows: de.scrollWidth > de.clientWidth + 1,
      },
      body: {
        scrollWidth: bodyEl.scrollWidth,
        clientWidth: bodyEl.clientWidth,
        overflows: bodyEl.scrollWidth > bodyEl.clientWidth + 1,
      },
      bodyComputedOverflowX: window.getComputedStyle(bodyEl).overflowX,
      htmlComputedOverflowX: window.getComputedStyle(de).overflowX,
      overflowingElementCount,
      overflowingElements: offenders.slice(0, a.maxOverflow),
    };

    return { viewportProof, overflow };
  }, evaluateArgs(route, isMobileEmulation, null, null));

  const sweep = await collectControls(page, route, null);

  return { ...proof, ...sweep };
}

/** How a modal was closed again. "none" means it was never opened. */
export type DismissStrategy = "declared-selector" | "hard-reset" | "none";

/**
 * Every frame of reference a modal can be judged against, recorded together
 * because they are NOT interchangeable — measured, not assumed.
 *
 * window.innerWidth is the initial containing block, and under Chromium's mobile
 * emulation the ICB EXPANDS to the overflowing content. On the six admin routes
 * that overflow at 375px it reads exactly documentElement.scrollWidth — 467 on
 * /admin, 943 on /admin/bookings, 645 on /admin/rooms — while
 * documentElement.clientWidth and visualViewport.width both stay 375 and
 * visualViewport.scale stays 1. So innerWidth answers "how wide is the box a
 * fixed, inset-0 overlay stretches to", which is the right question for catching
 * a panel selector that grabbed the overlay, and the WRONG question for "does
 * this panel fit on the screen".
 *
 * The screen is documentElementClientWidth x documentElementClientHeight, and
 * that is what the clipping flags are computed against. Judging a 448px panel
 * against a 645px ICB reports fitsViewport: true for a panel that runs 105px off
 * a 375px phone — a clean-looking number, on exactly the routes where TAP-02
 * matters most.
 *
 * visualViewport is kept as well: on a real iOS device the soft keyboard shrinks
 * the visual viewport without touching the layout viewport, and Phase 14 has to
 * be able to tell which number it is capping modal height against.
 */
export type ModalViewportBox = {
  innerWidth: number;
  innerHeight: number;
  documentElementClientWidth: number;
  documentElementClientHeight: number;
  visualViewportWidth: number | null;
  visualViewportHeight: number | null;
};

/**
 * One modal, opened and measured — the whole of TAP-02's baseline.
 *
 * panelControls / panelTextInputs are why this type carries more than geometry.
 * scanPage runs with every modal CLOSED, so a modal body simply does not exist
 * in the DOM at that moment and is absent from the baseline entirely. That is not
 * a narrower baseline, it is a wrong one: rooms/page.tsx:481-482 declares
 * inputClass = "w-full px-3 py-2 ... text-sm" — roughly 38px tall (under
 * SUB_TARGET_PX, so TAP-01) at 14px font (under IOS_ZOOM_THRESHOLD_PX, so
 * TAP-03) — and every input of the room-form modal uses it. ROADMAP criterion 3
 * asks for EVERY sub-44px control and EVERY text input, so leaving the modal
 * bodies out would drop the densest defect cluster in the panel. e2e/admin-routes.ts
 * already makes the same argument for the user menu, whose Sign out item exists
 * only while the menu is open; this type applies it to all five.
 */
export type ModalMeasurement = {
  name: string;
  kind: ModalKind;
  opened: boolean;
  /** Non-null whenever opened is false. "Not opened" must never read as "clean". */
  skipReason: string | null;
  /**
   * The trigger's own box, recorded whether or not the modal opened.
   *
   * Added after the first full run measured something the plan did not
   * anticipate: on the routes that overflow at 375px the trigger sits beyond the
   * right edge of the screen and the document cannot be scrolled to it, so the
   * modal is unreachable by a person, not merely unmeasured. "opened: false"
   * with no geometry would leave Phase 13/14 unable to tell that apart from an
   * empty database.
   */
  triggerBox: BoxRecord | null;
  /**
   * Playwright's own actionability verdict on the trigger, taken with a TRIAL
   * click that dispatches no event. False means a real user could not operate it
   * either — this is a measurement, not a harness limitation.
   */
  triggerReachable: boolean;
  panelBox: BoxRecord | null;
  viewportBox: ModalViewportBox;
  clippedTop: boolean;
  clippedBottom: boolean;
  clippedLeft: boolean;
  clippedRight: boolean;
  fitsViewport: boolean;
  panelScrollHeight: number | null;
  panelClientHeight: number | null;
  panelOverflowY: string | null;
  bodyScrollsInternally: boolean;
  dismissed: boolean;
  dismissStrategy: DismissStrategy;
  panelControls: ControlRecord[];
  panelTextInputs: TextInputRecord[];
  panelControlsScanned: number;
  panelControlsSubTarget: number;
};

/**
 * Native dialogs observed per page, so the guard below can be checked as data
 * as well as thrown from. A WeakMap keyed on the page keeps this per-test with
 * no cleanup step to forget.
 */
const unexpectedDialogs = new WeakMap<Page, string[]>();

/**
 * Make an unexpected native dialog loud.
 *
 * THE FAILURE MODE THIS EXISTS FOR: Playwright auto-dismisses native dialogs
 * when no listener is registered, and it does so SILENTLY. This is the first
 * plan in the phase that clicks anything at all, against the real database with
 * a SUPER_ADMIN session. If a declared trigger ever reaches a data-destroying
 * path — blog/history/page.tsx:76 calls window.confirm before reverting a
 * revision, and /admin/promotions and /admin/rooms both carry row-level delete
 * buttons — the default behaviour is that the confirm is dismissed, the harness
 * carries on as if nothing happened, and nothing in the artifact records it.
 *
 * With a listener attached the dialog is neither accepted nor dismissed: the
 * page blocks, the test times out, and the message below names what asked. Both
 * halves matter. Nothing in this file may ever call dialog.accept().
 */
export function installDialogGuard(page: Page): void {
  if (!unexpectedDialogs.has(page)) unexpectedDialogs.set(page, []);

  page.on("dialog", (dialog) => {
    const seen = unexpectedDialogs.get(page);
    const message =
      `an unexpected native ${dialog.type()} dialog appeared during measurement: ` +
      `"${dialog.message()}". The harness only operates the preTrigger / trigger / ` +
      `dismiss selectors declared in e2e/admin-routes.ts, so a dialog here means one ` +
      `of them reached a mutating path. It is deliberately left unanswered rather ` +
      `than dismissed — a dismissed dialog leaves no trace, which is exactly how a ` +
      `destroyed record would go unnoticed. Fix the selector; do not answer the dialog.`;
    if (seen) seen.push(message);
    throw new Error(message);
  });
}

/**
 * Fail the current test if installDialogGuard saw anything.
 *
 * Belt and braces on top of the throw inside the handler: an exception raised
 * from an EventEmitter callback can surface as a worker-level error rather than
 * a test failure depending on where Playwright dispatched it, and "the run went
 * red somewhere" is not the same as "this route named the dialog it triggered".
 */
export function assertNoUnexpectedDialogs(page: Page): void {
  const seen = unexpectedDialogs.get(page) ?? [];
  expect(seen, seen.join(" | ")).toEqual([]);
}

/** Reads a box back from Playwright at the same precision the DOM sweep uses. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Open, measure and close every modal a route declares.
 *
 * ABSOLUTE SAFETY CONSTRAINT — read before editing:
 * this function operates ONLY the `preTrigger`, `trigger` and `dismiss`
 * selectors written in e2e/admin-routes.ts, exactly as declared. There is no
 * branch that activates "the first button in the panel", no discovery loop, no
 * "click everything and see what opens". Every panel measured here sits on a
 * live database behind a SUPER_ADMIN session and contains destructive controls:
 * booking-detail holds status transitions, promotion-form and room-form sit on
 * pages with row-level deletes, and the user-menu panel holds the session-ending
 * Sign out item — which is why that modal's `dismiss` is a second press of its
 * own trigger rather than anything inside the panel. Measuring a control's
 * geometry never requires activating it.
 *
 * It REPORTS. The only assertions are about the instrument: that the panel
 * really is the panel and not the overlay, that the panel actually contained
 * controls, and that no native dialog appeared. Nothing about fitsViewport or
 * clipped* is asserted anywhere — those are Phase 14's TAP-02 gate.
 */
export async function measureModals(
  page: Page,
  route: AdminRoute,
  url: string,
  viewportId: string
): Promise<ModalMeasurement[]> {
  const out: ModalMeasurement[] = [];
  const modals = route.modals ?? [];
  if (modals.length === 0) return out;

  const viewportBox: ModalViewportBox = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    documentElementClientWidth: document.documentElement.clientWidth,
    documentElementClientHeight: document.documentElement.clientHeight,
    visualViewportWidth: window.visualViewport?.width ?? null,
    visualViewportHeight: window.visualViewport?.height ?? null,
  }));

  for (const modal of modals) {
    const record: ModalMeasurement = {
      name: modal.name,
      kind: modal.kind,
      opened: false,
      skipReason: null,
      triggerBox: null,
      triggerReachable: false,
      panelBox: null,
      viewportBox,
      clippedTop: false,
      clippedBottom: false,
      clippedLeft: false,
      clippedRight: false,
      fitsViewport: false,
      panelScrollHeight: null,
      panelClientHeight: null,
      panelOverflowY: null,
      bodyScrollsInternally: false,
      dismissed: false,
      dismissStrategy: "none",
      panelControls: [],
      panelTextInputs: [],
      panelControlsScanned: 0,
      panelControlsSubTarget: 0,
    };

    const panel = page.locator(modal.panel).first();
    const trigger = page.locator(modal.trigger).first();

    try {
      // 1. Reach the tab the trigger lives on, and WAIT for the swap to land.
      //    Switching tabs is a React state update, not a navigation, so there is
      //    nothing else to await: clicking and moving on would ask isDisabled()
      //    of an element that does not exist yet, which reads as "not disabled".
      //    /admin/rooms initialises useState<Tab>("types") (rooms/page.tsx:97) and
      //    on that tab the top-right control is a <Link href="/admin/rooms/edit">
      //    (:225-231), so without this the harness would navigate away and measure
      //    "the modal" on a different page.
      if (modal.preTrigger) {
        const pre = page.locator(modal.preTrigger).first();
        if ((await pre.count()) === 0) {
          record.skipReason =
            `${modal.name}: the preTrigger "${modal.preTrigger}" matched nothing on ` +
            `${url} at ${viewportId}, so the tab carrying the trigger was never ` +
            `reached. Labels on this page carry live counts, so a selector must ` +
            `match by substring — check e2e/admin-routes.ts.`;
          out.push(record);
          continue;
        }
        await pre.click({ timeout: 10_000 });
        await trigger.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
      }

      // 2. Is the trigger usable at all? An empty data state is a LEGITIMATE
      //    reading and must be recorded with the precondition in plain words, not
      //    thrown. What it must never become is a missing row that reads as clean.
      const triggerCount = await trigger.count();
      if (triggerCount === 0 || (await trigger.isDisabled())) {
        record.skipReason =
          `${modal.name}: ${
            triggerCount === 0
              ? `no element matched the trigger "${modal.trigger}"`
              : `the trigger "${modal.trigger}" is disabled`
          } on ${url} at ${viewportId}. Precondition: ${
            modal.requires ?? "none declared in e2e/admin-routes.ts"
          }. This modal's TAP-02 baseline is MISSING, not clean — seed the data and re-run.`;
        out.push(record);
        continue;
      }

      const rawTrigger = await trigger.boundingBox();
      if (rawTrigger) {
        record.triggerBox = {
          x: round1(rawTrigger.x),
          y: round1(rawTrigger.y),
          width: round1(rawTrigger.width),
          height: round1(rawTrigger.height),
        };
      }

      /**
       * 2b. Can the trigger actually be operated? Measured, not assumed.
       *
       * A TRIAL click runs Playwright's full actionability check — visible,
       * stable, enabled, and receiving pointer events at its own hit point — and
       * dispatches NOTHING. It is therefore safe to run against a live admin
       * panel, and it is the same verdict the real click would reach.
       *
       * This exists because the first full run of this harness spent the whole
       * 60s test budget retrying a click that could never land. On the routes
       * that overflow at 375px the trigger sits past the right edge of the
       * screen, and `body { overflow-x: hidden }` (globals.css:88) propagates to
       * the viewport, so the document cannot be scrolled to reach it — measured:
       * window.scrollTo(9999, 0) leaves scrollLeft at 0 while
       * documentElement.scrollWidth reads 943. Retrying is pointless and hides
       * the finding behind a timeout; recording it with the geometry is the
       * finding.
       */
      let unreachableDetail: string | null = null;
      try {
        await trigger.click({ trial: true, timeout: 3_000 });
        record.triggerReachable = true;
      } catch (error) {
        record.triggerReachable = false;
        unreachableDetail = (error instanceof Error ? error.message : String(error))
          .split("\n")[0]
          .trim();
      }

      if (!record.triggerReachable) {
        const geometry = await page.evaluate(() => {
          const de = document.documentElement;
          const before = de.scrollLeft || document.body.scrollLeft || window.scrollX;
          window.scrollTo(9_999, 0);
          const reached = de.scrollLeft || document.body.scrollLeft || window.scrollX;
          window.scrollTo(before, 0);
          return {
            scrollWidth: de.scrollWidth,
            clientWidth: de.clientWidth,
            maxScrollLeftReached: reached,
            bodyOverflowX: window.getComputedStyle(document.body).overflowX,
          };
        });
        const box = record.triggerBox;
        record.skipReason =
          `${modal.name}: the trigger "${modal.trigger}" is present and enabled on ` +
          `${url} at ${viewportId} but cannot be operated (${unreachableDetail}). ` +
          `Its box is x=${box ? box.x : "unknown"} width=${box ? box.width : "unknown"} ` +
          `(right edge ${box ? round1(box.x + box.width) : "unknown"}) against a ` +
          `${geometry.clientWidth}px viewport, the document measures ` +
          `${geometry.scrollWidth}px wide, and scrolling right reaches ` +
          `scrollLeft=${geometry.maxScrollLeftReached} because body computes ` +
          `overflow-x: ${geometry.bodyOverflowX}. So the control is off the screen AND ` +
          `the screen cannot be scrolled to it: this modal is unreachable to a person ` +
          `at this viewport, not merely unmeasured. Its TAP-02 baseline is MISSING and ` +
          `it stays missing until the overflow is fixed — do not read it as clean, and ` +
          `do not force the click, which would fabricate a baseline for a panel nobody ` +
          `can open.`;
        out.push(record);
        continue;
      }

      // 3. Open it, then wait for a real paint. toBeVisible() only checks
      //    visibility; it does not guarantee the panel has been painted at its
      //    final size. None of the five panels carries a transition or animate
      //    class today, so this is not flaky yet — but Phase 14 is likely to add
      //    one while fixing modals, and Phase 15 reuses this exact function.
      await trigger.click({ timeout: 10_000 });
      await expect(panel).toBeVisible({ timeout: 10_000 });
      await panel.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          })
      );
      record.opened = true;

      // 4. Playwright's own boundingBox(), not the DOM client-rect call the two
      //    in-page sweeps above use: its coordinates are relative to the
      //    main-frame viewport, which is exactly the frame of reference TAP-02's
      //    clipping flags need, and it returns null when the element is not
      //    visible. That null is a useful signal — never coerce it to zero.
      const raw = await panel.boundingBox();
      if (raw) {
        record.panelBox = {
          x: round1(raw.x),
          y: round1(raw.y),
          width: round1(raw.width),
          height: round1(raw.height),
        };
      }

      // 6. The panel's own scrolling. max-h-[80vh] overflow-y-auto on
      //    bookings/page.tsx:304 means a tall booking scrolls INSIDE the panel
      //    rather than clipping — a materially different defect from a panel that
      //    simply runs off the bottom of the screen, and Phase 14 fixes them
      //    differently.
      const intrinsics = await panel.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          overflowY: cs.overflowY,
        };
      });
      record.panelScrollHeight = intrinsics.scrollHeight;
      record.panelClientHeight = intrinsics.clientHeight;
      record.panelOverflowY = intrinsics.overflowY;
      record.bodyScrollsInternally =
        intrinsics.scrollHeight > intrinsics.clientHeight + 1 &&
        (intrinsics.overflowY === "auto" || intrinsics.overflowY === "scroll");

      // 6b. Sweep the panel's own controls, with the SAME collector the page scan
      //     uses. Reusing it is the point: REDACT_PATTERNS, the sensitive-route
      //     label rule and the labelSource priority all apply unchanged, which
      //     matters most here — booking-detail and guest-detail open onto real
      //     guest records. No redaction rule is restated in this function; there
      //     is exactly one copy of it, in REDACT_PATTERNS.
      //     The keyPrefix is explicit because collectControls only receives a CSS
      //     selector and cannot infer a modal name; without it a control inside
      //     the modal collides with a same-classed control on the page behind it
      //     and Phase 15 loses its stable identity.
      const sweep = await collectControls(page, route, modal.panel, `modal:${modal.name}::`);
      record.panelControls = sweep.controls;
      record.panelTextInputs = sweep.textInputs;
      record.panelControlsScanned = sweep.controlsScanned;
      record.panelControlsSubTarget = sweep.controlsSubTarget;

      // 8. Clipping, judged against the SCREEN — documentElement's client box —
      //    and deliberately not against window.innerWidth/innerHeight. See the
      //    note on ModalViewportBox: on an overflowing route the ICB expands to
      //    the content, so innerWidth reads 645 on a 375px phone and every panel
      //    on the worst routes would report itself as fitting.
      if (record.panelBox) {
        record.clippedTop = record.panelBox.y < 0;
        record.clippedBottom =
          record.panelBox.y + record.panelBox.height >
          viewportBox.documentElementClientHeight;
        record.clippedLeft = record.panelBox.x < 0;
        record.clippedRight =
          record.panelBox.x + record.panelBox.width >
          viewportBox.documentElementClientWidth;
        record.fitsViewport =
          !record.clippedTop &&
          !record.clippedBottom &&
          !record.clippedLeft &&
          !record.clippedRight;
      }
    } catch (error) {
      // An operational failure (a click that timed out, a panel that never
      // appeared) is recorded as a loud skip rather than thrown, because
      // Playwright forks a fresh worker after every failed test and the module
      // accumulator does not survive it — one bad trigger would otherwise cost
      // every route after it. The instrument assertions below are deliberately
      // OUTSIDE this catch: a panel selector that measures the overlay is a
      // broken tool, not a data state, and has to go red.
      record.skipReason =
        `${modal.name}: measurement failed on ${url} at ${viewportId} — ` +
        `${error instanceof Error ? error.message : String(error)}`;
      record.opened = false;
    } finally {
      // 9/10. Always leave the page usable for the next modal and the next route.
      //    There is no role="dialog", no aria-modal and no key handler anywhere
      //    under src/app/admin/, so pressing the Escape key does NOT close these
      //    modals and cannot be the primary strategy. The declared selector is
      //    step one; re-navigating is the hard reset, and it works against any
      //    focus trap because it destroys the whole document.
      if (record.opened) {
        try {
          await page.locator(modal.dismiss).first().click({ timeout: 5_000 });
          await expect(panel).toBeHidden({ timeout: 3_000 });
          record.dismissed = true;
          record.dismissStrategy = "declared-selector";
        } catch {
          await page.goto(url, { waitUntil: "domcontentloaded" });
          await settle(page, route);
          record.dismissed = !(await panel.isVisible().catch(() => false));
          record.dismissStrategy = "hard-reset";
        }
      }
    }

    // A dialog seen at any point in the cycle fails the test here, even if the
    // throw inside the handler was swallowed upstream.
    assertNoUnexpectedDialogs(page);

    // 5. The instrument check against measuring the overlay instead of the panel.
    //    Every modal in this repo is a div.fixed.inset-0 wrapping a white panel,
    //    and inset-0 always measures EXACTLY the viewport — so a wrong selector
    //    hands TAP-02 a baseline with nothing ever clipped: numbers that look
    //    clean and mean nothing. innerWidth is the right comparand for THIS
    //    question and only this one — a fixed, inset-0 box stretches to the
    //    initial containing block, so an overlay measures exactly innerWidth
    //    whether or not the route overflows.
    if (record.opened && record.panelBox) {
      expect(
        record.panelBox.width,
        `${route.path}/${modal.name} at ${viewportId}: the measured element is ${record.panelBox.width}px wide against a ${viewportBox.innerWidth}px initial containing block, which means the overlay (div.fixed.inset-0) is being measured and not the panel. Fix ModalSpec.panel in e2e/admin-routes.ts — do not relax this assertion.`
      ).toBeLessThan(viewportBox.innerWidth);

      expect(
        record.panelControlsScanned,
        `${route.path}/${modal.name} at ${viewportId}: the panel is open but its control sweep found nothing, so either ModalSpec.panel in e2e/admin-routes.ts points at the wrong element or the panel had not rendered. An empty sweep would silently drop this modal's inputs from the TAP-01/TAP-03 baseline.`
      ).toBeGreaterThan(0);
    }

    out.push(record);
  }

  return out;
}
