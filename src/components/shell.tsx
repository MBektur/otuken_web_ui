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
          <a
            href="https://whatsapp.com/channel/0029Vb75m2h5q08kBFXgb83I"
            target="_blank"
            rel="noopener noreferrer"
            className="social-round-btn whatsapp"
            aria-label="WhatsApp"
            title="ئۆتۈكەن سىياسەت تەتقىقات مەركىزى WhatsApp قانىلى"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
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
          <Link href="/uy/about">ھەققىمىزدە</Link>
          <Link href="/uy/contact">ئالاقىلىشىڭ</Link>
          <Link href="/uy/install">ئەپنى قاچىلاش (PWA)</Link>
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
            <a
              href="https://whatsapp.com/channel/0029Vb75m2h5q08kBFXgb83I"
              target="_blank"
              rel="noopener noreferrer"
              className="social-round-btn footer-btn whatsapp"
              title="WhatsApp Channel"
              aria-label="WhatsApp Channel"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </nav>
        <small>© {new Date().getFullYear()} ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</small>
      </div>
    </footer>
  );
}
