import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function Header({ back = false }: { back?: boolean }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-rule">
      <Link className="focus-ring flex items-baseline gap-2 rounded" href="/">
        <span className="font-mono text-[1.05rem] font-medium tracking-[-0.03em]">md</span>
        <span className="font-mono text-[0.68rem] text-dim">jooo.sh</span>
      </Link>
      {back ? (
        <Link
          className="focus-ring flex items-center gap-2 rounded font-mono text-[0.72rem] text-muted transition-colors hover:text-ink"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          new paste
        </Link>
      ) : (
        <a
        className="focus-ring flex items-center gap-2 rounded font-mono text-[0.72rem] text-muted transition-colors hover:text-ink"
        href="https://jooo.sh"
      >
          jooo.sh
        </a>
      )}
    </header>
  );
}
