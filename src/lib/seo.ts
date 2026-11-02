import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://otuken-policy-center.vercel.app");

export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.Header-UY.png`;

export interface SeoOptions {
  title: string;
  description?: string;
  path?: string;
  locale?: "uy" | "ug";
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noIndex?: boolean;
}

export function buildSeoMetadata({
  title,
  description,
  path = "",
  locale = "uy",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  noIndex = false,
}: SeoOptions): Metadata {
  const isUg = locale === "ug";
  const defaultDesc = isUg
    ? "Сийасий анализ, хәлқара мунасивәтләр, тәтқиқат вә китап тонуштуруш."
    : "سىياسىي ئانالىز، خەلقئارا مۇناسىۋەتلەر، تەتقىقات ۋە كىتاپ تونۇشتۇرۇش.";

  const finalDescription = (description || defaultDesc).trim().slice(0, 180);
  const siteName = isUg
    ? "Өтүкән Сийасәт Тәтқиқат Мәркизи | Ötüken Policy Center"
    : "ئۆتۈكەن سىياسەت تەتقىقات مەركىزى | Ötüken Policy Center";

  // Resolve absolute image URL for Open Graph & Twitter cards
  let resolvedImage = DEFAULT_OG_IMAGE;
  if (image) {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      resolvedImage = image;
    } else {
      resolvedImage = `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
    }
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}${cleanPath}`;

  // Counterpart language link (e.g. /uy/... <-> /ug/...)
  const alternateUg = cleanPath.startsWith("/uy")
    ? `${SITE_URL}${cleanPath.replace(/^\/uy/, "/ug")}`
    : canonicalUrl;
  const alternateUy = cleanPath.startsWith("/ug")
    ? `${SITE_URL}${cleanPath.replace(/^\/ug/, "/uy")}`
    : canonicalUrl;

  const metadata: Metadata = {
    title,
    description: finalDescription,
    alternates: {
      canonical: cleanPath,
      languages: {
        "ug": alternateUy,
        "ug-Cyrl": alternateUg,
        "en": "https://orhunpolicycenter.com/",
      },
    },
    openGraph: {
      title,
      description: finalDescription,
      url: canonicalUrl,
      siteName,
      locale: isUg ? "ug-Cyrl" : "ug",
      type,
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === "article" && publishedTime
        ? {
          publishedTime,
          modifiedTime: modifiedTime || publishedTime,
          authors: authors || [siteName],
        }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: finalDescription,
      images: [resolvedImage],
    },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };

  return metadata;
}
