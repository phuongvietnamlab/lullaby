import { expect, type Page } from "@playwright/test";
import { type AdminRoute } from "./admin-routes";

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
