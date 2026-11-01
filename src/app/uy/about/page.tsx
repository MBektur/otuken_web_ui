import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { buildSeoMetadata } from "@/lib/seo";
import { Compass, BookOpen, Globe, Award, ShieldCheck, Mail, ArrowLeft } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "ھەققىمىزدە — ئۆتۈكەن سىياسەت تەتقىقات مەركىزى",
    description: "ئۆتۈكەن سىياسەت تەتقىقات مەركىزى — مۇستەقىل تەتقىقات، ئىستراتېگىيەلىك تەپەككۇر، دۇنياغا نەزەر ۋە كەلگۈسىگە قەدەم.",
    path: "/uy/about",
    locale: "uy",
    type: "website",
  });
}

export default async function AboutPage() {
  const categories = await getCategories();

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <div className="editorial-page-container" dir="rtl">
          <header className="editorial-header">
            <span className="eyebrow">مەركەز ھەققىدە</span>
            <h1>ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</h1>
            <p>
              دۇنياغا نەزەر، كەلگۈسىگە تەپەككۇر — مۇستەقىل سىياسىي ئانالىز، ئىستراتېگىيەلىك تەتقىقات ۋە چوڭقۇر چۈشەنچە سۇپىسى.
            </p>
          </header>

          <article className="editorial-card">
            <h2>بىز كىم؟</h2>
            <p>
              <strong>ئۆتۈكەن سىياسەت تەتقىقات مەركىزى (Ötüken Policy Center)</strong> — خەلقئارا سىياسەت، ئوتتۇرا ئاسىيا ۋە رايون تەرەققىياتى، ئىستراتېگىيەلىك تەڭپۇڭلۇق ھەمدە كىشىلىك ھوقۇق مەسىلىلىرىنى چوڭقۇر تەھلىل قىلىدىغان مۇستەقىل ئىلمىي تەتقىقات ئورگىنىدۇر.
            </p>
            <p>
              مەركىزىمىز ئەنئەنىۋى چۈشەنچىلەرنىڭ سىرتىغا چىقىپ، كۆپ قۇتۇپلىشىۋاتقان يېڭى دۇنيا تەرتىپىدە يۈز بېرىۋاتقان تارىخىي، ئىقتىسادىي ۋە گېئوپولىتىكىلىق پەرقلەرنى ئوقۇرمەنلەرگە ئېنىق، ئىشەنچلىك ۋە تەرەپسىز كۆز قاراش بىلەن يەتكۈزۈشنى مەقسەت قىلىدۇ.
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
                <h3 style={{ margin: 0, fontSize: "20px" }}>بۇرچىمىز</h3>
              </div>
              <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                ئۇيغۇر ۋە تۈرك دۇنياسى ئوقۇرمەنلىرىنى خەلقئارا سىياسەت، خەۋپسىزلىك، تارىخ ۋە كەلگۈسى ئىستراتېگىيەلەر ھەققىدە سۈپەتلىك، دەلىل-ئىسپاتقا تايانغان ئانالىزلار بىلەن تەمىنلەش.
              </p>
            </div>

            <div className="editorial-card" style={{ margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--wine)", marginBottom: "12px" }}>
                <Globe size={24} />
                <h3 style={{ margin: 0, fontSize: "20px" }}>غايىمىز</h3>
              </div>
              <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                خەلقئارالىق سىياسەت مەركەزلىرى، ئاكادېمىكلار ۋە ئانالىزچىلار ئارىسىدا تەرەققىي قىلغان كۆۋرۈككە ئايلىنىپ، سىياسىي تەپەككۇرنىڭ يۈكسىلىشىگە تۆھپە قوشۇش.
              </p>
            </div>
          </div>

          <article className="editorial-card">
            <h2>تەتقىقات ساھەلىرىمىز</h2>
            <ul>
              <li>
                <strong>گېئوپولىتىكا ۋە دۇنيا سىياسىتى:</strong> چوڭ دۆلەتلەر ئوتتۇرىسىدىكى رىقابەت، خەلقئارا ئىتتىپاقلار، دىپلوماتىك تەڭپۇڭلۇق ۋە رايون بىخەتەرلىكى.
              </li>
              <li>
                <strong>ئوتتۇرا ئاسىيا ۋە تۈركىستان:</strong> تارىخىي باغلىنىش، ئىستراتېگىيەلىك ئىقتىسادىي لىنىيەلەر، رايون ئامىللىرى ۋە كەلگۈسى تەرەققىيات پۇرسەتلىرى.
              </li>
              <li>
                <strong>كىشىلىك ھوقۇق ۋە دېموكراتىيە:</strong> ئاساسىي كىشىلىك ھوقۇق پرىنسىپلىرى، ئاز سانلىق مىللەتلەرنىڭ تەقدىرى، ئادالەت ۋە خەلقئارا قانۇن تەتقىقاتى.
              </li>
              <li>
                <strong>كىتاب تونۇشتۇرۇش ۋە ئىلمىي ئوبزور:</strong> دۇنيا تەپەككۇرىدىكى يېڭى نەشر قىلىنغان مۇھىم سىياسىي، تارىخىي ۋە پەلسەپەۋى ئەسەرلەرنى تەپسىلىي باھالاش.
              </li>
            </ul>
          </article>

          <article className="editorial-card">
            <h2>نەشر پىرىنسىپلىرىمىز</h2>
            <p>
              ئۆتۈكەن سىياسەت تەتقىقات مەركىزى ئۆز ئانالىزلىرىدا مۇستەقىل ئاكادېمىك پىرىنسىپلارغا قەتئىي ئەمەل قىلىدۇ. مەركىزىمىز ھېچقانداق سىياسىي گۇرۇھ، پارتىيە ياكى تاشقى كۈچكە بېقىنمايدۇ؛ ئاپتورلارنىڭ بايانلىرى ئۇلارنىڭ ئۆز كۆز قارىشىغا ۋەكىللىك قىلىدۇ.
            </p>
            <div style={{ marginTop: "24px" }}>
              <Link href="/uy/contact" className="btn-submit">
                <Mail size={16} />
                <span>بىز بىلەن ئالاقىلىشىڭ</span>
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}

