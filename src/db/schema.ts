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
  uuid,
} from "drizzle-orm/pg-core";
import {
  AGENTS,
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

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    request: text("request").notNull(),
    status: runStatus("status").notNull().default("planning"),
    summary: text("summary"),
    error: text("error"),
    files: jsonb("files").$type<Workspace>().notNull(),
    tokensUsed: integer("tokens_used").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    leaseUntil: timestamptz("lease_until"),
    nextAttemptAt: timestamptz("next_attempt_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [index("runs_created_at_idx").on(table.createdAt)],
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

export type RunRow = typeof runs.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
