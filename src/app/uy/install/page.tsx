import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { PwaInstallGuide } from "@/components/pwa-install-guide";
import { buildSeoMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "قاچىلاش قوللانمىسى — ئۆتۈكەن تور ئەپى (PWA)",
    description: "ئۆتۈكەن تور ئەپىنى iPhone، Android ۋە كومپيۇتېرىڭىزغا ئەپ سۈپىتىدە قاچىلاش قوللانمىسى.",
    path: "/uy/install",
    locale: "uy",
    type: "website",
  });
}

export default async function InstallPage() {
  const categories = await getCategories();
  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <PwaInstallGuide isUg={false} />
      </main>
      <Footer />
    </>
  );
}

