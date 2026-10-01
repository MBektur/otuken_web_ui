import he from "he";
import sanitizeHtml from "sanitize-html";

export const WORDPRESS_URL = (process.env.WORDPRESS_URL || "https://orhunpolicycenter.com/uy").replace(/\/$/, "");
export const SOURCE_ORIGIN = new URL(WORDPRESS_URL).origin;
export const SOURCE_PATH = new URL(WORDPRESS_URL).pathname.replace(/\/$/, "");

export function plainText(html: string): string {
  return he.decode(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, " ").trim();
}

export function localPath(link: string, prefix: string = "/uy"): string {
  if (link.startsWith("#")) return link;
  try {
    const url = new URL(he.decode(link), WORDPRESS_URL + "/");
    if (url.origin === SOURCE_ORIGIN && (url.pathname === SOURCE_PATH || url.pathname.startsWith(SOURCE_PATH + "/"))) {
      const suffix = url.pathname.slice(SOURCE_PATH.length);
      if (/^\/(?:wp-content|wp-includes|wp-json|wp-admin)(?:\/|$)/.test(suffix) || suffix === "/wp-login.php") return url.href;
      return prefix + suffix + url.search + url.hash;
    }
    return url.href;
  } catch {
    return prefix;
  }
}

export function localPathUg(link: string): string {
  return localPath(link, "/ug");
}

export function robustDecode(str: string): string {
  if (!str) return "";
  let curr = str;
  for (let iter = 0; iter < 3; iter++) {
    try {
      const decoded = decodeURIComponent(curr);
      if (decoded === curr) break;
      curr = decoded;
    } catch {
      try {
        const bytes: number[] = [];
        for (let i = 0; i < curr.length; i++) {
          if (curr[i] === "%" && i + 2 < curr.length && /^[0-9a-fA-F]{2}$/.test(curr.slice(i + 1, i + 3))) {
            bytes.push(parseInt(curr.slice(i + 1, i + 3), 16));
            i += 2;
          } else {
            const code = curr.charCodeAt(i);
            if (code < 128) {
              bytes.push(code);
            } else {
              const encoded = Buffer.from(curr[i], "utf8");
              for (let b = 0; b < encoded.length; b++) bytes.push(encoded[b]);
            }
          }
        }
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const decoded = decoder.decode(new Uint8Array(bytes)).replace(/\uFFFD/g, "");
        if (decoded === curr) break;
        curr = decoded;
      } catch {
        break;
      }
    }
  }
  return curr;
}

export function normalizedPath(path: string): string {
  return robustDecode(path).toLowerCase().replace(/\/$/, "");
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
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption", "sup", "sub", "iframe"],
    allowedAttributes: {
      a: ["href", "title", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "title", "allowfullscreen", "loading"],
      "*": ["id", "dir", "lang"],
      td: ["colspan", "rowspan"], th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    exclusiveFilter: frame => frame.attribs.id === "daexthefu-container",
    transformTags: {
      a: (_tagName, attrs) => ({ tagName: "a", attribs: { ...attrs, href: attrs.href ? localPath(attrs.href) : "", rel: "noopener noreferrer" } }),
      img: (_tagName, attrs) => ({ tagName: "img", attribs: { ...attrs, loading: "lazy" } }),
    },
  });
}

export function extractYoutubeId(html: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : undefined;
}
