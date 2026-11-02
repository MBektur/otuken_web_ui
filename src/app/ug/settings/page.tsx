import type { Metadata } from "next";
import { Header, Footer } from "@/components-ug/shell";
import { getCategoriesUg } from "@/lib/wordpress-ug";
import { PodcastAdmin } from "@/components/podcast-admin";

export const metadata: Metadata = {
  title: "Podkast we Video Bashqurush Merkizi | Otuken",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UgSettingsPage() {
  const categories = await getCategoriesUg().catch(() => []);

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width admin-page-layout">
        <PodcastAdmin locale="ug" />
      </main>
      <Footer />
    </>
  );
}
