"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="error-page" id="main"><span className="eyebrow" dir="ltr">ORHUN POLICY CENTER</span><h1>مەزمۇننى يۈكلەشكە بولمىدى</h1><p>بىر ئازدىن كېيىن قايتا سىناپ بېقىڭ.</p><button onClick={reset}>قايتا سىناش ←</button><a href="https://orhunpolicycenter.com/uy/">ئەسلى تور بېكەت</a></main>;
}
