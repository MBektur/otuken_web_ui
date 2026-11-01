import type { Metadata } from "next";
import { Header, Footer } from "@/components-ug/shell";
import { getCategories } from "@/lib/wordpress";
import { ContactForm } from "@/components/contact-form";
import { buildSeoMetadata } from "@/lib/seo";
import { Mail, MessageSquare, Globe, Youtube } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    title: "Биз билән алақилишиң — Өтүкән Сийасәт Тәтқиқат Мәркизи",
    description: "Өтүкән Сийасәт Тәтқиқат Мәркизи билән алақилишиш, тәклип-пикир йаки тәтқиқат мақалилирини йоллаш.",
    path: "/ug/contact",
    locale: "ug",
    type: "website",
  });
}

export default async function UgContactPage() {
  const categories = await getCategories();

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width">
        <div className="editorial-page-container" dir="ltr">
          <header className="editorial-header">
            <span className="eyebrow">Алақилишиш</span>
            <h1>Биз билән алақилишиң</h1>
            <p>
              Тәклип-пикир, тәтқиқат мақалилирини тәқдим қилиш йаки мәркизимизгә мунасивәтлик соаллириңиз болса биз билән алақилишиң.
            </p>
          </header>

          <div className="contact-grid">
            {/* Form Column */}
            <div className="editorial-card" style={{ margin: 0 }}>
              <h2>Учур Әвәтиш</h2>
              <ContactForm isUg={true} />
            </div>

            {/* Info Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="editorial-card" style={{ margin: 0 }}>
                <h2>Алақә Учурлири</h2>
                <div className="contact-info-list">
                  <div className="contact-info-item">
                    <Mail className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>Асасий Елхәт</strong>
                      <a href="mailto:info@orhunpolicycenter.com" dir="ltr">info@orhunpolicycenter.com</a>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <MessageSquare className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>Мақалә Йоллаш (Тәһрират)</strong>
                      <a href="mailto:editor@orhunpolicycenter.com" dir="ltr">editor@orhunpolicycenter.com</a>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <Globe className="contact-info-icon" size={20} />
                    <div className="contact-info-text">
                      <strong>Рәсмий Тор Бети</strong>
                      <span dir="ltr">orhunpolicycenter.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editorial-card" style={{ margin: 0 }}>
                <h2>Ижтимаий Таратқу</h2>
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
                  Мақалә Тәклипи Бериш Тәртипи
                </h3>
                <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                  Әгәр тәтқиқат мақалиңизни Өтүкән Сийасәт Мәркизидә елан қилишни ойлисиңиз, мақалә темиси, қисқичә мәзмуни вә аптор тонуштурушини елхәт арқилиқ йоллап бериң.
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
