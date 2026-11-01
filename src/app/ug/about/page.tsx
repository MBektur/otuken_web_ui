import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components-ug/shell";
import { getCategories } from "@/lib/wordpress";
import { buildSeoMetadata } from "@/lib/seo";
import { Compass, Globe, Mail } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Һәққимиздә — Өтүкән Сийасәт Тәтқиқат Мәркизи",
    description: "Өтүкән Сийасәт Тәтқиқат Мәркизи — мустәқил тәтқиқат, истратегийилик тәпәккүр, дунйаға нәзәр вә кәлгүсигә қәдәм.",
    path: "/ug/about",
    locale: "ug",
    type: "website",
  });
}

export default async function UgAboutPage() {
  const categories = await getCategories();

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <div className="editorial-page-container" dir="ltr">
          <header className="editorial-header">
            <span className="eyebrow">Мәркәз Һәққидә</span>
            <h1>Өтүкән Сийасәт Тәтқиқат Мәркизи</h1>
            <p>
              Дунйаға нәзәр, кәлгүсигә тәпәккүр — мустәқил сийасий анализ, истратегийилик тәтқиқат вә чоңқур чүшәнчә суписи.
            </p>
          </header>

          <article className="editorial-card">
            <h2>Биз Ким?</h2>
            <p>
              <strong>Өтүкән Сийасәт Тәтқиқат Мәркизи (Ötüken Policy Center)</strong> — хәлқара сийасәт, Оттура Асийа вә район тәрәққийати, истратегийилик тәңпуңлуқ һәмдә кишилик һоқуқ мәсилилирини чоңқур тәһлил қилидиған мустәқил илмий тәтқиқат оргинидур.
            </p>
            <p>
              Мәркизимиз әнъәниви чүшәнчиләрниң сиртиға чиқип, көп қутуплишиватқан йеңи дунйа тәртипидә йүз бериватқан тарихий, иқтисадий вә геополитикилиқ пәрқләрни оқурмәнләргә ениқ, ишәнчлик вә тәрәпсиз көз қараш билән йәткүзүшни мәқсәт қилиду.
            </p>
          </article>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
              marginBottom: "28px",
            }}
          >
            <div className="editorial-card" style={{ margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--wine)", marginBottom: "12px" }}>
                <Compass size={24} />
                <h3 style={{ margin: 0, fontSize: "20px" }}>Бурчимиз</h3>
              </div>
              <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                Уйғур вә Түрк дунйаси оқурмәнлирини хәлқара сийасәт, хәвпсизлик, тарих вә кәлгүси истратегийиләр һәққидә сүпәтлик, дәлил-испатқа тайанған анализлар билән тәминләш.
              </p>
            </div>

            <div className="editorial-card" style={{ margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--wine)", marginBottom: "12px" }}>
                <Globe size={24} />
                <h3 style={{ margin: 0, fontSize: "20px" }}>Ғайимиз</h3>
              </div>
              <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                Хәлқаралиқ сийасәт мәркәзлири, академиклар вә анализчилар арисида тәрәққий қилған көврүккә айлинип, сийасий тәпәккүрниң йүксилишигә төһпә қошуш.
              </p>
            </div>
          </div>

          <article className="editorial-card">
            <h2>Тәтқиқат Саһәлиримиз</h2>
            <ul>
              <li>
                <strong>Геополитика вә Дунйа Сийасити:</strong> Чоң дөләтләр оттурисидики риқабәт, хәлқара иттипақлар, дипломатик тәңпуңлуқ вә район бихәтәрлики.
              </li>
              <li>
                <strong>Оттура Асийа вә Түркстан:</strong> Тарихий бағлиниш, истратегийилик иқтисадий линийиләр, район амиллири вә кәлгүси тәрәққийат пурсити.
              </li>
              <li>
                <strong>Кишилик Һоқуқ вә Демократийә:</strong> Асасий кишилик һоқуқ принциплири, аз санлиқ милләтләр тәғдири, адаләт вә хәлқара қанун тәтқиқати.
              </li>
              <li>
                <strong>Китап Тонуштуруш вә Илмий Обзор:</strong> Дунйа тәпәккүридики йеңи нәшр қилинған муһим сийасий, тарихий вә пәлсәпәви әсәрләрни тәпсилий баһалаш.
              </li>
            </ul>
          </article>

          <article className="editorial-card">
            <h2>Нәшр Принциплиримиз</h2>
            <p>
              Өтүкән Сийасәт Тәтқиқат Мәркизи өз анализлирида мустәқил академик принципларға қәтъий әмәл қилиду. Мәркизимиз һечқандақ сийасий гуруһ, партийә йаки ташқи күчкә беқинмайду.
            </p>
            <div style={{ marginTop: "24px" }}>
              <Link href="/ug/contact" className="btn-submit">
                <Mail size={16} />
                <span>Биз билән алақилишиң</span>
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
