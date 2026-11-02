import type { Metadata } from "next";
import { Header, Footer } from "@/components-ug/shell";
import { getCategoriesUg } from "@/lib/wordpress-ug";
import { AdminMessagesPanel } from "@/components/admin-messages-panel";

export const metadata: Metadata = {
  title: "Kelgen Uchurlar Merkizi | Otuken",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsMessagesUgPage() {
  const categories = await getCategoriesUg().catch(() => []);

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

