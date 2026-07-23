"use client";

import { useEffect, useState } from "react";
import { Check, Copy, LoaderCircle, Trash2 } from "lucide-react";
import { deletePaste, getPaste } from "@/lib/api";
import type { Paste } from "@/lib/types";
import { DrawingPad } from "./drawing-pad";

export function PasteViewer({ id }: { id: string }) {
  const [paste, setPaste] = useState<Paste | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteToken, setDeleteToken] = useState("");

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
      <div className="flex flex-wrap items-center gap-3 border-b border-rule pb-4">
        <span className="font-mono text-[0.72rem] text-muted">{paste.language}</span>
        <span className="font-mono text-[0.68rem] text-dim">
          {new Date(paste.created_at).toLocaleString()}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {!!paste.content && (
            <button
              className="focus-ring flex items-center gap-2 rounded p-2 font-mono text-[0.7rem] text-muted transition-colors hover:text-ink"
              onClick={copy}
              type="button"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "copied" : "copy"}
            </button>
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
        <pre className="overflow-x-auto whitespace-pre-wrap break-words py-7 font-mono text-[0.88rem] leading-7 text-ink">
          {paste.content}
        </pre>
      )}
      {paste.drawing && (
        <div className={paste.content ? "border-t border-rule pt-7" : "pt-7"}>
          <DrawingPad drawing={paste.drawing} onChange={() => undefined} readOnly />
        </div>
      )}
    </article>
  );
}
