export type Point = { x: number; y: number; pressure: number };
export type Stroke = { points: Point[]; width: number; color: string };
export type Drawing = { width: number; height: number; strokes: Stroke[] };

export type Paste = {
  id: string;
  title: string;
  content: string;
  language: string;
  drawing: Drawing | null;
  created_at: string;
  expires_at: string | null;
};

export type CreatePasteResponse = Paste & { delete_token: string };
