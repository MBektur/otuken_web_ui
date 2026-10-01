import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesUg, getPodcastPostsUg } from "@/lib/wordpress-ug";
import { Header, Footer } from "@/components-ug/shell";
import { PodcastView } from "@/components-ug/podcast-view";
import { ScrollControls } from "@/components-ug/scroll-controls";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Подкастлар — Син Вә Авазлиқ Анализлар",
  description: "Өтүкән Сийасәт Тәтқиқат Мәркизиниң Син, Подкаст Вә Сөһбәт Программилири.",
  alternates: { canonical: "/ug/podcasts" },
};

export default async function PodcastsPage() {
  const [categories, podcasts] = await Promise.all([
    getCategoriesUg(),
    getPodcastPostsUg(),
  ]);

  return (
    <>
      <Header categories={categories} active="podcasts" />
      <main id="main" className="site-width podcast-page-layout">
        <div className="article-breadcrumb">
          <Link href="/ug">Башбәт</Link>
          <span>/</span>
          <span className="breadcrumb-current">Син Вә Подкастлар</span>
        </div>

        <div className="podcast-header">
          <div className="podcast-header-text">
            <span className="eyebrow">Өтүкән Медийа</span>
            <h1>Син Вә Авазлиқ Подкастлар</h1>
            <p>
              Хәлқара Мунасивәтләр, Дунйа Вәзийити Вә Чоң Дөләтләр Риқабити Һәққидики
              Чоңқур Анализлар Вә Сөһбәтләр.
            </p>
          </div>
          <div className="podcast-header-badge">
            <b dir="ltr">{podcasts.length}</b>
            <span>Сан Мәзмун</span>
          </div>
        </div>

        <PodcastView podcasts={podcasts} />

        <ScrollControls />
      </main>
      <Footer />
    </>
  );
}
