import type { Point, Stroke } from "./types";

export function strokePath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} L ${point.x + 0.01} ${point.y}`;
  }
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const x = (previous.x + point.x) / 2;
    const y = (previous.y + point.y) / 2;
    return `${path} Q ${previous.x} ${previous.y} ${x} ${y}`;
  }, "");
}

export function averagePressure(stroke: Stroke): number {
  if (!stroke.points.length) return 0.5;
  return stroke.points.reduce((sum, point) => sum + point.pressure, 0) / stroke.points.length;
}
