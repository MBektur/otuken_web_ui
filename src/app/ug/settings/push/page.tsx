import type { Metadata } from "next";
import { Header, Footer } from "@/components-ug/shell";
import { getCategoriesUg, getPostsUg } from "@/lib/wordpress-ug";
import { PushSenderPanel } from "@/components/push-sender-panel";

export const metadata: Metadata = {
  title: "Uqturesh Ewetish Merkizi (Web Push) | Otuken",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PushSettingsUgPage() {
  const [categories, postsResult] = await Promise.all([
    getCategoriesUg().catch(() => []),
    getPostsUg({ perPage: 15, page: 1 }).catch(() => ({ data: [] })),
  ]);

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width admin-page-layout">
        <PushSenderPanel posts={postsResult.data} />
      </main>
      <Footer />
    </>
  );
}

