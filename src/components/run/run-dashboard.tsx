"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { activeAgent } from "@/domain/activity";
import { AGENT_INFO, RUN_STATUS_INFO, TASK_STATUS_INFO } from "@/domain/labels";
import type { RunSnapshot } from "@/domain/types";
import { ActivityLog } from "./activity-log";
import { AgentCards } from "./agent-cards";
import { ResultPanel } from "./result-panel";
import { TaskList } from "./task-list";
import { useRunSnapshot } from "./use-run-snapshot";

function announcement({ run, tasks }: RunSnapshot) {
  const status = RUN_STATUS_INFO[run.status].label;
  const agent = activeAgent({
    runStatus: run.status,
    taskStatuses: tasks.map((task) => task.status),
  });
  const task = tasks.find((item) => item.status !== "done");
  const parts = [`Ejecución: ${status}.`];
  if (agent) parts.push(`Agente activo: ${AGENT_INFO[agent].name}.`);
  if (task) parts.push(`Tarea ${task.title}: ${TASK_STATUS_INFO[task.status].label}.`);
  return parts.join(" ");
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

      <div>
        <Link href="/" className="inline-flex min-h-11 items-center font-medium text-accent underline">
          Volver al inicio
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-72">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ejecución de agentes</h1>
            <p className="mt-1 text-lg">{run.request}</p>
            {run.summary ? <p className="mt-1 text-muted">{run.summary}</p> : null}
          </div>
          <StatusBadge {...RUN_STATUS_INFO[run.status]} />
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <div className="flex gap-1">
            <dt>Tareas superadas:</dt>
            <dd className="font-semibold text-foreground">
              {doneCount} de {tasks.length}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt>Tokens usados:</dt>
            <dd className="font-semibold text-foreground">
              {run.tokensUsed.toLocaleString("es-ES")}
            </dd>
          </div>
        </dl>
      </div>

      {run.error ? (
        <p role="alert" className="rounded-lg bg-danger-soft p-3 font-medium text-danger">
          {run.error}
        </p>
      ) : null}

      {paused ? (
        <p className="rounded-lg bg-warning-soft p-3 font-medium text-warning">
          Ejecución en pausa.{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>{" "}
          para que los agentes continúen.
        </p>
      ) : null}

      <AgentCards snapshot={snapshot} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0 space-y-6">
          <TaskList tasks={tasks} />
          <ActivityLog events={events} />
        </div>
        <ResultPanel files={run.files} />
      </div>
    </div>
  );
}
