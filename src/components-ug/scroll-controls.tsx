"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export function ScrollControls() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        setVisible(false);
        return;
      }
      const current = window.scrollY;
      const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
      setProgress(pct);
      setVisible(current > 200);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToBottom() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  }

  return (
    <aside
      className={`scroll-controls ${visible ? "is-visible" : ""}`}
      aria-label="Бәтни Сийриш Контроллири"
    >
      <button
        type="button"
        className="scroll-btn scroll-btn-up"
        onClick={scrollToTop}
        title="Чоққиға Чиқиш (Йуқириға)"
        aria-label="Чоққиға Чиқиш"
      >
        <ArrowUp size={16} strokeWidth={2.2} />
      </button>

      <div className="scroll-indicator" title={`Оқуш Пирсәнти: %${progress}`}>
        <svg className="scroll-ring" viewBox="0 0 36 36" aria-hidden="true">
          <path
            className="scroll-ring-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="scroll-ring-fill"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="scroll-pct">{progress}%</span>
      </div>

      <button
        type="button"
        className="scroll-btn scroll-btn-down"
        onClick={scrollToBottom}
        title="Астиға Чүшүш (Төвәнгә)"
        aria-label="Астиға Чүшүш"
      >
        <ArrowDown size={16} strokeWidth={2.2} />
      </button>
    </aside>
  );
}
