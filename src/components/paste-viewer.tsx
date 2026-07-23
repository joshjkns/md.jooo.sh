"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, LoaderCircle, Trash2 } from "lucide-react";
import { deletePaste, getPaste } from "@/lib/api";
import type { Paste } from "@/lib/types";
import { DrawingPad } from "./drawing-pad";
import { HighlightedCode } from "./highlighted-code";
import { MarkdownContent } from "./markdown-content";

export function PasteViewer({ id }: { id: string }) {
  const [paste, setPaste] = useState<Paste | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteToken, setDeleteToken] = useState("");
  const [view, setView] = useState<"rendered" | "source">("rendered");

  useEffect(() => {
    setDeleteToken(localStorage.getItem(`md-delete-${id}`) ?? "");
    getPaste(id).then(setPaste).catch((cause: Error) => setError(cause.message));
  }, [id]);

  async function copy() {
    if (!paste) return;
    await navigator.clipboard.writeText(paste.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!paste) return;
    const extension = paste.language === "markdown" ? "md" : "txt";
    const filename = (paste.title || paste.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const url = URL.createObjectURL(new Blob([paste.content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename || paste.id}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function remove() {
    if (!deleteToken || !window.confirm("Delete this paste? This cannot be undone.")) return;
    try {
      await deletePaste(id, deleteToken);
      localStorage.removeItem(`md-delete-${id}`);
      window.location.href = "/";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete paste");
    }
  }

  if (error) {
    return <p className="py-20 font-mono text-sm text-muted">{error}</p>;
  }
  if (!paste) {
    return (
      <div className="flex items-center gap-2 py-20 font-mono text-sm text-muted">
        <LoaderCircle className="h-4 w-4 animate-spin" /> loading
      </div>
    );
  }

  return (
    <article className="py-8 sm:py-10">
      {paste.title && (
        <h1 className="mb-6 text-[clamp(1.55rem,4vw,2.35rem)] font-semibold leading-tight tracking-[-0.035em]">
          {paste.title}
        </h1>
      )}
      <div className="flex flex-wrap items-center gap-3 border-b border-rule pb-4">
        {paste.language === "markdown" ? (
          <div className="flex items-center gap-4">
            {(["rendered", "source"] as const).map((item) => (
              <button
                className={`focus-ring rounded pb-0.5 font-mono text-[0.72rem] transition-colors ${
                  view === item ? "border-b border-ink text-ink" : "text-dim hover:text-muted"
                }`}
                key={item}
                onClick={() => setView(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <span className="font-mono text-[0.72rem] text-muted">{paste.language}</span>
        )}
        <span className="font-mono text-[0.68rem] text-dim">
          {new Date(paste.created_at).toLocaleString()}
        </span>
        {paste.expires_at && (
          <span className="font-mono text-[0.68rem] text-dim">
            expires {new Date(paste.expires_at).toLocaleDateString()}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!!paste.content && (
            <>
              <button
                className="focus-ring flex items-center gap-2 rounded p-2 font-mono text-[0.7rem] text-muted transition-colors hover:text-ink"
                onClick={copy}
                type="button"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "copied" : "copy"}
              </button>
              <button
                aria-label="Download source"
                className="focus-ring rounded p-2 text-dim transition-colors hover:text-ink"
                onClick={download}
                title="Download source"
                type="button"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {deleteToken && (
            <button
              className="focus-ring rounded p-2 text-dim transition-colors hover:text-red-300"
              onClick={remove}
              title="Delete paste"
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {!!paste.content && (
        <div className="py-7">
          {paste.language === "markdown" && view === "rendered" ? (
            <MarkdownContent content={paste.content} />
          ) : (
            <HighlightedCode code={paste.content} language={paste.language} />
          )}
        </div>
      )}
      {paste.drawing && (
        <section className={paste.content ? "border-t border-rule pt-7" : "pt-7"} aria-label="Drawing">
          <DrawingPad drawing={paste.drawing} onChange={() => undefined} readOnly />
        </section>
      )}
    </article>
  );
}
