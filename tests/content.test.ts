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
  assert.equal(plainText("<p>خىتاي &#8211; رۇسىيە</p>"), "خىتاي – رۇسىيە");
  assert.equal(localPath("https://orhunpolicycenter.com/uy/category/test/"), "/uy/category/test/");
  assert.equal(localPath("https://orhunpolicycenter.com/ug/"), "https://orhunpolicycenter.com/ug/");
  assert.equal(localPath("https://example.com/source"), "https://example.com/source");
  assert.equal(localPath("#footnote-1"), "#footnote-1");
});
