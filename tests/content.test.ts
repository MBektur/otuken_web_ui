import test from "node:test";
import assert from "node:assert/strict";
import { contentImage, localPath, normalizedPath, plainText, safeContent } from "../src/lib/content";

test("WordPress content is sanitized and internal links keep the new frontend", () => {
  const output = safeContent('<script>alert(1)</script><p onclick="attack()">Hello</p><a href="javascript:attack()">Bad</a><a href="https://orhunpolicycenter.com/uy/2026/09/26/test/">Article</a><img src="https://example.com/a.png" onerror="attack()">');
  assert.ok(!output.includes("script"));
  assert.ok(!output.includes("onclick"));
  assert.ok(!output.includes("onerror"));
  assert.ok(!output.includes("javascript:"));
  assert.ok(output.includes('href="/uy/2026/09/26/test/"'));
});

test("images are found inside posts when featured_media is missing", () => {
  assert.equal(contentImage('<figure><img width="596" src="https://orhunpolicycenter.com/uy/wp-content/uploads/photo.png?a=1&amp;b=2"></figure>'), "https://orhunpolicycenter.com/uy/wp-content/uploads/photo.png?a=1&b=2");
  assert.equal(contentImage('<img src="javascript:alert(1)">'), undefined);
});

test("Uyghur permalinks and entities survive normalization", () => {
  assert.equal(normalizedPath("/uy/%DA%BE%DB%95%D9%82/"), "/uy/ھەق");
  assert.equal(normalizedPath("/uy/2025/06/18/%d8%a6%d9%89%d8%b3%d8%b1%d8%a7%d8%a6%d9%89%d9%84%d9%89%d9%8a%db%95-%d8%a6%d9%89%d8%b1%d8%a7%d9%86-d"), "/uy/2025/06/18/ئىسرائىلىيە-ئىران-d");
  assert.equal(normalizedPath("/uy/2025/06/18/ئىسرائىلىيە-ئىران-d/"), "/uy/2025/06/18/ئىسرائىلىيە-ئىران-d");
  assert.equal(plainText("<p>خىتاي &#8211; رۇسىيە</p>"), "خىتاي – رۇسىيە");
  assert.equal(localPath("https://orhunpolicycenter.com/uy/category/test/"), "/uy/category/test/");
  assert.equal(localPath("https://orhunpolicycenter.com/ug/"), "https://orhunpolicycenter.com/ug/");
  assert.equal(localPath("https://example.com/source"), "https://example.com/source");
  assert.equal(localPath("#footnote-1"), "#footnote-1");
  assert.equal(localPath("https://orhunpolicycenter.com/uy/wp-content/uploads/report.pdf"), "https://orhunpolicycenter.com/uy/wp-content/uploads/report.pdf");
});

test("Uyghur post slug resolution matches decoded, raw, and encoded variations", () => {
  const { getLocalPostBySlug, safeDecode } = require("../src/lib/cache-store");
  const rawEncoded = "%d8%a6%d9%89%d8%b3%d8%b1%d8%a7%d8%a6%d9%89%d9%84%d9%89%d9%8a%db%95-%d8%a6%d9%89%d8%b1%d8%a7%d9%86-d";
  const decoded = "ئىسرائىلىيە-ئىران-d";
  const upperEncoded = encodeURIComponent(decoded);

  assert.equal(safeDecode(rawEncoded), decoded);
  assert.equal(safeDecode(upperEncoded), decoded);

  const post1 = getLocalPostBySlug(rawEncoded);
  const post2 = getLocalPostBySlug(decoded);
  const post3 = getLocalPostBySlug(upperEncoded);

  assert.ok(post1);
  assert.equal(post1.id, 81);
  assert.equal(post2?.id, 81);
  assert.equal(post3?.id, 81);

  // Test post 317 with truncated malformed %d8 at end:
  const malformedSlug = "%d8%ae%db%95%d9%84%d9%82%d8%a6%d8%a7%d8%b1%d8%a7-%d9%85%db%87%d9%86%d8%a7%d8%b3%d9%89%db%8b%db%95%d8";
  const post317 = getLocalPostBySlug(malformedSlug);
  assert.ok(post317);
  assert.equal(post317.id, 317);
  assert.equal(normalizedPath(`/uy/2025/01/02/${malformedSlug}`), "/uy/2025/01/02/خەلقئارا-مۇناسىۋە");
});

test("plugin widgets are omitted and only recognized video hosts are embedded", () => {
  const result = safeContent('<p>Article</p><div id="daexthefu-container"><div><h3>Plugin button</h3></div></div><p>End</p><iframe src="https://www.youtube.com/embed/abc"></iframe><iframe src="https://evil.example/embed"></iframe>');
  assert.ok(result.includes("Article"));
  assert.ok(result.includes("End"));
  assert.ok(!result.includes("Plugin button"));
  assert.ok(result.includes("https://www.youtube.com/embed/abc"));
  assert.ok(!result.includes("evil.example"));
});

test("YouTube IDs are extracted correctly from embeds and urls for podcasts", () => {
  const { extractYoutubeId } = require("../src/lib/content");
  assert.equal(
    extractYoutubeId('<iframe width="560" height="315" src="https://www.youtube.com/embed/NlgZanVJZw8" title="YouTube video"></iframe>'),
    "NlgZanVJZw8"
  );
  assert.equal(
    extractYoutubeId('<p>Watch here: https://youtu.be/HPOa4HnsznI?si=abc</p>'),
    "HPOa4HnsznI"
  );
  assert.equal(
    extractYoutubeId('<a href="https://www.youtube.com/watch?v=hJLuyjDlpCo">Video</a>'),
    "hJLuyjDlpCo"
  );
  assert.equal(
    extractYoutubeId('<p>No video here just text and photos</p>'),
    undefined
  );
});

test("cache-sync validates secret key correctly", () => {
  const { isValidSecret } = require("../src/lib/cache-sync");
  assert.equal(isValidSecret("otuken2026"), true);
  assert.equal(isValidSecret("wrong_secret"), false);
  assert.equal(isValidSecret(null), false);
  assert.equal(isValidSecret(""), false);
});
