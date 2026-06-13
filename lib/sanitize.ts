import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "blockquote", "pre", "code", "span", "div", "hr"],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
    ALLOW_DATA_ATTR: false,
  });
}
