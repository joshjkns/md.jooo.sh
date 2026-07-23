import { Suspense } from "react";
import { Header } from "@/components/header";
import { PastePage } from "@/components/paste-page";

export default function ViewPaste() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[68rem] px-5 py-8 sm:px-8 sm:py-10">
      <div className="animate-fade-in motion-reduce:animate-none">
        <Header back />
        <Suspense fallback={<p className="py-20 font-mono text-sm text-muted">loading</p>}>
          <PastePage />
        </Suspense>
      </div>
    </main>
  );
}
