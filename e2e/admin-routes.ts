/**
 * Every admin route, declared once.
 *
 * Admin paths are currently scattered as bare string literals across four spec
 * files — admin-pages.spec.ts:20-53, admin-session.spec.ts:37,
 * public-pages.spec.ts:33-126, viewport-probe.spec.ts:47 — and no file owns the
 * set. A new admin page can therefore ship covered by nothing while every
 * existing spec still looks complete and still passes. Phase 15 criterion 4
 * exists for exactly that reason: there must be ONE list, so covering a new page
 * means adding a line, not remembering to write a spec.
 *
 * This module is that list, and the source of truth for both the Phase 12
 * measuring harness (e2e/admin-measure.spec.ts) and the Phase 15 regression
 * gate. It records no measurements and asserts nothing — it only declares where
 * to go and what may safely be clicked.
 *
 * It is a plain .ts file, not a .spec.ts: all four Playwright projects override
 * testMatch with a /\.spec\.ts/ or /\.setup\.ts/ regex, so this can never be
 * collected as a test.
 *
 * Adding an admin page means adding one entry to ADMIN_ROUTES below.
 */

/**
 * "dropdown" is not decoration.
 *
 * Phase 14's TAP-02 baseline only counts modal panels, but the /admin user menu
 * still has to be opened and measured: its "Sign out" item exists in the DOM
 * only while the menu is open (admin-shell.tsx:172-186). A control sweep that
 * never opens it misses that button on every one of the 16 authenticated
 * routes, and the miss looks identical to "no defect".
 */
export type ModalKind = "modal" | "dropdown";

export type ModalSpec = {
  /** Stable identifier — Phase 14 and Phase 15 refer to modals by this name. */
  name: string;
  kind: ModalKind;
  /**
   * Clicked BEFORE `trigger`, when the trigger is not on the tab the page opens on.
   *
   * Button labels in this repo carry live counts — `Room Types ({roomTypes.length})`
   * and `Individual Rooms ({rooms.length})` at rooms/page.tsx:265,275 — so any
   * name-based selector must match by substring or regex. An exact
   * accessible-name comparison finds nothing and reports it as an empty locator,
   * not as an error. The caller must also wait for `trigger` to appear after
   * clicking this: swapping tabs is a React state update, not a navigation, so
   * there is nothing else to await.
   */
  preTrigger?: string;
  trigger: string;
  /**
   * The panel, never the overlay — and always a different element from `trigger`.
   *
   * All four modals here are a `div.fixed.inset-0` wrapping a white panel
   * (bookings/page.tsx:303-304, guests/page.tsx:248-249,
   * promotions/page.tsx:439-440, rooms/page.tsx:488-489). `inset-0` means the
   * overlay ALWAYS measures exactly the viewport, so measuring it would hand
   * TAP-02 a baseline of 375x667 for every modal with nothing ever clipped —
   * numbers that look clean and mean nothing. There is no `role="dialog"`
   * anywhere under src/app/admin/, so getByRole("dialog") cannot reach the panel
   * either, and the repo has no test-id attributes at all: do not write selectors
   * that assume one exists.
   *
   * HARD CONSTRAINT — plain CSS only. This value is consumed in two different
   * places: page.locator() on the Playwright side, AND document.querySelector()
   * inside the in-page control sweep. document.querySelector does not understand
   * Playwright's own selector engines, so `text=`, `:has-text()`, `>> nth=` and
   * anything similar are forbidden in THIS field. They remain legal on
   * `trigger`, `preTrigger` and `dismiss`, which only ever go through
   * page.locator().
   */
  panel: string;
  dismiss: string;
  /** Data precondition in plain words — the harness copies it into skipReason. */
  requires?: string;
};

export type AdminRoute = {
  path: string;
  auth: "authenticated" | "anonymous";
  /**
   * The page reads `?id=` from the query string, so the harness appends an id
   * fetched at runtime from `GET /api/admin/blog` (D-02). If the blog table is
   * empty the route is recorded as `status: "skipped"` with a loud reason — it
   * must never be recorded as zero defects, because "not measured" and "clean"
   * are the two readings a later phase most needs to tell apart.
   */
  needsId?: "blogPost";
  /**
   * This route renders real guest names, emails or phone numbers.
   *
   * commit_docs is true for this project, so the measurement artifact goes
   * straight into git history. The exact rule the harness applies (Plan 03):
   * drop a control's `label` when the control sits inside `tbody` AND the label
   * came from textContent (labelSource === "textContent"). Developer-authored
   * labels — aria-label, title, alt — are KEPT, because D-09 asks for "the
   * control's text/aria-label"; they still pass through REDACT_PATTERNS. So a
   * redacted artifact loses row-derived text, not every label under a table.
   */
  sensitive?: true;
  /** Extra selector to await, on top of the harness's default settle gate. */
  settle?: string;
  modals?: ModalSpec[];
};

/**
 * All 17 admin routes (D-01): the 10 named in REQUIREMENTS.md followed by the 7
 * sub-routes the decision pulled into scope. Nothing here is deferred.
 */
export const ADMIN_ROUTES: AdminRoute[] = [
  {
    // The recent-bookings table on the dashboard prints booking.guestName
    // (admin/(dashboard)/page.tsx:393).
    path: "/admin",
    auth: "authenticated",
    sensitive: true,
    modals: [
      {
        name: "user-menu",
        kind: "dropdown",
        // The header's only div.relative; its two siblings are the lg:hidden
        // sidebar toggle and a hidden lg:block heading (admin-shell.tsx:144-160).
        trigger: "header div.relative > button",
        panel: "header div.relative > div.absolute.right-0.mt-2.w-48",
        // Toggle the same button again. Deliberately NOT "click the first button
        // in the panel": that button is Sign out (admin-shell.tsx:178-184), and
        // clicking it destroys the session the other 15 authenticated routes are
        // measured with — mid-run, so the failure would surface as those routes
        // silently measuring the login page.
        dismiss: "header div.relative > button",
      },
    ],
  },
  {
    path: "/admin/bookings",
    auth: "authenticated",
    sensitive: true,
    modals: [
      {
        name: "booking-detail",
        kind: "modal",
        // Icon-only button in each row (bookings/page.tsx:269); the harness takes
        // the first match. The sibling buttons in that cell are status
        // transitions (:272-285) and must never be clicked.
        trigger: 'tbody button[title="View details"]',
        panel: "div.fixed.inset-0 > div.bg-white.rounded-xl",
        // This X has no aria-label (bookings/page.tsx:307), so it is located as
        // the only button in the panel's header row.
        dismiss: "div.fixed.inset-0 > div.bg-white.rounded-xl > div:first-child > button",
        requires: "at least one booking row",
      },
    ],
  },
  {
    path: "/admin/guests",
    auth: "authenticated",
    sensitive: true,
    modals: [
      {
        name: "guest-detail",
        kind: "modal",
        // Text button in each row (guests/page.tsx:208-213); the harness takes the
        // first match. The other control in that cell is a mailto <a>, not a button.
        trigger: 'tbody button:has-text("View")',
        panel: "div.fixed.inset-0 > div.bg-white.rounded-lg",
        dismiss: 'div.fixed.inset-0 button[aria-label="Close"]',
        requires: "at least one guest row",
      },
    ],
  },
  {
    path: "/admin/rooms",
    auth: "authenticated",
    modals: [
      {
        name: "room-form",
        kind: "modal",
        // Mandatory. The page initialises useState<Tab>("types") (rooms/page.tsx:97)
        // so it opens on Room Types, and on that tab the top-right control is a
        // <Link href="/admin/rooms/edit"> (:225-231), not a modal trigger — clicking
        // it would navigate away and the "modal" would be measured on another page.
        // Substring match, not exact: the real label is `Individual Rooms ({rooms.length})`.
        preTrigger: 'button:has-text("Individual Rooms")',
        trigger: 'button:has-text("Add Room")',
        panel: "div.fixed.inset-0 > div.bg-white.rounded-lg",
        dismiss: 'div.fixed.inset-0 button[aria-label="Close"]',
        requires:
          "at least one room type — Add Room carries disabled={roomTypes.length === 0} (rooms/page.tsx:238)",
      },
    ],
  },
  {
    // The post table prints post.author.name (blog/page.tsx:147).
    path: "/admin/blog",
    auth: "authenticated",
    sensitive: true,
  },
  {
    path: "/admin/promotions",
    auth: "authenticated",
    modals: [
      {
        name: "promotion-form",
        kind: "modal",
        // Opens the form in create mode, so there is no data precondition. Scoped
        // to a button on purpose: the panel's own heading is an <h2> carrying the
        // same words (promotions/page.tsx:442-444).
        trigger: 'button:has-text("New promotion")',
        panel: "div.fixed.inset-0 > div.bg-white.rounded-lg",
        dismiss: 'div.fixed.inset-0 button[aria-label="Close"]',
      },
    ],
  },
  {
    // Each review line prints review.guestName (reviews/page.tsx:279).
    path: "/admin/reviews",
    auth: "authenticated",
    sensitive: true,
  },
  {
    path: "/admin/content",
    auth: "authenticated",
  },
  {
    path: "/admin/gallery",
    auth: "authenticated",
  },
  {
    path: "/admin/settings",
    auth: "authenticated",
  },
  {
    // ?id= comes from GET /api/admin/blog at runtime; empty blog table => skipped,
    // never "0 defects". Renders the post's author.
    path: "/admin/blog/edit",
    auth: "authenticated",
    needsId: "blogPost",
    sensitive: true,
  },
  {
    // ?id= comes from GET /api/admin/blog at runtime; empty blog table => skipped,
    // never "0 defects". Revision rows carry the editing staff member's name.
    path: "/admin/blog/history",
    auth: "authenticated",
    needsId: "blogPost",
    sensitive: true,
  },
  {
    // ?id= comes from GET /api/admin/blog at runtime; empty blog table => skipped,
    // never "0 defects". Renders the published post byline.
    path: "/admin/blog/preview",
    auth: "authenticated",
    needsId: "blogPost",
    sensitive: true,
  },
  {
    path: "/admin/rooms/edit",
    auth: "authenticated",
  },
  {
    path: "/admin/content/about",
    auth: "authenticated",
  },
  {
    path: "/admin/settings/payment",
    auth: "authenticated",
  },
  {
    // The one anonymous route (D-03). It has no AdminShell, so no sidebar and no
    // user menu — a route that unexpectedly measures like this one is the
    // signature of a broken session, not of a clean page.
    path: "/admin/login",
    auth: "anonymous",
  },
];

/**
 * Embedded verbatim into the measurement artifact so that whoever reads it knows
 * why some labels are null, without having to find this file first.
 */
export const SENSITIVE_NOTE =
  "Routes flagged sensitive render real guest data. On those routes a control's " +
  "label is recorded as null when the control sits inside a table body AND the " +
  "label was read from DOM text; developer-authored labels (aria-label, title, " +
  "alt) are kept and pass through the redaction patterns. A null label therefore " +
  "means redacted, not missing.";
