import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { PodcastAdmin } from "@/components/podcast-admin";

export const metadata: Metadata = {
  title: "پودكاست ۋە سىن باشقۇرۇش مەركىزى | ئۆتۈكەن",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UySettingsPage() {
  const categories = await getCategories().catch(() => []);

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width admin-page-layout">
        <PodcastAdmin locale="uy" />
      </main>
      <Footer />
    </>
  );
}
