import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { ContactForm } from "@/components/contact-form";
import { buildSeoMetadata } from "@/lib/seo";
import { MessageSquare, Globe, Youtube } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "تەكلىپ-پىكىر — ئۆتۈكەن سىياسەت تەتقىقات مەركىزى",
    description: "ئۆتۈكەن سىياسەت تەتقىقات مەركىزى بىلەن ئالاقىلىشىش، تەكلىپ-پىكىر ياكى تەتقىقات ماقالىلىرىنى يوللاش.",
    path: "/uy/teklip-pikir",
    locale: "uy",
    type: "website",
  });
}

export default async function TeklipPikirPage() {
  const categories = await getCategories();

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <div className="editorial-page-container" dir="rtl">
          <header className="editorial-header">
            <span className="eyebrow">تەكلىپ-پىكىر</span>
            <h1>تەكلىپ-پىكىر ۋە بىز بىلەن ئالاقىلىشىڭ</h1>
            <p>
              تەكلىپ-پىكىر، تەتقىقات ماقالىلىرىنى تەقدىم قىلىش ياكى مەركىزىمىزگە مۇناسىۋەتلىك سوئاللىرىڭىز بولسا بىز بىلەن ئالاقىلىشىڭ.
            </p>
          </header>

          <div className="contact-grid">
            {/* Form Column */}
            <div className="editorial-card" style={{ margin: 0 }}>
              <h2>ئۇچۇر ياكى تەكلىپ ئەۋەتىش</h2>
              <ContactForm isUg={false} />
            </div>

            {/* Info Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="editorial-card" style={{ margin: 0 }}>
                <h2>ئالاقە ئۇچۇرلىرى</h2>
                <div className="contact-info-list">
                  <div className="contact-info-item">
                    <MessageSquare className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>ماقالە يوللاش (تەھرىرات)</strong>
                      <a href="mailto:otuken2025@gmail.com" dir="ltr">otuken2025@gmail.com</a>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <Globe className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>رەسمىي تور بېكەت</strong>
                      <span dir="ltr">otukenpolicycenter.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editorial-card" style={{ margin: 0, background: "rgba(104,21,42,0.03)" }}>
                <h3 style={{ color: "var(--wine)", margin: "0 0 8px 0" }}>
                  ماقالە تەكلىپى بېرىش تەرتىپى
                </h3>
                <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                  ئەگەر تەتقىقات ماقالىڭىزنى «ئۆتۈكەن سىياسەت مەركىزى» تور بېكىتىدە ئېلان قىلىشنى ئويلىسىڭىز، ماقالە تېمىسى، قىسقىچە مەزمۇنى ۋە ئاپتور تونۇشتۇرۇشىنى ئې-خەت ئارقىلىق يوللاپ بېرىڭ.
                </p>
              </div>

              <div className="editorial-card" style={{ margin: 0 }}>
                <h2>ئىجتىمائىي تاراتقۇ ھېساباتلىرىمىز</h2>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <a
                    href="https://www.youtube.com/@%C3%96t%C3%BCkenPolicyCenter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-round-btn youtube"
                    style={{ width: "42px", height: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="YouTube"
                  >
                    <Youtube size={20} />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=100081744912628"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-round-btn facebook"
                    style={{ width: "42px", height: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}
                    aria-label="Facebook"
                  >
                    <span className="social-f">f</span>
                  </a>
                  <a
                    href="https://whatsapp.com/channel/0029Vb75m2h5q08kBFXgb83I"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-round-btn whatsapp"
                    style={{ width: "42px", height: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="WhatsApp"
                    title="WhatsApp Channel"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
