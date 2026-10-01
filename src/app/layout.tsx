import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "ئورخۇن — سىياسەت تەتقىقات مەركىزى", template: "%s | ئورخۇن" },
  description: "سىياسىي ئانالىز، خەلقئارا مۇناسىۋەتلەر، تەتقىقات ۋە كىتاپ تونۇشتۇرۇش.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ug" dir="rtl" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">مەزمۇنغا ئۆتۈش</a>{children}</body></html>;
}
