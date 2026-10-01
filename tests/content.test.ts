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
  assert.equal(localPath("https://orhunpolicycenter.com/uy/wp-content/uploads/report.pdf"), "https://orhunpolicycenter.com/uy/wp-content/uploads/report.pdf");
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
