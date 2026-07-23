"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createPaste } from "@/lib/api";
import type { Drawing } from "@/lib/types";

const emptyDrawing: Drawing = { width: 1200, height: 720, strokes: [] };

export function Editor() {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("markdown");
  const [expiresIn, setExpiresIn] = useState("7d");
  const [drawing, setDrawing] = useState<Drawing>(emptyDrawing);
  const [mode, setMode] = useState<"write" | "draw">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!content.trim() && drawing.strokes.length === 0) {
      setError("Write or draw something first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const paste = await createPaste({
        content,
        language,
        drawing: drawing.strokes.length ? drawing : null,
        expiresIn,
      });
      localStorage.setItem(`md-delete-${paste.id}`, paste.delete_token);
      window.location.href = `/paste?id=${encodeURIComponent(paste.id)}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save paste");
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-rule py-4">
        <div className="flex items-center gap-4">
          {(["write", "draw"] as const).map((item) => (
            <button
              className={`focus-ring rounded pb-0.5 font-mono text-[0.76rem] transition-colors ${
                mode === item ? "border-b border-ink text-ink" : "text-dim hover:text-muted"
              }`}
              key={item}
              onClick={() => setMode(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="sr-only" htmlFor="language">Language</label>
          <select
            className="focus-ring bg-transparent font-mono text-[0.72rem] text-muted"
            id="language"
            onChange={(event) => setLanguage(event.target.value)}
            value={language}
          >
            <option value="markdown">markdown</option>
            <option value="text">plain text</option>
            <option value="javascript">javascript</option>
            <option value="typescript">typescript</option>
            <option value="python">python</option>
            <option value="shell">shell</option>
            <option value="json">json</option>
          </select>
          <label className="sr-only" htmlFor="expiry">Expiry</label>
          <select
            className="focus-ring bg-transparent font-mono text-[0.72rem] text-muted"
            id="expiry"
            onChange={(event) => setExpiresIn(event.target.value)}
            value={expiresIn}
          >
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="never">never</option>
          </select>
        </div>
      </div>

      <div className="py-6">
        {mode === "write" ? (
          <textarea
            aria-label="Paste content"
            autoCapitalize="off"
            autoCorrect="off"
            className="editor-textarea focus-ring block w-full rounded bg-transparent font-mono text-[0.88rem] leading-7 text-ink outline-none placeholder:text-dim"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write or paste here…"
            spellCheck={language === "markdown" || language === "text"}
            value={content}
          />
        ) : (
          <>
            <DrawingPad drawing={drawing} onChange={setDrawing} />
            <p className="mt-3 font-mono text-[0.68rem] text-dim">
              Apple Pencil, stylus, mouse, or touch.
            </p>
          </>
        )}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-rule py-5">
        <p aria-live="polite" className="font-mono text-[0.7rem] text-red-300">
          {error}
        </p>
        <button
          className="focus-ring ml-auto flex items-center gap-2 rounded-md bg-ink px-3.5 py-2 font-mono text-[0.74rem] font-medium text-paper transition-colors hover:bg-white disabled:opacity-50"
          disabled={saving}
          onClick={save}
          type="button"
        >
          {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          {saving ? "saving" : "create paste"}
        </button>
      </footer>
    </>
  );
}

import { DrawingPad } from "./drawing-pad";
