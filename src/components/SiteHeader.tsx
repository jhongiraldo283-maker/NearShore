import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image
            src="/nearshore_business_solutions_logo-removebg-preview.png"
            alt="Nearshore Business Solutions"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="brand-gradient-text">Nearshore</span>
          <span className="font-normal text-slate-400">Recruiting</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link href="/recruiter" className="transition hover:text-primary">
            Reclutador
          </Link>
        </nav>
      </div>
    </header>
  );
}
