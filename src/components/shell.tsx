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

export function Header({ categories, active }: { categories: Category[]; active?: number | string }) {
  const analysis = categories.find(c => c.id === 3);
  const otherCats = [22, 14, 21].map(id => categories.find(c => c.id === id)).filter((c): c is Category => !!c);
  return <>
    <div className="utility-bar" dir="rtl"><div className="site-width utility-inner" dir="rtl">
      <span>تەتقىقات · ئانالىز · يېڭى نەزەر</span>
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
          onError={(e) => {
            e.currentTarget.src = "https://orhunpolicycenter.com/uy/wp-content/uploads/2025/08/logo.Header-UY.png";
          }}
        />
      </Link>
      <div className="masthead-motto"><span>دۇنياغا نەزەر،</span><span>كەلگۈسىگە تەپەككۇر.</span><small dir="ltr">INDEPENDENT THOUGHT. GLOBAL PERSPECTIVE.</small></div>
      <div className="masthead-edition" dir="ltr"><span>THE ORHUN REVIEW</span><span className="edition-line" /><span>ANALYSIS & INSIGHT</span></div>
    </header>
    <div className="navigation-wrap"><div className="site-width navigation-inner">
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
    </div></div>
  </>;
}

export function SearchForm({ compact = false, value }: { compact?: boolean; value?: string }) {
  return <form action="/uy" className={`search-form ${compact ? "compact" : ""}`} role="search">
    <Search size={17} aria-hidden="true" /><input name="q" key={value || "empty"} defaultValue={value} placeholder="يازما، تېما ياكى رايون ئىزدەڭ..." aria-label="ئىزدەش" maxLength={200} /><button type="submit" aria-label="ئىزدەش"><ArrowUpLeft size={17} /></button>
  </form>;
}

export function Footer() {
  return <footer className="footer"><div className="site-width footer-inner"><Link href="/uy" className="footer-brand">ئۆتۈكەن <span dir="ltr">POLICY CENTER</span></Link><nav aria-label="ئاستى تىزىملىك"><Link href="/uy/podcasts">پودكاستلار</Link><Link href="/uy/ھەققىمىزدە/">ھەققىمىزدە</Link><Link href="/uy/biz-bilen-alaqilid/">ئالاقىلىشىڭ</Link><Link href="/uy/teklip-pikir/">تەكلىپ-پىكىر</Link></nav><small>© {new Date().getFullYear()} ئۆتۈكەن سىياسەت تەتقىقات مەركىزى</small></div></footer>;
}
