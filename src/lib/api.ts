import type { CreatePasteResponse, Drawing, Paste } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://api.md.jooo.sh";

export async function createPaste(input: {
  title: string;
  content: string;
  language: string;
  drawing: Drawing | null;
  expiresIn: string;
}): Promise<CreatePasteResponse> {
  const response = await fetch(`${API_URL}/pastes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as CreatePasteResponse | { error: string };
  if (!response.ok) throw new Error("error" in body ? body.error : "Could not save paste");
  return body as CreatePasteResponse;
}

export async function getPaste(id: string): Promise<Paste> {
  const response = await fetch(`${API_URL}/pastes/${encodeURIComponent(id)}`);
  const body = (await response.json()) as Paste | { error: string };
  if (!response.ok) throw new Error("error" in body ? body.error : "Could not load paste");
  return body as Paste;
}

export async function deletePaste(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/pastes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Could not delete paste");
  }
}
