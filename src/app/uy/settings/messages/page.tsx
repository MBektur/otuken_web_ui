import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { AdminMessagesPanel } from "@/components/admin-messages-panel";

export const metadata: Metadata = {
  title: "كەلگەن ئۇچۇرلار باشقۇرۇش مەركىزى | ئۆتۈكەن",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsMessagesPage() {
  const categories = await getCategories().catch(() => []);

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width admin-page-layout">
        <AdminMessagesPanel />
      </main>
      <Footer />
    </>
  );
}

