const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "blockquote", "pre", "code", "span", "div", "hr"];
const ALLOWED_TAG_SET = new Set(ALLOWED_TAGS);
const ALLOWED_ATTR_SET = new Set(["href", "target", "rel", "src", "alt"]);

function basicSanitize(html: string): string {
  return html.replace(/<(\/?)(\w+)([^>]*)>/g, (_: string, close: string, tag: string, attrs: string) => {
    if (!ALLOWED_TAG_SET.has(tag)) return "";
    const sanitized = attrs.replace(/(\w+)\s*(?:=\s*(?:"[^"]*"|'[^']*'|\S+))?/g, (attrMatch: string, name: string) => {
      return ALLOWED_ATTR_SET.has(name) ? attrMatch : "";
    });
    return `<${close}${tag}${sanitized}>`;
  });
}

let advancedSanitize: ((html: string) => string) | null = null;

function getAdvancedSanitizer(): (html: string) => string {
  if (advancedSanitize) return advancedSanitize;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("isomorphic-dompurify");
    advancedSanitize = (html: string) =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
        ALLOW_DATA_ATTR: false,
      });
  } catch {
    advancedSanitize = basicSanitize;
  }
  return advancedSanitize;
}

export function sanitizeHtml(html: string): string {
  return getAdvancedSanitizer()(html);
}
