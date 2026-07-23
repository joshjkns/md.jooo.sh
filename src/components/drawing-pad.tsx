"use client";

import { useRef, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { strokePath } from "@/lib/drawing";
import type { Drawing, Point, Stroke } from "@/lib/types";

const VIEW_WIDTH = 1200;
const VIEW_HEIGHT = 720;

type Props = {
  drawing: Drawing;
  onChange: (drawing: Drawing) => void;
  readOnly?: boolean;
};

export function DrawingPad({ drawing, onChange, readOnly = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeRef = useRef<number | null>(null);
  const [draft, setDraft] = useState<Stroke | null>(null);

  function pointFromEvent(event: React.PointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    };
  }

  function begin(event: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || event.button > 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeRef.current = event.pointerId;
    const first = pointFromEvent(event);
    setDraft({
      color: "#f4f4f4",
      width: event.pointerType === "pen" ? 1.5 + first.pressure * 3.5 : 3,
      points: [first],
    });
  }

  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (activeRef.current !== event.pointerId) return;
    const next = pointFromEvent(event);
    setDraft((stroke) => (stroke ? { ...stroke, points: [...stroke.points, next] } : stroke));
  }

  function finish(event: React.PointerEvent<SVGSVGElement>) {
    if (activeRef.current !== event.pointerId) return;
    activeRef.current = null;
    setDraft((stroke) => {
      if (stroke) onChange({ ...drawing, strokes: [...drawing.strokes, stroke] });
      return null;
    });
  }

  const strokes = draft ? [...drawing.strokes, draft] : drawing.strokes;

  return (
    <div className="border border-white/[0.1] bg-white/[0.018]">
      {!readOnly && (
        <div className="flex h-11 items-center justify-end gap-1 border-b border-rule px-2">
          <button
            aria-label="Undo last stroke"
            className="focus-ring rounded p-2 text-dim transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
            disabled={!drawing.strokes.length}
            onClick={() => onChange({ ...drawing, strokes: drawing.strokes.slice(0, -1) })}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            aria-label="Clear drawing"
            className="focus-ring rounded p-2 text-dim transition-colors hover:text-ink disabled:cursor-default disabled:opacity-30"
            disabled={!drawing.strokes.length}
            onClick={() => onChange({ ...drawing, strokes: [] })}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
      <svg
        aria-label={readOnly ? "Paste drawing" : "Drawing canvas"}
        className="drawing-canvas block aspect-[5/3] w-full"
        onPointerCancel={finish}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={finish}
        ref={svgRef}
        role="img"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        <rect fill="#080808" height={VIEW_HEIGHT} width={VIEW_WIDTH} />
        {strokes.map((stroke, index) => (
          <path
            d={strokePath(stroke.points)}
            fill="none"
            key={index}
            stroke={stroke.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={stroke.width}
          />
        ))}
      </svg>
    </div>
  );
}
