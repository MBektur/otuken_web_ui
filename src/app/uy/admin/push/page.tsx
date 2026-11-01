import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories, getPosts } from "@/lib/wordpress";
import { PushSenderPanel } from "@/components/push-sender-panel";

export const metadata: Metadata = {
  title: "ئۇقتۇرۇش تارقىتىش مەركىزى (Web Push) | ئۆتۈكەن",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PushAdminPage() {
  const [categories, postsResult] = await Promise.all([
    getCategories().catch(() => []),
    getPosts({ perPage: 15, page: 1 }).catch(() => ({ data: [] })),
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

