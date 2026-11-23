import { and, asc, count, countDistinct, desc, eq, gte, inArray, isNotNull, sql, sum } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, events, fileChanges, projects, runs, tasks, type RunRow } from "@/db/schema";
import { activeAgent, projectStage } from "@/domain/activity";
import { LIMITS, maxParallelRuns, maxRunsPerDay } from "@/domain/limits";
import {
  ACTIVE_RUN_STATUSES,
  type AgentId,
  type EventKind,
  type PortfolioSnapshot,
  type ProjectDetail,
  type ProjectRow,
  type Workspace,
} from "@/domain/types";

const FEED_SIZE = 40;
const RUN_HISTORY_SIZE = 10;

export type NewEvent = {
  runId: string;
  taskId?: string;
  agent: AgentId;
  kind: EventKind;
  message: string;
};

function startOfToday() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function insertEvent(event: NewEvent) {
  return getDb().insert(events).values(event);
}

export async function runsCreatedToday() {
  const [row] = await getDb()
    .select({ total: count() })
    .from(runs)
    .where(and(isNotNull(runs.projectId), gte(runs.createdAt, startOfToday())));
  return row?.total ?? 0;
}

export async function createRuns(projectIds: string[], request: string) {
  const db = getDb();
  const selected = await db
    .select({ id: projects.id, files: projects.files })
    .from(projects)
    .where(inArray(projects.id, projectIds));
  if (selected.length === 0) return { created: [], skipped: projectIds.length };

  const created = await db
    .insert(runs)
    .values(
      selected.map((project) => ({
        projectId: project.id,
        request,
        status: "queued" as const,
        files: project.files,
        baseFiles: project.files,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: runs.id, projectId: runs.projectId });

  if (created.length > 0) {
    await db.insert(events).values(
      created.map((run) => ({
        runId: run.id,
        agent: "orchestrator" as const,
        kind: "info" as const,
        message: "Petición añadida a la cola.",
      })),
    );
  }
  return { created, skipped: projectIds.length - created.length };
}

export async function getPortfolio(): Promise<PortfolioSnapshot> {
  const db = getDb();
  const today = startOfToday();

  const [projectRows, latestRuns, todayRows, feedRows, clientCount] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        kind: projects.kind,
        clientName: clients.name,
        sector: clients.sector,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(asc(clients.name)),
    db
      .selectDistinctOn([runs.projectId], {
        id: runs.id,
        projectId: runs.projectId,
        status: runs.status,
        request: runs.request,
        updatedAt: runs.updatedAt,
      })
      .from(runs)
      .where(isNotNull(runs.projectId))
      .orderBy(runs.projectId, desc(runs.createdAt)),
    db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${runs.status} = 'completed')`.mapWith(Number),
        tokens: sum(runs.tokensUsed).mapWith(Number),
      })
      .from(runs)
      .where(and(isNotNull(runs.projectId), gte(runs.createdAt, today))),
    db
      .select({
        id: events.id,
        projectId: projects.id,
        projectName: projects.name,
        clientName: clients.name,
        agent: events.agent,
        kind: events.kind,
        message: events.message,
        createdAt: events.createdAt,
      })
      .from(events)
      .innerJoin(runs, eq(events.runId, runs.id))
      .innerJoin(projects, eq(runs.projectId, projects.id))
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(events.id))
      .limit(FEED_SIZE),
    db.select({ total: count() }).from(clients),
  ]);

  const runIds = latestRuns.map((run) => run.id);
  const [taskRows, changeRows] =
    runIds.length > 0
      ? await Promise.all([
          db
            .select({ runId: tasks.runId, title: tasks.title, status: tasks.status })
            .from(tasks)
            .where(inArray(tasks.runId, runIds))
            .orderBy(asc(tasks.position)),
          db
            .select({ runId: fileChanges.runId, total: countDistinct(fileChanges.path) })
            .from(fileChanges)
            .where(inArray(fileChanges.runId, runIds))
            .groupBy(fileChanges.runId),
        ])
      : [[], []];

  const latestByProject = new Map(latestRuns.map((run) => [run.projectId, run]));
  const changesByRun = new Map(changeRows.map((row) => [row.runId, row.total]));

  const rows: ProjectRow[] = projectRows.map((project) => {
    const run = latestByProject.get(project.id);
    const runTasks = run ? taskRows.filter((task) => task.runId === run.id) : [];
    const statuses = runTasks.map((task) => task.status);
    const current = runTasks.find((task) => task.status !== "done");
    return {
      ...project,
      stage: projectStage(run?.status ?? null, statuses),
      activeAgent: run ? activeAgent({ runStatus: run.status, taskStatuses: statuses }) : null,
      request: run?.request ?? null,
      currentTask: current?.title ?? null,
      tasksDone: statuses.filter((status) => status === "done").length,
      tasksTotal: statuses.length,
      filesChanged: run ? (changesByRun.get(run.id) ?? 0) : 0,
      updatedAt: run?.updatedAt.toISOString() ?? null,
    };
  });

  const queued = rows.filter((row) => row.stage === "queued").length;
  const active = latestRuns.filter((run) => (ACTIVE_RUN_STATUSES as readonly string[]).includes(run.status)).length;

  return {
    stats: {
      projects: rows.length,
      clients: clientCount[0]?.total ?? 0,
      executing: active - queued,
      queued,
      failed: rows.filter((row) => row.stage === "failed").length,
      completedToday: todayRows[0]?.completed ?? 0,
      tokensToday: todayRows[0]?.tokens ?? 0,
      runsToday: todayRows[0]?.total ?? 0,
      maxRunsPerDay: maxRunsPerDay(),
      maxParallel: maxParallelRuns(),
    },
    projects: rows,
    feed: feedRows.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function getProjectDetail(id: string, requestedRunId?: string): Promise<ProjectDetail | null> {
  const db = getDb();
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      kind: projects.kind,
      files: projects.files,
      clientName: clients.name,
      sector: clients.sector,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, id))
    .limit(1);
  if (!project) return null;

  const history = await db
    .select({ id: runs.id, request: runs.request, status: runs.status, createdAt: runs.createdAt })
    .from(runs)
    .where(eq(runs.projectId, id))
    .orderBy(desc(runs.createdAt))
    .limit(RUN_HISTORY_SIZE);
  const runSummaries = history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }));
  const runId = history.some((item) => item.id === requestedRunId) ? requestedRunId : history[0]?.id;
  if (!runId) return { project, runs: runSummaries, run: null, tasks: [], events: [], changes: [] };

  const [[run], taskRows, eventRows, changeRows] = await Promise.all([
    db.select().from(runs).where(eq(runs.id, runId)).limit(1),
    db.select().from(tasks).where(eq(tasks.runId, runId)).orderBy(asc(tasks.position)),
    db.select().from(events).where(eq(events.runId, runId)).orderBy(asc(events.id)),
    db.select().from(fileChanges).where(eq(fileChanges.runId, runId)).orderBy(asc(fileChanges.id)),
  ]);

  return {
    project,
    runs: runSummaries,
    run: {
      id: run.id,
      request: run.request,
      status: run.status,
      summary: run.summary,
      error: run.error,
      files: run.files,
      baseFiles: run.baseFiles ?? run.files,
      draft: run.draft,
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
    changes: changeRows.map((change) => ({
      id: change.id,
      taskId: change.taskId,
      attempt: change.attempt,
      path: change.path,
      kind: change.kind,
      additions: change.additions,
      deletions: change.deletions,
      createdAt: change.createdAt.toISOString(),
    })),
  };
}

export async function acquireNextRun(): Promise<RunRow | null> {
  const db = getDb();
  const leaseSeconds = Math.ceil(LIMITS.leaseMs / 1000);
  const result = await db.execute<{ id: string }>(sql`
    update runs
    set lease_until = now() + make_interval(secs => ${leaseSeconds})
    where id = (
      select candidate.id
      from runs candidate
      where candidate.project_id is not null
        and candidate.status in ('queued', 'planning', 'running')
        and (candidate.lease_until is null or candidate.lease_until < now())
        and (candidate.next_attempt_at is null or candidate.next_attempt_at < now())
        and (select count(*) from runs busy where busy.lease_until > now()) < ${maxParallelRuns()}
      order by candidate.updated_at asc
      limit 1
      for update skip locked
    )
    returning id
  `);
  const id = result.rows[0]?.id;
  if (!id) return null;
  const [run] = await db.select().from(runs).where(eq(runs.id, id)).limit(1);
  return run ?? null;
}

export function saveDraft(id: string, draft: Workspace) {
  return getDb().update(runs).set({ draft }).where(eq(runs.id, id));
}

export function releaseLease(id: string, tokens: number) {
  return getDb()
    .update(runs)
    .set({
      leaseUntil: null,
      nextAttemptAt: null,
      draft: null,
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
      draft: null,
      errorCount,
      nextAttemptAt: new Date(Date.now() + retryAfterMs),
      updatedAt: new Date(),
    })
    .where(eq(runs.id, id));
}

export function markRunFailed(id: string, error: string) {
  return getDb()
    .update(runs)
    .set({ status: "failed", error, draft: null, leaseUntil: null, nextAttemptAt: null, updatedAt: new Date() })
    .where(eq(runs.id, id));
}
