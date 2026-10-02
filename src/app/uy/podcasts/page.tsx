import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getPodcastPosts } from "@/lib/wordpress";
import { Header, Footer } from "@/components/shell";
import { PodcastView } from "@/components/podcast-view";
import { ScrollControls } from "@/components/scroll-controls";

export const revalidate = 300;

import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "پودكاستلار — سىن ۋە ئاۋازلىق ئانالىزلار",
  description: "ئۆتۈكەن سىياسەت تەتقىقات مەركىزىنىڭ سىن، پودكاست ۋە سۆھبەت پروگراممىلىرى.",
  path: "/uy/podcasts",
  locale: "uy",
  type: "website",
});

export default async function PodcastsPage() {
  const [categories, podcasts] = await Promise.all([
    getCategories(),
    getPodcastPosts(),
  ]);

  return (
    <>
      <Header categories={categories} active="podcasts" />
      <main id="main" className="site-width podcast-page-layout">
        <div className="article-breadcrumb">
          <Link href="/uy">باشبەت</Link>
          <span>/</span>
          <span className="breadcrumb-current">سىن ۋە پودكاستلار</span>
        </div>

        <div className="podcast-header">
          <div className="podcast-header-text">
            <span className="eyebrow">ئۆتۈكەن مېدىيا</span>
            <h1>سىن ۋە ئاۋازلىق پودكاستلار</h1>
            <p>
              خەلقئارا مۇناسىۋەتلەر، دۇنيا ۋەزىيىتى ۋە چوڭ دۆلەتلەر رىقابىتى ھەققىدىكى
              چوڭقۇر ئانالىزلار ۋە سۆھبەتلەر.
            </p>
          </div>
          <div className="podcast-header-badge">
            <b dir="ltr">{podcasts.length}</b>
            <span>سان مەزمۇن</span>
          </div>
        </div>

        <PodcastView podcasts={podcasts} />

        <ScrollControls />
      </main>
      <Footer />
    </>
  );
}
