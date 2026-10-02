import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { default: "Өтүкән — Сийасәт Тәтқиқат Мәркизи", template: "%s | Өтүкән" },
  description: "Сийасий анализ, хәлқара мунасивәтләр, тәтқиқат вә китап тонуштуруш.",
  openGraph: {
    siteName: "Өтүкән Сийасәт Тәтқиқат Мәркизи | Ötüken Policy Center",
    locale: "ug-Cyrl",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Өтүкән Сийасәт Тәтқиқат Мәркизи" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function UgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ug-cyrl-layout" dir="ltr" lang="ug-Cyrl">
      {children}
    </div>
  );
}
