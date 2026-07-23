"use client";

import { useRef, useState } from "react";
import { Hand, Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  expandCanvasNearEdge,
  MIN_CANVAS_HEIGHT,
  MIN_CANVAS_WIDTH,
  shouldRejectDrawingPointer,
} from "@/lib/canvas";
import { strokePath } from "@/lib/drawing";
import type { Drawing, Point, Stroke } from "@/lib/types";

type Tool = "draw" | "pan";

type ActivePointer =
  | { id: number; kind: "draw" }
  | { id: number; kind: "pan"; x: number; y: number; left: number; top: number };

type Props = {
  drawing: Drawing;
  onChange: (drawing: Drawing) => void;
  readOnly?: boolean;
};

export function DrawingPad({ drawing, onChange, readOnly = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<ActivePointer | null>(null);
  const pencilSeenRef = useRef(false);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<Tool>("draw");
  const [pencilOnly, setPencilOnly] = useState(false);
  const [pencilSeen, setPencilSeen] = useState(false);

  const width = Math.max(MIN_CANVAS_WIDTH, drawing.width);
  const height = Math.max(MIN_CANVAS_HEIGHT, drawing.height);

  function pointFromClient(clientX: number, clientY: number, pressure: number): Point {
    const canvas = scrollRef.current?.querySelector("svg");
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(width, clientX - rect.left)),
      y: Math.max(0, Math.min(height, clientY - rect.top)),
      pressure: pressure > 0 ? pressure : 0.5,
    };
  }

  function begin(event: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || event.button > 0) return;

    if (tool === "pan") {
      const scroll = scrollRef.current;
      if (!scroll) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activeRef.current = {
        id: event.pointerId,
        kind: "pan",
        x: event.clientX,
        y: event.clientY,
        left: scroll.scrollLeft,
        top: scroll.scrollTop,
      };
      return;
    }

    const isPencil = event.pointerType === "pen";
    if (shouldRejectDrawingPointer(event, pencilOnly, pencilSeenRef.current)) {
      return;
    }

    if (isPencil && !pencilSeenRef.current) {
      pencilSeenRef.current = true;
      setPencilSeen(true);
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeRef.current = { id: event.pointerId, kind: "draw" };
    const first = pointFromClient(event.clientX, event.clientY, event.pressure);
    setDraft({
      color: "#f4f4f4",
      width: isPencil ? 1.5 + first.pressure * 3.5 : 3,
      points: [first],
    });
  }

  function move(event: React.PointerEvent<SVGSVGElement>) {
    const active = activeRef.current;
    if (!active || active.id !== event.pointerId) return;

    if (active.kind === "pan") {
      const scroll = scrollRef.current;
      if (!scroll) return;
      event.preventDefault();
      scroll.scrollLeft = active.left - (event.clientX - active.x);
      scroll.scrollTop = active.top - (event.clientY - active.y);
      return;
    }

    event.preventDefault();
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    const points = samples.map((sample) =>
      pointFromClient(sample.clientX, sample.clientY, sample.pressure),
    );
    setDraft((stroke) => (stroke ? { ...stroke, points: [...stroke.points, ...points] } : stroke));
  }

  function finish(event: React.PointerEvent<SVGSVGElement>) {
    const active = activeRef.current;
    if (!active || active.id !== event.pointerId) return;
    activeRef.current = null;
    if (active.kind === "draw") {
      setDraft((stroke) => {
        if (stroke) onChange({ ...drawing, width, height, strokes: [...drawing.strokes, stroke] });
        return null;
      });
    }
  }

  function expandNearEdge(event: React.UIEvent<HTMLDivElement>) {
    if (readOnly) return;
    const viewport = event.currentTarget;
    const expanded = expandCanvasNearEdge(width, height, viewport);
    if (expanded.width === width && expanded.height === height) return;
    onChange({
      ...drawing,
      ...expanded,
    });
  }

  const strokes = draft ? [...drawing.strokes, draft] : drawing.strokes;
  const activeTool = readOnly ? "read" : tool;

  return (
    <div className="border border-white/[0.1] bg-white/[0.018]">
      {!readOnly && (
        <div className="flex min-h-11 flex-wrap items-center gap-1 border-b border-rule px-2 py-1">
          <button
            aria-label="Draw"
            aria-pressed={tool === "draw"}
            className="focus-ring rounded p-2 text-dim transition-colors hover:text-ink aria-pressed:bg-white/[0.07] aria-pressed:text-ink"
            onClick={() => setTool("draw")}
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            aria-label="Pan canvas"
            aria-pressed={tool === "pan"}
            className="focus-ring rounded p-2 text-dim transition-colors hover:text-ink aria-pressed:bg-white/[0.07] aria-pressed:text-ink"
            onClick={() => setTool("pan")}
            type="button"
          >
            <Hand className="h-4 w-4" />
          </button>
          <label className="ml-2 flex items-center gap-2 font-mono text-[0.68rem] text-muted">
            <input
              checked={pencilOnly}
              className="accent-white"
              onChange={(event) => setPencilOnly(event.target.checked)}
              type="checkbox"
            />
            Pencil only
          </label>
          {pencilSeen && (
            <span className="font-mono text-[0.65rem] text-dim">Pencil detected · touch ignored</span>
          )}
          <div className="ml-auto flex items-center gap-1">
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
        </div>
      )}
      <div
        aria-label="Drawing canvas viewport"
        className="h-[min(62vh,36rem)] min-h-80 overflow-auto overscroll-contain bg-[#080808]"
        onScroll={expandNearEdge}
        ref={scrollRef}
        role="region"
        tabIndex={0}
      >
        <svg
          aria-label={readOnly ? "Paste drawing" : "Scrollable drawing canvas"}
          className={`drawing-canvas block max-w-none ${
            tool === "pan" && !readOnly ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
          }`}
          data-tool={activeTool}
          height={height}
          onPointerCancel={finish}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={finish}
          role="img"
          style={{ height, width }}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          <defs>
            <pattern height="40" id="canvas-grid" patternUnits="userSpaceOnUse" width="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131313" strokeWidth="1" />
            </pattern>
          </defs>
          <rect fill="#080808" height={height} width={width} />
          <rect fill="url(#canvas-grid)" height={height} width={width} />
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
    </div>
  );
}
