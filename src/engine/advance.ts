import { diffLines } from "diff";
import { asc, eq } from "drizzle-orm";
import { developTask } from "@/agents/develop";
import { TransientModelError } from "@/agents/model";
import { planTasks } from "@/agents/orchestrator";
import { testTask } from "@/agents/testing";
import { getDb } from "@/db/client";
import { events, fileChanges, projects, runs, tasks, type RunRow, type TaskRow } from "@/db/schema";
import { LIMITS } from "@/domain/limits";
import type { CheckResult, Workspace } from "@/domain/types";
import { WorkspaceError, applyChanges } from "@/domain/workspace";
import {
  acquireNextRun,
  insertEvent,
  markRunFailed,
  releaseLease,
  saveDraft,
  scheduleRetry,
} from "./repository";

export type AdvanceResult =
  | { state: "advanced" }
  | { state: "idle" }
  | { state: "retry"; retryAfterMs: number };

function viaFallback(usedFallback: boolean) {
  return usedFallback ? " Resuelto con el respaldo de Mistral." : "";
}

async function planStep(run: RunRow) {
  const db = getDb();
  await db.batch([
    db.update(runs).set({ status: "planning" }).where(eq(runs.id, run.id)),
    db.insert(events).values({
      runId: run.id,
      agent: "orchestrator",
      kind: "start",
      message: "Analizando la petición y dividiéndola en tareas.",
    }),
  ]);

  const plan = await planTasks(run.request, run.files);
  if (plan.tasks.some((task) => task.checks.length === 0)) {
    throw new TransientModelError("El plan no incluye comprobaciones válidas.", 2_000);
  }

  const ids = plan.tasks.map(() => crypto.randomUUID());
  await db.batch([
    db.insert(tasks).values(
      plan.tasks.map((task, position) => ({
        id: ids[position],
        runId: run.id,
        position,
        title: task.title,
        description: task.description,
        checks: task.checks,
      })),
    ),
    db.update(runs).set({ status: "running", summary: plan.summary }).where(eq(runs.id, run.id)),
    db.insert(events).values({
      runId: run.id,
      agent: "orchestrator",
      kind: "success",
      message: `Plan creado con ${plan.tasks.length} ${plan.tasks.length === 1 ? "tarea" : "tareas"}.${viaFallback(plan.usedFallback)}`,
    }),
  ]);
  return plan.tokens;
}

async function rejectTask(
  run: RunRow,
  task: TaskRow,
  attempts: number,
  feedback: string[],
  results: CheckResult[],
) {
  const db = getDb();
  const exhausted = attempts >= LIMITS.maxAttemptsPerTask;

  await db.batch([
    db
      .update(tasks)
      .set({
        status: exhausted ? "failed" : "changes_requested",
        attempts,
        feedback,
        results,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id)),
    db.insert(events).values({
      runId: run.id,
      taskId: task.id,
      agent: "testing",
      kind: exhausted ? "error" : "warning",
      message: exhausted
        ? `«${task.title}» sigue fallando tras ${attempts} intentos.`
        : `«${task.title}» devuelta a Develop con ${feedback.length} ${feedback.length === 1 ? "fallo" : "fallos"}.`,
    }),
  ]);

  if (exhausted) {
    await markRunFailed(run.id, `No se ha podido completar la tarea «${task.title}».`);
  }
}

function lineStats(before: string, after: string) {
  let additions = 0;
  let deletions = 0;
  for (const part of diffLines(before, after)) {
    if (part.added) additions += part.count ?? 0;
    if (part.removed) deletions += part.count ?? 0;
  }
  return { additions, deletions };
}

function buildChanges(run: RunRow, task: TaskRow, attempt: number, next: Workspace, paths: string[]) {
  return [...new Set(paths)]
    .filter((path) => run.files[path] !== next[path])
    .map((path) => ({
      runId: run.id,
      taskId: task.id,
      attempt,
      path,
      kind: path in run.files ? ("modified" as const) : ("added" as const),
      ...lineStats(run.files[path] ?? "", next[path]),
    }));
}

async function developStep(run: RunRow, task: TaskRow) {
  const db = getDb();
  await db.batch([
    db
      .update(tasks)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(tasks.id, task.id)),
    db.insert(events).values({
      runId: run.id,
      taskId: task.id,
      agent: "develop",
      kind: "start",
      message: `Trabajando en «${task.title}» (intento ${task.attempts + 1}).`,
    }),
  ]);

  let lastWrite = 0;
  let pendingWrite: Promise<unknown> = Promise.resolve();
  const { data, tokens, usedFallback } = await developTask(
    {
      request: run.request,
      title: task.title,
      description: task.description,
      criteria: task.checks.map((check) => check.description),
      feedback: task.feedback,
      files: run.files,
    },
    (draft) => {
      const now = Date.now();
      if (now - lastWrite < LIMITS.draftWriteMs || Object.keys(draft).length === 0) return;
      lastWrite = now;
      pendingWrite = pendingWrite.then(() => saveDraft(run.id, draft)).catch(() => undefined);
    },
  );
  await pendingWrite;

  const attempts = task.attempts + 1;
  try {
    const files = applyChanges(run.files, data.files);
    const changes = buildChanges(run, task, attempts, files, data.files.map((file) => file.path));
    if (changes.length > 0) await db.insert(fileChanges).values(changes);
    await db.batch([
      db.update(runs).set({ files, draft: null }).where(eq(runs.id, run.id)),
      db
        .update(tasks)
        .set({ status: "in_review", attempts, updatedAt: new Date() })
        .where(eq(tasks.id, task.id)),
      db.insert(events).values({
        runId: run.id,
        taskId: task.id,
        agent: "develop",
        kind: "success",
        message: `${data.notes} Archivos: ${data.files.map((file) => file.path).join(", ")}.${viaFallback(usedFallback)}`,
      }),
    ]);
  } catch (error) {
    if (!(error instanceof WorkspaceError)) throw error;
    await rejectTask(run, task, attempts, [error.message], [
      { label: "Archivos entregados", passed: false, detail: error.message },
    ]);
  }
  return tokens;
}

async function testStep(run: RunRow, task: TaskRow) {
  await insertEvent({
    runId: run.id,
    taskId: task.id,
    agent: "testing",
    kind: "start",
    message: `Comprobando «${task.title}».`,
  });

  const outcome = await testTask({
    title: task.title,
    description: task.description,
    checks: task.checks,
    files: run.files,
  });

  if (!outcome.passed) {
    await rejectTask(run, task, task.attempts, outcome.feedback, outcome.results);
    return outcome.tokens;
  }

  const db = getDb();
  const total = outcome.results.length;
  await db.batch([
    db
      .update(tasks)
      .set({ status: "done", feedback: [], results: outcome.results, updatedAt: new Date() })
      .where(eq(tasks.id, task.id)),
    db.insert(events).values({
      runId: run.id,
      taskId: task.id,
      agent: "testing",
      kind: "success",
      message: `«${task.title}» aprobada: ${total} de ${total} comprobaciones correctas.${viaFallback(outcome.usedFallback)}`,
    }),
  ]);
  return outcome.tokens;
}

async function completeRun(run: RunRow) {
  const db = getDb();
  await db.batch([
    db.update(runs).set({ status: "completed" }).where(eq(runs.id, run.id)),
    db
      .update(projects)
      .set({ files: run.files, updatedAt: new Date() })
      .where(eq(projects.id, run.projectId!)),
    db.insert(events).values({
      runId: run.id,
      agent: "orchestrator",
      kind: "success",
      message: "Todas las tareas han pasado las pruebas. Cambios aplicados al proyecto.",
    }),
  ]);
  return 0;
}

async function executeStep(run: RunRow) {
  if (run.status === "queued" || run.status === "planning") return planStep(run);

  const rows = await getDb()
    .select()
    .from(tasks)
    .where(eq(tasks.runId, run.id))
    .orderBy(asc(tasks.position));
  const task = rows.find((row) => row.status !== "done");

  if (!task) return completeRun(run);
  return task.status === "in_review" ? testStep(run, task) : developStep(run, task);
}

async function handleTransient(run: RunRow, error: TransientModelError): Promise<AdvanceResult> {
  const errorCount = run.errorCount + 1;
  if (errorCount >= LIMITS.maxTransientErrors) {
    await markRunFailed(run.id, error.message);
    await insertEvent({
      runId: run.id,
      agent: "orchestrator",
      kind: "error",
      message: `Ejecución detenida: ${error.message}`,
    });
    return { state: "advanced" };
  }

  await scheduleRetry(run.id, errorCount, error.retryAfterMs);
  await insertEvent({
    runId: run.id,
    agent: "orchestrator",
    kind: "warning",
    message: `${error.message} Reintento en ${Math.ceil(error.retryAfterMs / 1000)} s.`,
  });
  return { state: "retry", retryAfterMs: error.retryAfterMs };
}

export async function advanceNextRun(): Promise<AdvanceResult> {
  const run = await acquireNextRun();
  if (!run) return { state: "idle" };

  try {
    const tokens = await executeStep(run);
    await releaseLease(run.id, tokens);
    return { state: "advanced" };
  } catch (error) {
    if (error instanceof TransientModelError) return handleTransient(run, error);
    console.error("Run step failed", { runId: run.id, error });
    await markRunFailed(run.id, "Se ha producido un error interno.");
    await insertEvent({
      runId: run.id,
      agent: "orchestrator",
      kind: "error",
      message: "Ejecución detenida por un error interno.",
    });
    return { state: "advanced" };
  }
}
