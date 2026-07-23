import assert from "node:assert/strict";
import test from "node:test";
import { averagePressure, strokePath } from "./drawing.ts";

test("strokePath handles empty and multi-point strokes", () => {
  assert.equal(strokePath([]), "");
  assert.match(
    strokePath([
      { x: 0, y: 0, pressure: 0.5 },
      { x: 10, y: 10, pressure: 0.5 },
    ]),
    /^M 0 0 Q/,
  );
});

test("averagePressure returns the stroke average", () => {
  assert.equal(
    averagePressure({
      width: 3,
      color: "#fff",
      points: [
        { x: 0, y: 0, pressure: 0.2 },
        { x: 1, y: 1, pressure: 0.8 },
      ],
    }),
    0.5,
  );
});
