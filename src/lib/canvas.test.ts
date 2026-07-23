import assert from "node:assert/strict";
import test from "node:test";
import { expandCanvasNearEdge, shouldRejectDrawingPointer } from "./canvas.ts";

test("canvas expands at the scroll edges", () => {
  assert.deepEqual(
    expandCanvasNearEdge(1200, 720, {
      scrollLeft: 178,
      scrollTop: 274,
      clientWidth: 1022,
      clientHeight: 446,
      scrollWidth: 1200,
      scrollHeight: 720,
    }),
    { width: 2000, height: 1200 },
  );
});

test("pencil input rejects palms and touch after Pencil is detected", () => {
  assert.equal(
    shouldRejectDrawingPointer({ pointerType: "touch", width: 44, height: 38 }, false, false),
    true,
  );
  assert.equal(
    shouldRejectDrawingPointer({ pointerType: "touch", width: 1, height: 1 }, false, true),
    true,
  );
  assert.equal(
    shouldRejectDrawingPointer({ pointerType: "pen", width: 1, height: 1 }, true, false),
    false,
  );
});
