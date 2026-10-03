"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StickyNavProps {
  children: React.ReactNode;
  homeHref: string;
  logoSrc: string;
  altText: string;
}

export function StickyNav({
  children,
  homeHref,
  logoSrc,
  altText,
}: StickyNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Trigger when user scrolls past the top masthead
          const scrolled = window.scrollY > 95;
          setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`navigation-wrap ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="site-width navigation-inner">
        <Link
          href={homeHref}
          className="sticky-brand-logo"
          aria-label={altText}
          aria-hidden={!isScrolled}
          tabIndex={isScrolled ? 0 : -1}
        >
          <img
            src={logoSrc}
            alt={altText}
            width={730}
            height={141}
            className="sticky-logo-img"
            loading="lazy"
          />
        </Link>
        {children}
      </div>
    </div>
  );
}
