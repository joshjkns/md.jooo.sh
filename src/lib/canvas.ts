export const MIN_CANVAS_WIDTH = 1200;
export const MIN_CANVAS_HEIGHT = 720;
export const MAX_CANVAS_WIDTH = 12000;
export const MAX_CANVAS_HEIGHT = 7200;

const GROW_WIDTH = 800;
const GROW_HEIGHT = 480;
const EDGE_THRESHOLD = 140;

export function shouldRejectDrawingPointer(
  pointer: { pointerType: string; width: number; height: number },
  pencilOnly: boolean,
  pencilSeen: boolean,
): boolean {
  const isPencil = pointer.pointerType === "pen";
  const isTouch = pointer.pointerType === "touch";
  const looksLikePalm = isTouch && (pointer.width > 24 || pointer.height > 24);
  return (isTouch && (pencilOnly || pencilSeen || looksLikePalm)) || (pencilOnly && !isPencil);
}

export function expandCanvasNearEdge(
  width: number,
  height: number,
  viewport: {
    scrollLeft: number;
    scrollTop: number;
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
  },
): { width: number; height: number } {
  const growWidth =
    viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - EDGE_THRESHOLD &&
    width < MAX_CANVAS_WIDTH;
  const growHeight =
    viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - EDGE_THRESHOLD &&
    height < MAX_CANVAS_HEIGHT;
  return {
    width: growWidth ? Math.min(MAX_CANVAS_WIDTH, width + GROW_WIDTH) : width,
    height: growHeight ? Math.min(MAX_CANVAS_HEIGHT, height + GROW_HEIGHT) : height,
  };
}
