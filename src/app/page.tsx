import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/icons";
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

const FEATURES = [
  { label: "Planificación por tareas", className: "bg-accent-soft text-on-accent-soft" },
  { label: "Código Next.js y TypeScript", className: "bg-violet-soft text-violet" },
  { label: "Compilación y pruebas reales", className: "bg-rose-soft text-rose" },
  { label: "Respaldo si falla un modelo", className: "bg-peach-soft text-peach" },
];

const TILES: { icon: IconName; className: string; delay: string }[] = [
  { icon: "route", className: "left-[4%] top-10", delay: "0s" },
  { icon: "code", className: "left-[15%] top-40", delay: "1.2s" },
  { icon: "flask", className: "right-[15%] top-40", delay: "2.1s" },
  { icon: "shield", className: "right-[4%] top-8", delay: "0.7s" },
];

async function RunAccess() {
  if (await isAuthenticated()) return <NewRunForm />;

  return (
    <section aria-labelledby="access-title">
      <h2 id="access-title" className="text-2xl font-medium tracking-tight">
        Acceso para lanzar agentes
      </h2>
      <p className="mt-2 text-muted">
        Puedes ver las ejecuciones sin cuenta. Para crear una nueva, usa el usuario de prueba.
      </p>
      <Link href="/login" className="btn btn-primary mt-5">
        Iniciar sesión
        <Icon name="arrow" className="size-4" />
      </Link>
    </section>
  );
}

async function RecentRuns() {
  await connection();
  const runs = await listRuns();

  if (runs.length === 0) {
    return <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-muted">Todavía no hay ejecuciones.</p>;
  }

  return (
    <ul className="mt-4 max-h-[26rem] space-y-2.5 overflow-y-auto" tabIndex={0} aria-label="Lista de ejecuciones">
      {runs.map((run) => (
        <li key={run.id}>
          <Link
            href={`/runs/${run.id}`}
            className="block rounded-2xl bg-surface-muted p-3.5 transition-colors hover:bg-accent-soft"
          >
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
    <div className="space-y-10">
      <div className="relative py-6 text-center lg:py-10">
        <div aria-hidden="true" className="hidden lg:block">
          {TILES.map((tile) => (
            <span key={tile.icon} className={`tile absolute ${tile.className}`} style={{ animationDelay: tile.delay }}>
              <Icon name={tile.icon} className="size-6" />
            </span>
          ))}
        </div>
        <p className="glass inline-flex items-center gap-2 !rounded-full px-4 py-1.5 text-sm font-medium">
          <Icon name="spark" className="size-4 text-accent" />
          Next.js, TypeScript y tres modelos de IA
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-normal tracking-tight text-balance sm:text-6xl">
          Tu equipo de agentes de IA<span className="text-accent">.</span>
        </h1>
        <p className="mt-4 text-lg text-muted sm:text-xl">Una petición. Tres agentes. Un resultado probado.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
        <div className="glass grid gap-8 p-5 sm:p-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Suspense fallback={<p className="text-muted">Comprobando el acceso…</p>}>
            <RunAccess />
          </Suspense>

          <section aria-labelledby="team-title">
            <h2 id="team-title" className="text-xl font-medium tracking-tight">
              El equipo
            </h2>
            <ol className="mt-4 space-y-3">
              {AGENTS.map((agent, index) => {
                const info = AGENT_INFO[agent];
                return (
                  <li key={agent} className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface font-mono text-sm font-medium shadow-sm">
                      0{index + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl border border-border bg-surface p-3">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${info.avatar}`}>
                        <Icon name={info.icon} className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-medium">
                          {info.name}{" "}
                          <span className="whitespace-nowrap text-sm font-normal text-muted">· {info.provider}</span>
                        </h3>
                        <p className="text-sm text-muted">{info.role}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <div className="rounded-[2rem] bg-device p-3 shadow-xl sm:p-4">
          <section aria-labelledby="recent-title" className="h-full rounded-[1.5rem] bg-surface p-4 sm:p-5">
            <h2 id="recent-title" className="text-xl font-medium tracking-tight">
              Ejecuciones recientes
            </h2>
            <Suspense fallback={<p className="mt-4 text-muted">Cargando ejecuciones…</p>}>
              <RecentRuns />
            </Suspense>
          </section>
        </div>
      </div>

      <ul className="flex flex-wrap justify-center gap-3" aria-label="Características">
        {FEATURES.map((feature) => (
          <li key={feature.label} className={`rounded-full px-4 py-2 text-sm font-medium ${feature.className}`}>
            {feature.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
