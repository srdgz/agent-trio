import { and, asc, count, desc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { events, runs, tasks, type RunRow } from "@/db/schema";
import { LIMITS } from "@/domain/limits";
import { SEED_FILES } from "@/domain/seed";
import type { AgentId, EventKind, RunSnapshot } from "@/domain/types";

const NEXT_ENTRY = "app/page.tsx";

export type NewEvent = {
  runId: string;
  taskId?: string;
  agent: AgentId;
  kind: EventKind;
  message: string;
};

export function insertEvent(event: NewEvent) {
  return getDb().insert(events).values(event);
}

export async function runsCreatedToday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await getDb()
    .select({ total: count() })
    .from(runs)
    .where(gte(runs.createdAt, start));
  return row?.total ?? 0;
}

export async function createRun(request: string) {
  const db = getDb();
  const [run] = await db
    .insert(runs)
    .values({ request, files: SEED_FILES })
    .returning({ id: runs.id });
  await insertEvent({
    runId: run.id,
    agent: "orchestrator",
    kind: "info",
    message: "Petición recibida.",
  });
  return run.id;
}

export async function listRuns(limit = 12) {
  return getDb()
    .select({
      id: runs.id,
      request: runs.request,
      status: runs.status,
      createdAt: runs.createdAt,
    })
    .from(runs)
    .where(sql`${runs.files} ? ${NEXT_ENTRY}`)
    .orderBy(desc(runs.createdAt))
    .limit(limit);
}

export async function getSnapshot(id: string): Promise<RunSnapshot | null> {
  const db = getDb();
  const [run] = await db.select().from(runs).where(eq(runs.id, id)).limit(1);
  if (!run || !(NEXT_ENTRY in run.files)) return null;

  const [taskRows, eventRows] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.runId, id)).orderBy(asc(tasks.position)),
    db.select().from(events).where(eq(events.runId, id)).orderBy(asc(events.id)),
  ]);

  return {
    run: {
      id: run.id,
      request: run.request,
      status: run.status,
      summary: run.summary,
      error: run.error,
      files: run.files,
      tokensUsed: run.tokensUsed,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
    },
    tasks: taskRows.map((task) => ({
      id: task.id,
      position: task.position,
      title: task.title,
      description: task.description,
      status: task.status,
      attempts: task.attempts,
      feedback: task.feedback,
      results: task.results,
    })),
    events: eventRows.map((event) => ({
      id: event.id,
      taskId: event.taskId,
      agent: event.agent,
      kind: event.kind,
      message: event.message,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export async function acquireLease(id: string): Promise<RunRow | null> {
  const now = new Date();
  const [run] = await getDb()
    .update(runs)
    .set({ leaseUntil: new Date(now.getTime() + LIMITS.leaseMs) })
    .where(
      and(
        eq(runs.id, id),
        inArray(runs.status, ["planning", "running"]),
        or(isNull(runs.leaseUntil), lt(runs.leaseUntil, now)),
        or(isNull(runs.nextAttemptAt), lt(runs.nextAttemptAt, now)),
      ),
    )
    .returning();
  return run ?? null;
}

export function releaseLease(id: string, tokens: number) {
  return getDb()
    .update(runs)
    .set({
      leaseUntil: null,
      nextAttemptAt: null,
      errorCount: 0,
      tokensUsed: sql`${runs.tokensUsed} + ${tokens}`,
      updatedAt: new Date(),
    })
    .where(eq(runs.id, id));
}

export function scheduleRetry(id: string, errorCount: number, retryAfterMs: number) {
  return getDb()
    .update(runs)
    .set({
      leaseUntil: null,
      errorCount,
      nextAttemptAt: new Date(Date.now() + retryAfterMs),
      updatedAt: new Date(),
    })
    .where(eq(runs.id, id));
}

export function markRunFailed(id: string, error: string) {
  return getDb()
    .update(runs)
    .set({ status: "failed", error, leaseUntil: null, nextAttemptAt: null, updatedAt: new Date() })
    .where(eq(runs.id, id));
}
