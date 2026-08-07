import sanitizeHtml from "sanitize-html";

/**
 * Allow-list for rich-text content authored in the admin editor.
 *
 * Applied on write (so what is stored is already clean, including for the admin
 * preview/history screens that render it back with dangerouslySetInnerHTML) and
 * again on read, which covers rows saved before that was in place.
 *
 * No `script`, no `style`, no event handlers, and only http/https/mailto/tel
 * URLs. Blog content is the classic stored-XSS vector and there are three staff
 * roles, so a post written by a receptionist must not be able to run code in a
 * super-admin's session.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "code", "pre", "blockquote",
    "ul", "ol", "li",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** Same input with every tag removed — for excerpts and meta descriptions. */
export function stripTags(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
