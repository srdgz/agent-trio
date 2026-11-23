import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  AGENTS,
  CHANGE_KINDS,
  EVENT_KINDS,
  RUN_STATUSES,
  TASK_STATUSES,
  type CheckResult,
  type TaskCheck,
  type Workspace,
} from "@/domain/types";

export const runStatus = pgEnum("run_status", RUN_STATUSES);
export const taskStatus = pgEnum("task_status", TASK_STATUSES);
export const agentName = pgEnum("agent_name", AGENTS);
export const eventKind = pgEnum("event_kind", EVENT_KINDS);
export const changeKind = pgEnum("change_kind", CHANGE_KINDS);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  sector: text("sector").notNull(),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    files: jsonb("files").$type<Workspace>().notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("projects_client_name_key").on(table.clientId, table.name)],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    request: text("request").notNull(),
    status: runStatus("status").notNull().default("planning"),
    summary: text("summary"),
    error: text("error"),
    files: jsonb("files").$type<Workspace>().notNull(),
    baseFiles: jsonb("base_files").$type<Workspace>(),
    draft: jsonb("draft").$type<Workspace>(),
    tokensUsed: integer("tokens_used").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    leaseUntil: timestamptz("lease_until"),
    nextAttemptAt: timestamptz("next_attempt_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("runs_created_at_idx").on(table.createdAt),
    index("runs_project_created_idx").on(table.projectId, table.createdAt),
    uniqueIndex("runs_one_active_per_project")
      .on(table.projectId)
      .where(sql`${table.projectId} is not null and ${table.status} not in ('completed', 'failed')`),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    checks: jsonb("checks").$type<TaskCheck[]>().notNull(),
    status: taskStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    feedback: jsonb("feedback").$type<string[]>().notNull().default([]),
    results: jsonb("results").$type<CheckResult[]>().notNull().default([]),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("tasks_run_position_key").on(table.runId, table.position)],
);

export const events = pgTable(
  "events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    agent: agentName("agent").notNull(),
    kind: eventKind("kind").notNull().default("info"),
    message: text("message").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [index("events_run_id_idx").on(table.runId, table.id)],
);

export const fileChanges = pgTable(
  "file_changes",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    attempt: integer("attempt").notNull(),
    path: text("path").notNull(),
    kind: changeKind("kind").notNull(),
    additions: integer("additions").notNull(),
    deletions: integer("deletions").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [index("file_changes_run_id_idx").on(table.runId, table.id)],
);

export type RunRow = typeof runs.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
