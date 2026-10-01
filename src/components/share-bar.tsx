"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface ShareBarProps {
  title: string;
  url?: string;
  className?: string;
  variant?: "top" | "bottom";
}

export function ShareBar({ title, url: initialUrl, className = "", variant = "top" }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(initialUrl || "");
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (!shareUrl && typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setHasNativeShare(true);
    }
  }, [shareUrl]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      if (typeof window !== "undefined" && navigator?.clipboard) {
        await navigator.clipboard.writeText(shareUrl || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch {
        // User dismissed
      }
    }
  };

  return (
    <div className={`article-share-bar variant-${variant} ${className}`} aria-label="ھەمبەھىرلەش تاللانمىلىرى">
      <span className="share-label">
        <Share2 size={14} aria-hidden="true" />
        <span>ھەمبەھىرلەش:</span>
      </span>

      <div className="share-buttons-group">
        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-x"
          title="X (Twitter) دا ھەمبەھىرلەش"
          aria-label="X دا ھەمبەھىرلەش"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-telegram"
          title="Telegram دا ھەمبەھىرلەش"
          aria-label="Telegram دا ھەمبەھىرلەش"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </a>

        {/* WhatsApp */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-whatsapp"
          title="WhatsApp دا ھەمبەھىرلەش"
          aria-label="WhatsApp دا ھەمبەھىرلەش"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-facebook"
          title="Facebook ta ھەمبەھىرلەش"
          aria-label="Facebook ta ھەمبەھىرلەش"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className={`share-btn share-copy ${copied ? "copied" : ""}`}
          title="ئۇلىنىشنى كۆچۈرۈۋېلىش"
          aria-label="ئۇلىنىشنى كۆچۈرۈۋېلىش"
        >
          {copied ? <Check size={13} className="copy-icon-success" /> : <Copy size={13} />}
          <span className="copy-tooltip">{copied ? "كۆچۈرۈلدى!" : "كۆچۈرۈش"}</span>
        </button>

        {/* Native Mobile Share */}
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="share-btn share-native"
            title="باشقا ئەپلەردە ھەمبەھىرلەش"
            aria-label="باشقا ئەپلەردە ھەمبەھىرلەش"
          >
            <Share2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
