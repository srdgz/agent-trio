export const AGENTS = ["orchestrator", "develop", "testing"] as const;
export const RUN_STATUSES = ["planning", "running", "completed", "failed"] as const;
export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "in_review",
  "changes_requested",
  "done",
  "failed",
] as const;
export const EVENT_KINDS = ["info", "start", "success", "warning", "error"] as const;
export const CHECK_TYPES = [
  "file_exists",
  "route_exists",
  "element_exists",
  "text_contains",
  "links_to",
] as const;

export type AgentId = (typeof AGENTS)[number];
export type RunStatus = (typeof RUN_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type EventKind = (typeof EVENT_KINDS)[number];
export type CheckType = (typeof CHECK_TYPES)[number];
export type Workspace = Record<string, string>;

export type TaskCheck = {
  type: CheckType;
  path: string;
  value: string | null;
  description: string;
};

export type CheckResult = {
  label: string;
  passed: boolean;
  detail: string | null;
};

export type AgentActivity = "idle" | "working" | "done" | "blocked";

export type RunView = {
  id: string;
  request: string;
  status: RunStatus;
  summary: string | null;
  error: string | null;
  files: Workspace;
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskView = {
  id: string;
  position: number;
  title: string;
  description: string;
  status: TaskStatus;
  attempts: number;
  feedback: string[];
  results: CheckResult[];
};

export type EventView = {
  id: number;
  taskId: string | null;
  agent: AgentId;
  kind: EventKind;
  message: string;
  createdAt: string;
};

export type RunSnapshot = {
  run: RunView;
  tasks: TaskView[];
  events: EventView[];
};
