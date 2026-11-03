// Inline <head> styles for <BootSplash />, so it paints before globals.css arrives.
// Kept out of the "use client" component file so the server layout gets the real string.
export const BOOT_SPLASH_CSS = `
#boot-splash{display:none}
@media (display-mode: standalone){
#boot-splash{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#faf7f0;animation:boot-splash-hide .01s linear 4s forwards!important}
#boot-splash[data-phase="fade"]{opacity:0;transition:opacity .25s ease}
}
/* iOS only: match the OS splash (icon 512px @3x = ~171 CSS px, centred on the full screen).
   The web view starts below the status bar, so its centre sits higher; --boot-ios-shift compensates. */
@supports (-webkit-touch-callout:none){
@media (display-mode: standalone){
#boot-splash{--boot-ios-shift:30px}
#boot-splash img{width:171px;height:171px;transform:translateY(var(--boot-ios-shift))}
}
}
@keyframes boot-splash-hide{to{opacity:0;visibility:hidden;pointer-events:none}}
`;
