import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:gap-2 hover:text-slate-900"
    >
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
