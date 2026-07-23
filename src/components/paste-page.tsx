"use client";

import { useSearchParams } from "next/navigation";
import { PasteViewer } from "./paste-viewer";

export function PastePage() {
  const params = useSearchParams();
  const id = params.get("id");
  if (!id) return <p className="py-20 font-mono text-sm text-muted">Missing paste id.</p>;
  return <PasteViewer id={id} />;
}
