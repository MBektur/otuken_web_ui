"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all internal link clicks for instant 0ms visual feedback
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http://") || href.startsWith("https://") || target.target === "_blank") {
        return;
      }

      // If clicking same URL without search param changes, skip
      if (href === window.location.pathname + window.location.search) {
        return;
      }

      setLoading(true);
      setProgress(25);
      setTimeout(() => setProgress(prev => (prev < 80 ? 75 : prev)), 120);
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => document.removeEventListener("click", handleDocumentClick, { capture: true });
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="global-nav-progress-bar"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
      }}
      aria-hidden="true"
    />
  );
}
