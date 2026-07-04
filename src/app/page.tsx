import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Nearshore Business Solutions</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Plataforma de reclutamiento</h1>
      <p className="mt-4 text-slate-600">
        Publica vacantes, recibe aplicaciones por un link único, deja que la IA puntúe cada
        candidato y decide tú mismo a quién invitar a agendar una llamada.
      </p>
      <Link
        href="/recruiter"
        className="mt-8 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Entrar como reclutador
      </Link>
    </div>
  );
}
