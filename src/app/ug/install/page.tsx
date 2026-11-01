import type { Metadata } from "next";
import { Header, Footer } from "@/components-ug/shell";
import { getCategories } from "@/lib/wordpress";
import { PwaInstallGuide } from "@/components/pwa-install-guide";
import { buildSeoMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Қачила Қолланмиси — Өтүкән Тор Әпи (PWA)",
    description: "Өтүкән тор әпини iPhone, Android вә компьютерлириңизға әп сүпитидә қачила қолланмиси.",
    path: "/ug/install",
    locale: "ug",
    type: "website",
  });
}

export default async function UgInstallPage() {
  const categories = await getCategories();
  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <PwaInstallGuide isUg={true} />
      </main>
      <Footer />
    </>
  );
}
