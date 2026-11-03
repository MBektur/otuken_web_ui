"use client";

import { useEffect, useState } from "react";

export function BootSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("fade"));
    const timer = setTimeout(() => setPhase("gone"), 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div id="boot-splash" aria-hidden="true" data-phase={phase}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-512x512.png" alt="" width={128} height={128} fetchPriority="high" decoding="sync" />
    </div>
  );
}
