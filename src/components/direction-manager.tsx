"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function DirectionManager() {
  const pathname = usePathname();

  useEffect(() => {
    const isUg = pathname?.startsWith("/ug");
    if (isUg) {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "ug-Cyrl");
      document.body.classList.add("ug-cyrl");
    } else {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ug");
      document.body.classList.remove("ug-cyrl");
    }
  }, [pathname]);

  return null;
}
