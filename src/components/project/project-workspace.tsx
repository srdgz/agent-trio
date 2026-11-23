"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { LaunchForm } from "@/components/console/launch-form";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { RUN_STATUS_INFO, STAGE_INFO } from "@/domain/labels";
import type { ProjectDetail } from "@/domain/types";
import { AgentsPanel } from "./agents-panel";
import { DiffView, PreviewView, SourceView } from "./code-views";
import { useProjectDetail } from "./use-project-detail";

const TABS = [
  { id: "diff", label: "Cambios" },
  { id: "code", label: "Código" },
  { id: "preview", label: "Vista previa" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const runDate = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

function fileMark(path: string, base: Record<string, string>, current: Record<string, string>) {
  if (!(path in base)) return { short: "A", label: "añadido", className: "text-success" };
  if (base[path] !== current[path]) return { short: "M", label: "modificado", className: "text-warning" };
  return null;
}

export function ProjectWorkspace({ initial }: { initial: ProjectDetail }) {
  const { detail, live, stage, selectRun } = useProjectDetail(initial);
  const { project, run, runs } = detail;
  const [tab, setTab] = useState<TabId>("diff");
  const [selectedPath, setSelectedPath] = useState("app/page.tsx");
  const [follow, setFollow] = useState(true);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const base = run?.baseFiles ?? project.files;
  const saved = run?.files ?? project.files;
  const draft = run?.draft ?? null;
  const current = useMemo(() => ({ ...saved, ...(draft ?? {}) }), [saved, draft]);
  const writingPath = draft ? Object.keys(draft).at(-1) ?? null : null;
  const followed = follow && writingPath ? writingPath : selectedPath;
  const path = followed in current ? followed : "app/page.tsx";
  const isWriting = path === writingPath;
  const paths = Object.keys(current).sort();

  function handleTabKeys(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((item) => item.id === tab);
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/" className="inline-flex min-h-6 items-center gap-1 text-sm text-muted underline">
            <Icon name="back" className="size-3.5" />
            Proyectos
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <StatusBadge {...STAGE_INFO[stage]} />
          </div>
          <p className="text-sm text-muted">
            {project.clientName} · {project.sector} · {project.kind}
          </p>
        </div>
        {runs.length > 0 ? (
          <div className="w-full sm:w-80">
            <label htmlFor="run-history" className="text-xs text-muted">
              Ejecución
            </label>
            <select
              id="run-history"
              value={run?.id}
              onChange={(event) => selectRun(event.target.value)}
              className="field text-sm"
            >
              {runs.map((item) => (
                <option key={item.id} value={item.id}>
                  {runDate.format(new Date(item.createdAt))} · {RUN_STATUS_INFO[item.status].label} · {item.request}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <section aria-label="Lanzar agentes" className="card p-3">
        <LaunchForm
          projectIds={[project.id]}
          label="Nueva petición para este proyecto"
          hint="Los cambios se aplican al proyecto cuando todas las pruebas pasan."
          disabledReason={live ? "Este proyecto ya tiene una ejecución en curso." : null}
          onLaunched={() => {
            selectRun(null);
            setFollow(true);
          }}
        />
      </section>

      {run?.error ? (
        <p role="alert" className="rounded-md bg-danger-soft p-3 font-medium text-danger">
          {run.error}
        </p>
      ) : null}

      <div className="grid items-start gap-3 lg:grid-cols-[14rem_minmax(0,1fr)] 2xl:grid-cols-[15rem_minmax(0,1fr)_23rem]">
        <section aria-labelledby="files-title" className="card">
          <h2 id="files-title" className="section-title border-b border-border px-3 py-2.5">
            Archivos
          </h2>
          <ul className="max-h-64 overflow-y-auto p-1 lg:max-h-none">
            {paths.map((item) => {
              const mark = fileMark(item, base, current);
              const writing = item === writingPath;
              return (
                <li key={item}>
                  <button
                    type="button"
                    aria-pressed={item === path}
                    onClick={() => {
                      setSelectedPath(item);
                      setFollow(false);
                    }}
                    className={`flex min-h-8 w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-left font-mono text-xs ${
                      item === path ? "bg-accent-soft text-on-accent-soft" : "hover:bg-surface-muted"
                    }`}
                  >
                    <span className="min-w-0">{item}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {writing ? (
                        <>
                          <span aria-hidden="true" className="pulse-dot size-2 rounded-full bg-accent" />
                          <span className="sr-only">escribiéndose</span>
                        </>
                      ) : null}
                      {mark ? (
                        <span className={`font-semibold ${item === path ? "" : mark.className}`}>
                          <span aria-hidden="true">{mark.short}</span>
                          <span className="sr-only">{mark.label}</span>
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 border-t border-border px-3 text-sm">
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Seguir a los agentes
          </label>
        </section>

        <section aria-label="Editor" className="card flex h-[42rem] min-w-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-2">
            <div role="tablist" aria-label="Vista del código" onKeyDown={handleTabKeys} className="flex">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[item.id] = node;
                  }}
                  id={`tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={tab === item.id ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  className={`min-h-10 cursor-pointer border-b-2 px-3 text-sm font-semibold ${
                    tab === item.id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="px-1 py-1 font-mono text-xs text-muted">
              {path}
              {isWriting ? <span className="ml-2 font-semibold text-accent">Develop escribiendo…</span> : null}
            </p>
          </div>
          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="min-h-0 flex-1">
            {tab === "preview" ? (
              <PreviewView files={saved} />
            ) : tab === "code" || isWriting ? (
              <SourceView path={path} content={current[path] ?? ""} follow={follow && isWriting} />
            ) : (
              <DiffView path={path} before={base[path] ?? ""} after={current[path] ?? ""} />
            )}
          </div>
        </section>

        <div className="lg:col-span-2 2xl:col-span-1">
          <AgentsPanel detail={detail} />
        </div>
      </div>
    </div>
  );
}
