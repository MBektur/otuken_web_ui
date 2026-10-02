import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ئۆتۈكەن — سىياسەت تەتقىقات مەركىزى", template: "%s | ئۆتۈكەن" },
  description: "سىياسىي ئانالىز، خەلقئارا مۇناسىۋەتلەر، تەتقىقات ۋە كىتاپ تونۇشتۇرۇش.",
  openGraph: {
    siteName: "ئۆتۈكەن سىياسەت تەتقىقات مەركىزى | Ötüken Policy Center",
    locale: "ug",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "ئۆتۈكەن سىياسەت تەتقىقات مەركىزى" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/logo.Header-UY.png",
    apple: "/logo.Header-UY.png",
  },
};

import { headers } from "next/headers";
import { DirectionManager } from "@/components/direction-manager";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isUg = pathname.startsWith("/ug");
  const dir = isUg ? "ltr" : "rtl";
  const lang = isUg ? "ug-Cyrl" : "ug";

  return (
    <html lang={lang} dir={dir} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://orhunpolicycenter.com" />
        <link rel="dns-prefetch" href="https://orhunpolicycenter.com" />
        <link rel="preload" href="/fonts/ukij-tuz.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/lateef-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lateef:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={isUg ? "ug-cyrl" : ""}>
        <Suspense fallback={null}>
          <DirectionManager />
        </Suspense>
        <a className="skip-link" href="#main">
          {isUg ? "Мәзмунға өтүш" : "مەزمۇنغا ئۆتۈش"}
        </a>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
