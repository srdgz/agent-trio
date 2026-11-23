export const AGENTS = ["orchestrator", "develop", "testing"] as const;
export const RUN_STATUSES = ["queued", "planning", "running", "completed", "failed"] as const;
export const ACTIVE_RUN_STATUSES = ["queued", "planning", "running"] as const;
export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "in_review",
  "changes_requested",
  "done",
  "failed",
] as const;
export const EVENT_KINDS = ["info", "start", "success", "warning", "error"] as const;
export const CHANGE_KINDS = ["added", "modified"] as const;
export const CHECK_TYPES = [
  "file_exists",
  "route_exists",
  "element_exists",
  "text_contains",
  "links_to",
] as const;
export const PROJECT_STAGES = [
  "idle",
  "queued",
  "planning",
  "developing",
  "fixing",
  "testing",
  "completed",
  "failed",
] as const;

export type AgentId = (typeof AGENTS)[number];
export type RunStatus = (typeof RUN_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type EventKind = (typeof EVENT_KINDS)[number];
export type ChangeKind = (typeof CHANGE_KINDS)[number];
export type CheckType = (typeof CHECK_TYPES)[number];
export type ProjectStage = (typeof PROJECT_STAGES)[number];
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
  baseFiles: Workspace;
  draft: Workspace | null;
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

export type ChangeView = {
  id: number;
  taskId: string;
  attempt: number;
  path: string;
  kind: ChangeKind;
  additions: number;
  deletions: number;
  createdAt: string;
};

export type RunSummary = {
  id: string;
  request: string;
  status: RunStatus;
  createdAt: string;
};

export type ProjectDetail = {
  project: {
    id: string;
    name: string;
    kind: string;
    clientName: string;
    sector: string;
    files: Workspace;
  };
  runs: RunSummary[];
  run: RunView | null;
  tasks: TaskView[];
  events: EventView[];
  changes: ChangeView[];
};

export type ProjectRow = {
  id: string;
  name: string;
  kind: string;
  clientName: string;
  sector: string;
  stage: ProjectStage;
  activeAgent: AgentId | null;
  request: string | null;
  currentTask: string | null;
  tasksDone: number;
  tasksTotal: number;
  filesChanged: number;
  updatedAt: string | null;
};

export type FeedItem = {
  id: number;
  projectId: string;
  projectName: string;
  clientName: string;
  agent: AgentId;
  kind: EventKind;
  message: string;
  createdAt: string;
};

export type PortfolioStats = {
  projects: number;
  clients: number;
  executing: number;
  queued: number;
  failed: number;
  completedToday: number;
  tokensToday: number;
  runsToday: number;
  maxRunsPerDay: number;
  maxParallel: number;
};

export type PortfolioSnapshot = {
  stats: PortfolioStats;
  projects: ProjectRow[];
  feed: FeedItem[];
};
