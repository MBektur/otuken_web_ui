import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { getCategories } from "@/lib/wordpress";
import { ContactForm } from "@/components/contact-form";
import { buildSeoMetadata } from "@/lib/seo";
import { Mail, MessageSquare, Send, Globe, Youtube, Facebook, MapPin } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "بىز بىلەن ئالاقىلىشىڭ — ئۆتۈكەن سىياسەت تەتقىقات مەركىزى",
    description: "ئۆتۈكەن سىياسەت تەتقىقات مەركىزى بىلەن ئالاقىلىشىش، تەكلىپ-پىكىر ياكى تەتقىقات ماقالىلىرىنى يوللاش.",
    path: "/uy/contact",
    locale: "uy",
    type: "website",
  });
}

export default async function ContactPage() {
  const categories = await getCategories();

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <div className="editorial-page-container" dir="rtl">
          <header className="editorial-header">
            <span className="eyebrow">ئالاقىلىشىش</span>
            <h1>بىز بىلەن ئالاقىلىشىڭ</h1>
            <p>
              تەكلىپ-پىكىر، تەتقىقات ماقالىلىرىنى تەقدىم قىلىش ياكى مەركىزىمىزگە مۇناسىۋەتلىك سوئاللىرىڭىز بولسا بىز بىلەن ئالاقىلىشىڭ.
            </p>
          </header>

          <div className="contact-grid">
            {/* Form Column */}
            <div className="editorial-card" style={{ margin: 0 }}>
              <h2>ئۇچۇر ئەۋەتىش</h2>
              <ContactForm isUg={false} />
            </div>

            {/* Info Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="editorial-card" style={{ margin: 0 }}>
                <h2>ئالاقە ئۇچۇرلىرى</h2>
                <div className="contact-info-list">
                  <div className="contact-info-item">
                    <Mail className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>ئاساسىي ئېلخەت</strong>
                      <a href="mailto:info@orhunpolicycenter.com" dir="ltr">info@orhunpolicycenter.com</a>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <MessageSquare className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>ماقالە يوللاش (تەھرىرات)</strong>
                      <a href="mailto:editor@orhunpolicycenter.com" dir="ltr">editor@orhunpolicycenter.com</a>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <Globe className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>رەسمىي تور بېكەت</strong>
                      <span dir="ltr">orhunpolicycenter.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editorial-card" style={{ margin: 0 }}>
                <h2>ئىجتىمائىي تاراتقۇ</h2>
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
                </div>
              </div>

              <div className="editorial-card" style={{ margin: 0, background: "rgba(104,21,42,0.03)" }}>
                <h3 style={{ fontSize: "16px", color: "var(--wine)", margin: "0 0 8px 0" }}>
                  ماقالە تەكلىپى بېرىش تەرتىپى
                </h3>
                <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                  ئەگەر تەتقىقات ماقالىڭىزنى ئۆتۈكەن سىياسەت مەركىزىدە ئېلان قىلىشنى ئويلىسىڭىز، ماقالە تېمىسى، قىسقىچە مەزمۇنى ۋە ئاپتور تونۇشتۇرۇشىنى ئېلخەت ئارقىلىق يوللاپ بېرىڭ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

