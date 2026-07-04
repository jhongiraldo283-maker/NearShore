import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-surface">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
        <Link href="/recruiter" className="flex items-center gap-2 text-lg font-bold tracking-tight">
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
      </div>
      <div className="brand-bar" />
    </header>
  );
}
