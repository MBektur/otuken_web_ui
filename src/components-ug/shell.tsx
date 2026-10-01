import Link from "next/link";
import {
  ArrowUpRight,
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
import { Category, localPath } from "@/lib/wordpress-ug";
import { LanguageSwitcher } from "@/components/language-switcher";

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

export function Header({ categories, active }: { categories: Category[]; active?: number | string }) {
  const analysis = categories.find(c => c.id === 3);
  const otherCats = [22, 14, 21].map(id => categories.find(c => c.id === id)).filter((c): c is Category => !!c);
  return <>
    <div className="utility-bar"><div className="site-width utility-inner">
      <span>Тәтқиқат · Анализ · Йеңи Нәзәр</span>
      <LanguageSwitcher currentLocale="ug" />
    </div></div>
    <header className="site-width masthead">
      <Link href="/ug" className="brand" aria-label="Башбәт">
        <svg className="brand-mark" viewBox="0 0 50 66" fill="none" aria-hidden="true"><path d="M4 62V4h42v58H4Z M10 62V10h30v52 M16 62V30c0-8 9-14 9-14s9 6 9 14v32 M22 62V32c0-4 3-7 3-7s3 3 3 7v30" stroke="currentColor" strokeWidth="1.8" /><path d="M4 4l6 6M46 4l-6 6M4 62l6-6M46 62l-6-6" stroke="currentColor" /></svg>
        <div><span className="brand-title">Өтүкән</span><span className="brand-subtitle">Сийасәт Тәтқиқат Мәркизи</span><span className="brand-english" dir="ltr">ORHUN POLICY CENTER</span></div>
      </Link>
      <div className="masthead-motto"><span>Дунйаға Нәзәр,</span><span>Кәлгүсигә Тәпәккур.</span><small dir="ltr">INDEPENDENT THOUGHT. GLOBAL PERSPECTIVE.</small></div>
      <div className="masthead-edition" dir="ltr"><span>THE ORHUN REVIEW</span><span className="edition-line" /><span>ANALYSIS & INSIGHT</span></div>
    </header>
    <div className="navigation-wrap"><div className="site-width navigation-inner">
      <nav aria-label="Баш Тизимлик">
        <Link href="/ug" className={!active ? "active" : ""}>
          <Home size={15} className="nav-icon" aria-hidden="true" />
          <span>Башбәт</span>
        </Link>
        {analysis && (
          <Link href={localPath(analysis.link)} className={active === analysis.id ? "active" : ""}>
            <TrendingUp size={15} className="nav-icon" aria-hidden="true" />
            <span>{analysis.name}</span>
          </Link>
        )}
        <Link href="/ug/podcasts" className={`nav-podcast-item ${active === "podcasts" ? "active" : ""}`}>
          <Headphones size={15} className="nav-icon" aria-hidden="true" />
          <span>Подкастлар</span>
        </Link>
        {otherCats.map(c => (
          <Link key={c.id} href={localPath(c.link)} className={active === c.id ? "active" : ""}>
            {getCategoryNavIcon(c.id, c.slug)}
            <span>{c.name}</span>
          </Link>
        ))}
        <Link href="/ug#regions">
          <Compass size={15} className="nav-icon" aria-hidden="true" />
          <span>Районлар</span>
        </Link>
      </nav>
      <SearchForm compact />
    </div></div>
  </>;
}

export function SearchForm({ compact = false, value }: { compact?: boolean; value?: string }) {
  return <form action="/ug" className={`search-form ${compact ? "compact" : ""}`} role="search">
    <Search size={17} aria-hidden="true" /><input name="q" defaultValue={value} placeholder="Йазма, Тема Йаки Район Издәң..." aria-label="Издәш" maxLength={200} /><button type="submit" aria-label="Издәш"><ArrowUpRight size={17} /></button>
  </form>;
}

export function Footer() {
  return <footer className="footer"><div className="site-width footer-inner"><Link href="/ug" className="footer-brand">Өтүкән <span dir="ltr">POLICY CENTER</span></Link><nav aria-label="Асти Тизимлик"><Link href="/ug/podcasts">Подкастлар</Link><Link href="/ug/Һәққимиздә/">Һәққимиздә</Link><Link href="/ug/biz-bilen-alaqilid/">Алақилишиң</Link><Link href="/ug/teklip-pikir/">Тәклип-Пикир</Link></nav><small>© {new Date().getFullYear()} Өтүкән Сийасәт Тәтқиқат Мәркизи</small></div></footer>;
}
