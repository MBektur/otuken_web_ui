"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";

export function LanguageSwitcher({ currentLocale = "uy" }: { currentLocale?: "uy" | "ug" }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const searchStr = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  // Compute corresponding path for Uyghur Arabic (UEY: /uy/...)
  let uyPath = "/uy";
  if (pathname.startsWith("/ug")) {
    const sub = pathname.replace(/^\/ug(\/|$)/, "$1");
    uyPath = `/uy${sub ? (sub.startsWith("/") ? sub : "/" + sub) : ""}${searchStr}`;
  } else if (pathname.startsWith("/uy")) {
    uyPath = `${pathname}${searchStr}`;
  } else {
    uyPath = `/uy${pathname ? (pathname.startsWith("/") ? pathname : "/" + pathname) : ""}${searchStr}`;
  }

  // Compute corresponding path for Uyghur Cyrillic (UKY: /ug/...)
  let ugPath = "/ug";
  if (pathname.startsWith("/uy")) {
    const sub = pathname.replace(/^\/uy(\/|$)/, "$1");
    ugPath = `/ug${sub ? (sub.startsWith("/") ? sub : "/" + sub) : ""}${searchStr}`;
  } else if (pathname.startsWith("/ug")) {
    ugPath = `${pathname}${searchStr}`;
  } else {
    ugPath = `/ug${pathname ? (pathname.startsWith("/") ? pathname : "/" + pathname) : ""}${searchStr}`;
  }

  const isUg = pathname.startsWith("/ug") || currentLocale === "ug";

  // Ensure document direction and lang attributes match the current route instantly
  useEffect(() => {
    if (isUg) {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "ug-Cyrl");
      document.body.classList.add("ug-cyrl");
    } else {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ug");
      document.body.classList.remove("ug-cyrl");
    }
  }, [isUg]);

  return (
    <div className="language-links" id="language-switcher" dir="rtl">
      <Languages size={13} className="lang-icon" aria-hidden="true" />
      <div className="script-switcher" role="group" aria-label="يېزىق تاللاش / Тил таллаش" dir="rtl">
        <Link
          href={uyPath}
          prefetch={true}
          className={`script-pill ${!isUg ? "is-active" : ""}`}
          lang="ug"
          dir="rtl"
          aria-current={!isUg ? "true" : undefined}
          title="ئۇيغۇر ئەرەب يېزىقى"
        >
          ئۇيغۇرچە
        </Link>
        <Link
          href={ugPath}
          prefetch={true}
          className={`script-pill ${isUg ? "is-active" : ""}`}
          lang="ug-Cyrl"
          dir="ltr"
          aria-current={isUg ? "true" : undefined}
          title="Уйғур Кирилл йезиқи"
        >
          Уйғурчә
        </Link>
      </div>
      <a
        href="https://otukenpolicycenter.com/"
        lang="en"
        dir="ltr"
        target="_blank"
        rel="noopener noreferrer"
        className="lang-external-en"
      >
        English <ArrowUpLeft size={11} />
      </a>
    </div>
  );
}
