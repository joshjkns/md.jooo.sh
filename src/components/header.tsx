import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function Header({ back = false }: { back?: boolean }) {
  return (
    <header className="flex items-center justify-between border-b border-rule pb-5">
      <Link
        className="flex items-baseline gap-2 transition-colors duration-150 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        href="/"
      >
        <span className="font-mono text-[1.2rem] font-semibold tracking-[-0.035em] text-white">md</span>
        <span className="font-mono text-[0.68rem] font-normal text-dim">jooo.sh</span>
      </Link>
      {back ? (
        <Link
          className="flex items-center gap-2 font-mono text-[0.72rem] text-muted transition-colors duration-150 hover:text-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          new paste
        </Link>
      ) : (
        <a
          className="flex items-center gap-2 font-mono text-[0.72rem] text-muted transition-colors duration-150 hover:text-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          href="https://jooo.sh"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          jooo.sh
        </a>
      )}
    </header>
  );
}
