import type { Metadata } from "next";
import { Header, Footer } from "@/components-ug/shell";
import { getCategoriesUg } from "@/lib/wordpress-ug";
import { CacheManager } from "@/components-ug/cache-manager";

export const metadata: Metadata = {
  title: "Тез Хатирә Әслимиси Башқуруш Мәркизи | Өтүкән",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CacheAdminPage() {
  const categories = await getCategoriesUg().catch(() => []);
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
