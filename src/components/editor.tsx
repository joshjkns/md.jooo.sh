"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Bold,
  Braces,
  Code,
  Heading,
  Italic,
  Link,
  List,
  LoaderCircle,
  MessageSquareQuote,
  Pencil,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createPaste } from "@/lib/api";
import { insertMarkdown } from "@/lib/markdown";
import type { Drawing } from "@/lib/types";
import { DrawingPad } from "./drawing-pad";
import { MarkdownContent } from "./markdown-content";

const emptyDrawing: Drawing = { width: 1200, height: 720, strokes: [] };

type FormattingAction = {
  label: string;
  icon: LucideIcon;
  prefix: string;
  suffix?: string;
  placeholder: string;
};

const formatting: FormattingAction[] = [
  { label: "Heading", icon: Heading, prefix: "## ", placeholder: "Heading" },
  { label: "Bold", icon: Bold, prefix: "**", suffix: "**", placeholder: "bold text" },
  { label: "Italic", icon: Italic, prefix: "_", suffix: "_", placeholder: "italic text" },
  { label: "Link", icon: Link, prefix: "[", suffix: "](https://)", placeholder: "link text" },
  { label: "Inline code", icon: Code, prefix: "`", suffix: "`", placeholder: "code" },
  { label: "Code block", icon: Braces, prefix: "```\n", suffix: "\n```", placeholder: "code" },
  { label: "Quote", icon: MessageSquareQuote, prefix: "> ", placeholder: "Quote" },
  { label: "List", icon: List, prefix: "- ", placeholder: "List item" },
];

export function Editor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("markdown");
  const [expiresIn, setExpiresIn] = useState("7d");
  const [drawing, setDrawing] = useState<Drawing>(emptyDrawing);
  const [showDrawing, setShowDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function format(prefix: string, suffix = "", placeholder = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const edit = insertMarkdown(
      content,
      textarea.selectionStart,
      textarea.selectionEnd,
      prefix,
      suffix,
      placeholder,
    );
    setContent(edit.content);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  }

  async function save() {
    if (!content.trim() && drawing.strokes.length === 0) {
      setError("Write or draw something first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const paste = await createPaste({
        title,
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
      <div className="border-b border-rule">
        <label className="sr-only" htmlFor="title">Paste title</label>
        <input
          className="focus-ring my-5 w-full rounded bg-transparent text-[1.3rem] font-medium tracking-[-0.025em] outline-none placeholder:text-dim"
          id="title"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled paste"
          value={title}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-rule py-4">
        <span className="font-mono text-[0.7rem] text-dim">Options</span>
        <div className="flex items-center gap-4">
          <label className="sr-only" htmlFor="language">Format</label>
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
        <span className="ml-auto font-mono text-[0.68rem] text-dim">
          {content.length.toLocaleString()} / 100,000
        </span>
      </div>

      {language === "markdown" && (
        <div aria-label="Markdown formatting" className="flex min-h-11 flex-wrap items-center gap-1 border-b border-rule py-1.5">
          {formatting.map(({ label, icon: Icon, prefix, suffix, placeholder }) => (
            <button
              aria-label={label}
              className="focus-ring rounded p-2 text-dim transition-colors hover:bg-white/[0.04] hover:text-ink"
              key={label}
              onClick={() => format(prefix, suffix, placeholder)}
              title={label}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      <div className="grid border-b border-rule md:grid-cols-2">
        <div className="py-6 md:pr-7">
          <p className="mb-3 font-mono text-[0.68rem] text-dim">Write</p>
          <textarea
            aria-label="Paste content"
            autoCapitalize="off"
            autoCorrect="off"
            className="editor-textarea focus-ring block w-full rounded bg-transparent font-mono text-[0.86rem] leading-7 text-ink outline-none placeholder:text-dim"
            maxLength={100_000}
            onChange={(event) => setContent(event.target.value)}
            placeholder={language === "markdown" ? "Write Markdown here…" : "Write or paste here…"}
            ref={textareaRef}
            spellCheck={language === "markdown" || language === "text"}
            value={content}
          />
        </div>
        <div className="border-t border-rule py-6 md:border-l md:border-t-0 md:pl-7">
          <p className="mb-3 font-mono text-[0.68rem] text-dim">Preview</p>
          {language === "markdown" ? (
            <MarkdownContent content={content} />
          ) : content ? (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[0.86rem] leading-7 text-ink">
              {content}
            </pre>
          ) : (
            <p className="font-mono text-[0.8rem] text-dim">Preview appears here.</p>
          )}
        </div>
      </div>

      <section className="border-b border-rule py-6" aria-labelledby="drawing-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-[0.74rem] font-normal text-muted" id="drawing-heading">
              Drawing
            </h2>
            <p className="mt-1 font-mono text-[0.66rem] text-dim">Optional · saved with the text</p>
          </div>
          <button
            className="focus-ring flex items-center gap-2 rounded border border-white/[0.1] px-3 py-2 font-mono text-[0.7rem] text-muted transition-colors hover:border-white/[0.2] hover:text-ink"
            onClick={() => setShowDrawing((visible) => !visible)}
            type="button"
          >
            {showDrawing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {showDrawing ? "hide canvas" : "add drawing"}
          </button>
        </div>
        {showDrawing && (
          <div className="mt-5">
            <DrawingPad drawing={drawing} onChange={setDrawing} />
            <p className="mt-3 font-mono text-[0.68rem] text-dim">
              Apple Pencil, stylus, mouse, or touch.
            </p>
          </div>
        )}
      </section>

      <footer className="flex items-center justify-between gap-4 py-5">
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
