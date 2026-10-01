import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "ئۆتۈكەن — سىياسەت تەتقىقات مەركىزى", template: "%s | ئۆتۈكەن" },
  description: "سىياسىي ئانالىز، خەلقئارا مۇناسىۋەتلەر، تەتقىقات ۋە كىتاپ تونۇشتۇرۇش.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ug" dir="rtl" data-scroll-behavior="smooth">
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
      <body>
        <a className="skip-link" href="#main">
          مەزمۇنغا ئۆتۈش
        </a>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
