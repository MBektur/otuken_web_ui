import he from "he";
import sanitizeHtml from "sanitize-html";

export const WORDPRESS_URL = (process.env.WORDPRESS_URL || "https://orhunpolicycenter.com/uy").replace(/\/$/, "");
export const SOURCE_ORIGIN = new URL(WORDPRESS_URL).origin;
export const SOURCE_PATH = new URL(WORDPRESS_URL).pathname.replace(/\/$/, "");

export function plainText(html: string): string {
  return he.decode(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, " ").trim();
}

export function localPath(link: string): string {
  if (link.startsWith("#")) return link;
  try {
    const url = new URL(he.decode(link), WORDPRESS_URL + "/");
    if (url.origin === SOURCE_ORIGIN && (url.pathname === SOURCE_PATH || url.pathname.startsWith(SOURCE_PATH + "/"))) {
      return url.pathname + url.search + url.hash;
    }
    return url.href;
  } catch {
    return "/uy";
  }
}

export function normalizedPath(path: string): string {
  try { return decodeURIComponent(path).replace(/\/$/, ""); }
  catch { return path.replace(/\/$/, ""); }
}

export function contentImage(html: string): string | undefined {
  const match = html.match(/<img\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  if (!match) return undefined;
  try {
    const url = new URL(he.decode(match[1]), WORDPRESS_URL + "/");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function safeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption", "sup", "sub"],
    allowedAttributes: {
      a: ["href", "title", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      "*": ["id", "dir", "lang"],
      td: ["colspan", "rowspan"], th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    transformTags: {
      a: (_tagName, attrs) => ({ tagName: "a", attribs: { ...attrs, href: attrs.href ? localPath(attrs.href) : "", rel: "noopener noreferrer" } }),
      img: (_tagName, attrs) => ({ tagName: "img", attribs: { ...attrs, loading: "lazy" } }),
    },
  });
}
