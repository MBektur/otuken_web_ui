import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { CacheManager } from "@/components/cache-manager";

export const metadata: Metadata = {
  title: "تېز خاتىرە ئەسلىمىسى باشقۇرۇش مەركىزى | ئۆتۈكەن",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CacheAdminPage() {
  const categories = await getCategories().catch(() => []);
  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width admin-page-layout">
        <CacheManager />
      </main>
      <Footer />
    </>
  );
}
