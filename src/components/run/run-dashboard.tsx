"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { activeAgent } from "@/domain/activity";
import { AGENT_INFO, RUN_STATUS_INFO, TASK_STATUS_INFO } from "@/domain/labels";
import type { RunSnapshot } from "@/domain/types";
import { ActivityLog } from "./activity-log";
import { AgentCards } from "./agent-cards";
import { ResultPanel } from "./result-panel";
import { TaskList } from "./task-list";
import { useRunSnapshot } from "./use-run-snapshot";

function currentAgent({ run, tasks }: RunSnapshot) {
  return activeAgent({
    runStatus: run.status,
    taskStatuses: tasks.map((task) => task.status),
  });
}

function announcement(snapshot: RunSnapshot) {
  const { run, tasks } = snapshot;
  const agent = currentAgent(snapshot);
  const task = tasks.find((item) => item.status !== "done");
  const parts = [`Ejecución: ${RUN_STATUS_INFO[run.status].label}.`];
  if (agent) parts.push(`Agente activo: ${AGENT_INFO[agent].name}.`);
  if (task) parts.push(`Tarea ${task.title}: ${TASK_STATUS_INFO[task.status].label}.`);
  return parts.join(" ");
}

function headline(snapshot: RunSnapshot) {
  const agent = currentAgent(snapshot);
  if (agent) return `${AGENT_INFO[agent].name} está trabajando`;
  return snapshot.run.status === "completed" ? "Todo ha pasado las pruebas" : "La ejecución se ha detenido";
}

export function RunDashboard({
  initialSnapshot,
  canAdvance,
}: {
  initialSnapshot: RunSnapshot;
  canAdvance: boolean;
}) {
  const { snapshot, active, sessionExpired } = useRunSnapshot(initialSnapshot, canAdvance);
  const { run, tasks, events } = snapshot;
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const paused = active && (!canAdvance || sessionExpired);

  return (
    <div className="space-y-6">
      <p role="status" className="sr-only">
        {announcement(snapshot)}
      </p>

      <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-medium text-accent underline">
        <Icon name="back" className="size-4" />
        Volver al inicio
      </Link>

      <section aria-labelledby="run-title" className="glass grid items-center gap-6 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="run-title" className="text-3xl font-normal tracking-tight sm:text-4xl">
              Ejecución de agentes
            </h1>
            <StatusBadge {...RUN_STATUS_INFO[run.status]} />
          </div>
          <p className="mt-3 text-lg">{run.request}</p>
          {run.summary ? <p className="mt-1 text-muted">{run.summary}</p> : null}
          <dl className="mt-5 flex flex-wrap gap-2.5 text-sm">
            <div className="flex gap-1.5 rounded-full bg-surface-muted px-4 py-2">
              <dt className="text-muted">Tareas superadas</dt>
              <dd className="font-semibold">
                {doneCount} de {tasks.length}
              </dd>
            </div>
            <div className="flex gap-1.5 rounded-full bg-surface-muted px-4 py-2">
              <dt className="text-muted">Tokens</dt>
              <dd className="font-semibold">{run.tokensUsed.toLocaleString("es-ES")}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="orb" data-active={active} aria-hidden="true">
            <span className="orb-core">
              <BrandMark className="size-9" />
            </span>
          </div>
          <p className="font-display text-lg">{headline(snapshot)}</p>
        </div>
      </section>

      {run.error ? (
        <p role="alert" className="rounded-2xl bg-danger-soft p-4 font-medium text-danger">
          {run.error}
        </p>
      ) : null}

      {paused ? (
        <p className="rounded-2xl bg-warning-soft p-4 font-medium text-warning">
          Ejecución en pausa.{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>{" "}
          para que los agentes continúen.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0 space-y-6">
          <AgentCards snapshot={snapshot} />
          <TaskList tasks={tasks} />
          <ActivityLog events={events} />
        </div>
        <ResultPanel files={run.files} />
      </div>
    </div>
  );
}
