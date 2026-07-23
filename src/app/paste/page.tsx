import { Suspense } from "react";
import { Header } from "@/components/header";
import { PastePage } from "@/components/paste-page";

export default function ViewPaste() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[68rem] px-5 sm:px-8">
      <Header back />
      <Suspense fallback={<p className="py-20 font-mono text-sm text-muted">loading</p>}>
        <PastePage />
      </Suspense>
    </main>
  );
}
