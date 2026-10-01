import Link from "next/link";
import { Home, Compass, Headphones } from "lucide-react";
import { getCategories } from "@/lib/wordpress";
import { Header, Footer, SearchForm } from "@/components/shell";

export default async function NotFound() {
  const categories = await getCategories().catch(() => []);

  return (
    <>
      <Header categories={categories} />
      <main id="main" className="site-width error-page-layout">
        <div className="error-card">
          <div className="error-code-badge" dir="ltr">404</div>
          <span className="error-eyebrow">ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</span>
          <h1 className="error-title">بەت تېپىلمىدى</h1>
          <p className="error-desc">
            سىز ئىزدەۋاتقان مەزمۇن تېپىلمىدى ياكى ئادرېسى ئۆزگەرگەن بولۇشى مۇمكىن.
            تۆۋەندىكى ئىزدەش بۆلىكى ئارقىلىق باشقا مەزمۇنلارنى ئىزدەپ باقسىڭىز ياكى باشبەتكە قايتسىڭىز بولىدۇ.
          </p>

          <div className="error-search-wrap">
            <SearchForm />
          </div>

          <div className="error-actions">
            <Link href="/uy" className="error-btn-primary">
              <Home size={16} aria-hidden="true" />
              <span>باشبەتكە قايتىش</span>
            </Link>
            <Link href="/uy/podcasts" className="error-btn-secondary">
              <Headphones size={16} aria-hidden="true" />
              <span>پودكاستلار</span>
            </Link>
            <Link href="/uy#regions" className="error-btn-secondary">
              <Compass size={16} aria-hidden="true" />
              <span>بارلىق رايونلار</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
