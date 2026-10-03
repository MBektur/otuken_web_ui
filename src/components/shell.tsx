import Link from "next/link";
import {
  ArrowUpLeft,
  Search,
  Home,
  TrendingUp,
  Headphones,
  Globe,
  BookOpen,
  Cpu,
  Compass,
  Bookmark,
  Languages,
  Facebook,
  Youtube,
} from "lucide-react";
import { Category } from "@/lib/wordpress";
import { localPath } from "@/lib/content";

function getCategoryNavIcon(categoryId: number, slug: string) {
  if (categoryId === 3 || slug.includes("analiz")) {
    return <TrendingUp size={15} className="nav-icon" aria-hidden="true" />;
  }
  if (categoryId === 22 || slug.includes("dunyada") || slug.includes("dunya")) {
    return <Globe size={15} className="nav-icon" aria-hidden="true" />;
  }
  if (categoryId === 14 || slug.includes("kitap") || slug.includes("kitob")) {
    return <BookOpen size={15} className="nav-icon" aria-hidden="true" />;
  }
  if (categoryId === 21 || slug.includes("iqtisad") || slug.includes("texnika")) {
    return <Cpu size={15} className="nav-icon" aria-hidden="true" />;
  }
  return <Bookmark size={15} className="nav-icon" aria-hidden="true" />;
}

import { LanguageSwitcher } from "@/components/language-switcher";
import { StickyNav } from "@/components/sticky-nav";

export function Header({ categories, active }: { categories: Category[]; active?: number | string }) {
  const analysis = categories.find(c => c.id === 3);
  const otherCats = [22, 14, 21].map(id => categories.find(c => c.id === id)).filter((c): c is Category => !!c);
  return <>
    <div className="utility-bar" dir="rtl"><div className="site-width utility-inner" dir="rtl">
      <div className="utility-left">
        <span className="utility-tagline">تەتقىقات · ئانالىز · يېڭى نەزەر</span>
        <span className="utility-divider">|</span>
        <div className="utility-socials">
          <a
            href="https://www.facebook.com/profile.php?id=100081744912628"
            target="_blank"
            rel="noopener noreferrer"
            className="social-round-btn facebook"
            aria-label="Facebook"
            title="ئۆتۈكەن سىياسەت تەتقىقات مەركىزى Facebook سەھىپىسى"
          >
            <span className="social-f" aria-hidden="true">f</span>
          </a>
          <a
            href="https://www.youtube.com/@%C3%96t%C3%BCkenPolicyCenter"
            target="_blank"
            rel="noopener noreferrer"
            className="social-round-btn youtube"
            aria-label="YouTube"
            title="ئۆتۈكەن سىياسەت تەتقىقات مەركىزى YouTube قانىلى"
          >
            <Youtube size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
      <LanguageSwitcher currentLocale="uy" />
    </div></div>
    <header className="site-width masthead">
      <Link href="/uy" className="brand" aria-label="باشبەت">
        <img
          src="/logo.Header-UY.png"
          alt="ئۆتۈكەن سىياسەت تەتقىقات مەركىزى"
          className="brand-logo-img"
          width={730}
          height={141}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </Link>
      <div className="masthead-motto"><span>دۇنياغا نەزەر،</span><span>كەلگۈسىگە تەپەككۇر.</span><small dir="ltr">INDEPENDENT THOUGHT. GLOBAL PERSPECTIVE.</small></div>
      <div className="masthead-edition" dir="ltr"><span>THE ORHUN REVIEW</span><span className="edition-line" /><span>ANALYSIS & INSIGHT</span></div>
    </header>
    <StickyNav
      homeHref="/uy"
      logoSrc="/logo.Header-UY.png"
      altText="ئۆتۈكەن سىياسەت تەتقىقات مەركىزى"
    >
      <nav aria-label="باش تىزىملىك">
        <Link href="/uy" prefetch={true} className={!active ? "active" : ""}>
          <Home size={15} className="nav-icon" aria-hidden="true" />
          <span>باشبەت</span>
        </Link>
        {analysis && (
          <Link href={localPath(analysis.link)} prefetch={true} className={active === analysis.id ? "active" : ""}>
            <TrendingUp size={15} className="nav-icon" aria-hidden="true" />
            <span>{analysis.name}</span>
          </Link>
        )}
        <Link href="/uy/podcasts" prefetch={true} className={`nav-podcast-item ${active === "podcasts" ? "active" : ""}`}>
          <Headphones size={15} className="nav-icon" aria-hidden="true" />
          <span>پودكاستلار</span>
        </Link>
        {otherCats.map(c => (
          <Link key={c.id} href={localPath(c.link)} prefetch={true} className={active === c.id ? "active" : ""}>
            {getCategoryNavIcon(c.id, c.slug)}
            <span>{c.name}</span>
          </Link>
        ))}
        <Link href="/uy#regions" prefetch={true}>
          <Compass size={15} className="nav-icon" aria-hidden="true" />
          <span>رايونلار</span>
        </Link>
      </nav>
      <SearchForm compact />
    </StickyNav>
  </>;
}

export function SearchForm({ compact = false, value }: { compact?: boolean; value?: string }) {
  return <form action="/uy" className={`search-form ${compact ? "compact" : ""}`} role="search">
    <Search size={17} aria-hidden="true" /><input name="q" key={value || "empty"} defaultValue={value} placeholder="يازما، تېما ياكى رايون ئىزدەڭ..." aria-label="ئىزدەش" maxLength={200} /><button type="submit" aria-label="ئىزدەش"><ArrowUpLeft size={17} /></button>
  </form>;
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="site-width footer-inner">
        <Link href="/uy" className="footer-brand" aria-label="باشبەت">
          <img
            src="/logo.Header-UY.png"
            alt="ئۆتۈكەن سىياسەت تەتقىقات مەركىزى"
            className="footer-logo-img"
            width={730}
            height={141}
            loading="lazy"
          />
        </Link>
        <nav aria-label="ئاستى تىزىملىك">
          <Link href="/uy/podcasts">پودكاستلار</Link>
          <Link href="/uy/ھەققىمىزدە/">ھەققىمىزدە</Link>
          <Link href="/uy/biz-bilen-alaqilid/">ئالاقىلىشىڭ</Link>
          <Link href="/uy/teklip-pikir/">تەكلىپ-پىكىر</Link>
          <div className="footer-socials">
            <a
              href="https://www.facebook.com/profile.php?id=100081744912628"
              target="_blank"
              rel="noopener noreferrer"
              className="social-round-btn footer-btn facebook"
              title="Facebook"
              aria-label="Facebook"
            >
              <span className="social-f" aria-hidden="true">f</span>
            </a>
            <a
              href="https://www.youtube.com/@%C3%96t%C3%BCkenPolicyCenter"
              target="_blank"
              rel="noopener noreferrer"
              className="social-round-btn footer-btn youtube"
              title="YouTube"
              aria-label="YouTube"
            >
              <Youtube size={15} aria-hidden="true" />
            </a>
          </div>
        </nav>
        <small>© {new Date().getFullYear()} ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</small>
      </div>
    </footer>
  );
}
