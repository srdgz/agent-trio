import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { NewRunForm } from "@/components/new-run-form";
import { StatusBadge } from "@/components/status-badge";
import { AGENT_INFO, RUN_STATUS_INFO } from "@/domain/labels";
import { AGENTS } from "@/domain/types";
import { listRuns } from "@/engine/repository";
import { isAuthenticated } from "@/lib/auth";

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

async function RunAccess() {
  if (await isAuthenticated()) return <NewRunForm />;

  return (
    <section aria-labelledby="access-title" className="card p-4 sm:p-6">
      <h2 id="access-title" className="text-lg font-semibold">
        Acceso para lanzar agentes
      </h2>
      <p className="mt-1 text-muted">
        Puedes ver las ejecuciones sin cuenta. Para crear una nueva, usa el usuario de prueba.
      </p>
      <Link href="/login" className="btn btn-primary mt-4">
        Iniciar sesión
      </Link>
    </section>
  );
}

async function RecentRuns() {
  await connection();
  const runs = await listRuns();

  if (runs.length === 0) {
    return <p className="card mt-3 p-4 text-muted">Todavía no hay ejecuciones.</p>;
  }

  return (
    <ul className="mt-3 space-y-3">
      {runs.map((run) => (
        <li key={run.id}>
          <Link href={`/runs/${run.id}`} className="card block p-4 transition-colors hover:border-control">
            <span className="block font-medium">{run.request}</span>
            <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <time dateTime={run.createdAt.toISOString()}>{dateFormat.format(run.createdAt)}</time>
              <StatusBadge {...RUN_STATUS_INFO[run.status]} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Tres agentes de IA que planifican, desarrollan y prueban
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Pide un cambio y sigue en directo qué hace cada agente hasta que todas las pruebas pasan.
          </p>
        </div>

        <Suspense fallback={<p className="card p-6 text-muted">Comprobando el acceso…</p>}>
          <RunAccess />
        </Suspense>

        <section aria-labelledby="team-title">
          <h2 id="team-title" className="text-xl font-semibold">
            El equipo
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {AGENTS.map((agent, index) => (
              <li key={agent} className="card p-4">
                <p className="text-sm font-medium text-muted">
                  Paso {index + 1} · {AGENT_INFO[agent].provider}
                </p>
                <h3 className="mt-1 font-semibold">{AGENT_INFO[agent].name}</h3>
                <p className="mt-1 text-sm text-muted">{AGENT_INFO[agent].role}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted">
            Si un proveedor falla o agota su cuota, Mistral continúa el trabajo.
          </p>
        </section>
      </div>

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="text-xl font-semibold">
          Ejecuciones recientes
        </h2>
        <Suspense fallback={<p className="card mt-3 p-4 text-muted">Cargando ejecuciones…</p>}>
          <RecentRuns />
        </Suspense>
      </section>
    </div>
  );
}
