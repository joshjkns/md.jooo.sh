import { Editor } from "@/components/editor";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[68rem] px-5 py-8 sm:px-8 sm:py-10">
      <div className="animate-fade-in motion-reduce:animate-none">
        <Header />
        <section aria-labelledby="editor-heading" className="pt-8">
          <div className="mb-7 flex items-baseline justify-between">
            <h1 className="font-mono text-[0.78rem] font-normal text-muted" id="editor-heading">
              New paste
            </h1>
            <span className="font-mono text-[0.68rem] text-dim">text + pencil</span>
          </div>
          <Editor />
        </section>
      </div>
    </main>
  );
}
