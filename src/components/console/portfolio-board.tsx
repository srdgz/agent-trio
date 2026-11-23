"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { isActiveStage } from "@/domain/activity";
import { AGENT_INFO, STAGE_INFO } from "@/domain/labels";
import type { ProjectRow } from "@/domain/types";
import { ActivityFeed } from "./activity-feed";
import { useEngine } from "./engine-provider";
import { LaunchForm } from "./launch-form";
import { Pipeline } from "./pipeline";

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "En ejecución" },
  { value: "failed", label: "Bloqueados" },
  { value: "completed", label: "Entregados" },
  { value: "idle", label: "Sin actividad" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function matchesFilter(project: ProjectRow, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "active") return isActiveStage(project.stage);
  return project.stage === filter;
}

function detailText(project: ProjectRow) {
  if (project.activeAgent && project.currentTask) {
    return `${AGENT_INFO[project.activeAgent].name}: ${project.currentTask}`;
  }
  return project.request ?? "Listo para recibir una petición.";
}

function ProjectCard({
  project,
  selected,
  onToggle,
}: {
  project: ProjectRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const active = isActiveStage(project.stage);
  const checkboxId = `select-${project.id}`;

  return (
    <li className={`card flex flex-col gap-3 p-3 ${active ? "border-accent" : ""}`}>
      <div className="flex items-start gap-1">
        <label htmlFor={checkboxId} className="-ml-1 grid size-8 shrink-0 cursor-pointer place-items-center">
          <input
            id={checkboxId}
            type="checkbox"
            checked={selected}
            disabled={active}
            onChange={onToggle}
            aria-label={`Seleccionar ${project.name}`}
            className="size-4 accent-[var(--accent)]"
          />
        </label>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <Link href={`/projects/${project.id}`} className="inline-flex min-h-6 items-center underline-offset-2 hover:underline">
              {project.name}
            </Link>
          </h3>
          <p className="text-sm text-muted">
            {project.clientName} · {project.sector}
          </p>
        </div>
        <StatusBadge {...STAGE_INFO[project.stage]} />
      </div>
      <Pipeline stage={project.stage} />
      <p className="min-h-10 text-sm">{detailText(project)}</p>
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-muted">
        <div className="flex gap-1">
          <dt>Tareas</dt>
          <dd className="font-mono font-semibold text-foreground">
            {project.tasksDone}/{project.tasksTotal}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>Archivos</dt>
          <dd className="font-mono font-semibold text-foreground">{project.filesChanged}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Tipo</dt>
          <dd className="font-semibold text-foreground">{project.kind}</dd>
        </div>
      </dl>
    </li>
  );
}

export function PortfolioBoard() {
  const { portfolio } = useEngine();
  const { stats, projects, feed } = portfolio;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selection, setSelection] = useState<string[]>([]);

  const selectable = useMemo(
    () => new Set(projects.filter((project) => !isActiveStage(project.stage)).map((project) => project.id)),
    [projects],
  );
  const selected = selection.filter((id) => selectable.has(id));
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return projects.filter(
      (project) =>
        matchesFilter(project, filter) &&
        `${project.name} ${project.clientName} ${project.kind}`.toLocaleLowerCase("es").includes(term),
    );
  }, [projects, query, filter]);

  function toggle(id: string) {
    setSelection((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const metrics = [
    { label: "Clientes", value: stats.clients },
    { label: "En ejecución", value: stats.executing },
    { label: "En cola", value: stats.queued },
    { label: "Bloqueados", value: stats.failed },
    { label: "Entregas hoy", value: stats.completedToday },
    { label: "Ejecuciones hoy", value: `${stats.runsToday}/${stats.maxRunsPerDay}` },
    { label: "Tokens hoy", value: stats.tokensToday.toLocaleString("es-ES") },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Proyectos</h1>

      <dl className="card grid grid-cols-2 divide-border sm:grid-cols-4 xl:grid-cols-7">
        {metrics.map((metric) => (
          <div key={metric.label} className="px-3 py-2">
            <dt className="text-xs text-muted">{metric.label}</dt>
            <dd className="font-mono text-lg font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Lanzar agentes" className="card p-3">
        <LaunchForm
          projectIds={selected}
          label={
            selected.length > 0
              ? `Nueva petición para ${selected.length} ${selected.length === 1 ? "proyecto" : "proyectos"}`
              : "Nueva petición"
          }
          hint={`Se ejecutan hasta ${stats.maxParallel} proyectos en paralelo y el resto espera en cola.`}
          disabledReason={selected.length === 0 ? "Selecciona uno o varios proyectos del tablero." : null}
          onLaunched={() => setSelection([])}
        />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="board-title" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="board-title" className="section-title">
              Tablero ({visible.length})
            </h2>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <div className="min-w-40 flex-1">
                <label htmlFor="project-search" className="text-xs text-muted">
                  Buscar
                </label>
                <input
                  id="project-search"
                  type="search"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="field"
                />
              </div>
              <div className="min-w-40 flex-1">
                <label htmlFor="project-filter" className="text-xs text-muted">
                  Estado
                </label>
                <select
                  id="project-filter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as Filter)}
                  className="field"
                >
                  {FILTERS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="card mt-3 p-4 text-muted">Ningún proyecto coincide con los filtros.</p>
          ) : (
            <ul className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  selected={selected.includes(project.id)}
                  onToggle={() => toggle(project.id)}
                />
              ))}
            </ul>
          )}
        </section>
        <ActivityFeed items={feed} />
      </div>
    </div>
  );
}
