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
      if (!part) return "";
      if (part.startsWith("<")) {
         // It's a tag, transliterate alt and title attributes
         let tag = part.replace(/\b(alt|title)=["']([^"']*)["']/gi, (match, attr, value) => {
           try {
             return value ? `${attr}="${ulcConvert(value, "uc")}"` : match;
           } catch {
             return match;
           }
         });
         // Replace internal links to stay within /ug
         tag = tag.replace(/href=["'](?:https:\/\/orhunpolicycenter\.com\/uy|\/uy)(\/[^"']*)?["']/gi, (m, rest) => {
           return `href="/ug${rest || ''}"`;
         });
         return tag;
      }
      // It's text content
      try {
        return ulcConvert(part, "uc");
      } catch {
        return part;
      }
    }).join("");
  } catch {
    return html;
  }
}

export function isCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function isLatin(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

export function toUyghurArabic(text: string): string {
  if (!text) return "";
  const cleaned = text.replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4]/g, "'");
  if (isCyrillic(cleaned)) {
    try {
      return ulcConvert(cleaned, "cu");
    } catch {
      return text;
    }
  }
  if (isLatin(cleaned) && !isArabic(cleaned)) {
    try {
      return ulcConvert(cleaned, "lu");
    } catch {
      return text;
    }
  }
  return text;
}

export function toUyghurCyrillic(text: string): string {
  if (!text) return "";
  const cleaned = text.replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4]/g, "'");
  if (isArabic(cleaned)) {
    try {
      return ulcConvert(cleaned, "uc");
    } catch {
      return text;
    }
  }
  if (isLatin(cleaned) && !isCyrillic(cleaned)) {
    try {
      return ulcConvert(cleaned, "lc");
    } catch {
      return text;
    }
  }
  return text;
}

export function toUyghurLatin(text: string): string {
  if (!text) return "";
  const cleaned = text.replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4]/g, "'");
  if (isArabic(cleaned)) {
    try {
      return ulcConvert(cleaned, "ul");
    } catch {
      return text;
    }
  }
  if (isCyrillic(cleaned)) {
    try {
      return ulcConvert(cleaned, "cl");
    } catch {
      return text;
    }
  }
  return text;
}

/**
 * Returns multi-script search variants for a term (supporting Cyrillic, Arabic, Latin,
 * and Russian keyboard fallbacks for Uyghur Cyrillic letters).
 */
export function getScriptVariants(term: string): string[] {
  if (!term) return [];
  const raw = term.trim();
  const cleaned = raw.replace(/[\u2018\u2019\u02BB\u02BC\u0060\u00B4]/g, "'");
  const stripped = cleaned.replace(/[«»""''„“–—\-.,!?:;()\[\]{}]/g, " ").replace(/\s+/g, " ").trim();

  const baseTerms = new Set<string>();
  if (raw) baseTerms.add(raw.toLowerCase());
  if (cleaned) baseTerms.add(cleaned.toLowerCase());
  if (stripped) baseTerms.add(stripped.toLowerCase());

  // Russian keyboard fallback for Uyghur Cyrillic (e.g. г->ғ, к->қ, ж->җ, х->һ)
  if (isCyrillic(cleaned)) {
    const map: Record<string, string> = { "г": "ғ", "к": "қ", "ж": "җ", "х": "һ" };
    let replaced = cleaned.toLowerCase();
    for (const [ru, ug] of Object.entries(map)) {
      if (replaced.includes(ru)) {
        replaced = replaced.split(ru).join(ug);
      }
    }
    if (replaced !== cleaned.toLowerCase()) {
      baseTerms.add(replaced);
    }
  }

  const variants = new Set<string>();
  for (const t of baseTerms) {
    if (!t) continue;
    variants.add(t);

    if (isCyrillic(t)) {
      try {
        const a = ulcConvert(t, "cu").toLowerCase().trim();
        if (a) variants.add(a);
      } catch {}
      try {
        const l = ulcConvert(t, "cl").toLowerCase().trim();
        if (l) variants.add(l);
      } catch {}
    } else if (isArabic(t)) {
      try {
        const c = ulcConvert(t, "uc").toLowerCase().trim();
        if (c) variants.add(c);
      } catch {}
      try {
        const l = ulcConvert(t, "ul").toLowerCase().trim();
        if (l) variants.add(l);
      } catch {}
    } else if (isLatin(t)) {
      try {
        const a = ulcConvert(t, "lu").toLowerCase().trim();
        if (a) variants.add(a);
      } catch {}
      try {
        const c = ulcConvert(t, "lc").toLowerCase().trim();
        if (c) variants.add(c);
      } catch {}
    }
  }

  return Array.from(variants).filter(Boolean);
}
