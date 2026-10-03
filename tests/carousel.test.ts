import test from "node:test";
import assert from "node:assert/strict";
import { cardStops, nearestStop } from "../src/lib/carousel";

test("three visible cards still advance through overlapping one-card positions", () => {
  const positions = cardStops(Array.from({ length: 6 }, (_, i) => i * 320), 960);
  assert.deepEqual(positions, [0, 320, 640, 960]);
  assert.equal(nearestStop(positions, 320), 1);
});

test("mobile positions use the real 14px gap and clamp the final partial card", () => {
  const width = 307.5;
  const gap = 14;
  const viewport = 375;
  const max = width * 4 + gap * 3 - viewport;
  assert.deepEqual(cardStops([0, width + gap, 2 * (width + gap), 3 * (width + gap)], max), [0, 321.5, 643, 897]);
});

test("a fully visible row has no extra navigation stops", () => {
  assert.deepEqual(cardStops([0, 320, 640], 0), [0]);
});
