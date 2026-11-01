import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/navigation-progress";
import { DirectionManager } from "@/components/direction-manager";
import { PwaProvider } from "@/components/pwa-provider";
import { PwaInstallToast } from "@/components/pwa-install-toast";
import "./globals.css";

import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#faf7f0",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ئۆتۈكەن — سىياسەت تەتقىقات مەركىزى", template: "%s | ئۆتۈكەن" },
  description: "سىياسىي ئانالىز، خەلقئارا مۇناسىۋەتلەر، تەتقىقات ۋە كىتاپ تونۇشتۇرۇش.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ئۆتۈكەن",
  },
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ug" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="preload" href="/fonts/ukij-tuz.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/lateef-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <PwaProvider />
        <Suspense fallback={null}>
          <DirectionManager />
        </Suspense>
        <a className="skip-link" href="#main">
          مەزمۇنغا ئۆتۈش
        </a>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <PwaInstallToast />
        </Suspense>
      </body>
    </html>
  );
}
