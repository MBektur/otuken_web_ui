// @ts-ignore
import ulcConvert from "ulc-converter";

// Client-side or Server-side locale detection
export function getLocale(pathname?: string): "uy" | "ug" {
  if (pathname) {
    return pathname.startsWith("/ug") ? "ug" : "uy";
  }
  return "uy";
}

export function t(text: string, locale?: "uy" | "ug"): string {
  if (locale === "ug") {
    try {
      return ulcConvert(text, "uc");
    } catch {
      return text;
    }
  }
  return text;
}

export function transliterateHtml(html: string, locale?: "uy" | "ug"): string {
  if (locale !== "ug" || !html) return html;
  try {
    // We split by HTML tags
    const parts = html.split(/(<[^>]+>)/g);
    return parts.map(part => {
      if (part.startsWith("<")) {
         // It's a tag, transliterate alt and title attributes
         let tag = part.replace(/\b(alt|title)=["']([^"']*)["']/gi, (match, attr, value) => {
           return `${attr}="${ulcConvert(value, "uc")}"`;
         });
         // Replace internal links to stay within /ug
         tag = tag.replace(/href=["'](?:https:\/\/orhunpolicycenter\.com\/uy|\/uy)(\/[^"']*)?["']/gi, (m, rest) => {
           return `href="/ug${rest || ''}"`;
         });
         return tag;
      }
      // It's text content
      return ulcConvert(part, "uc");
    }).join("");
  } catch {
    return html;
  }
}
