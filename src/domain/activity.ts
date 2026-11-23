import type { AgentActivity, AgentId, ProjectStage, RunStatus, TaskStatus } from "./types";

type ActivityInput = {
  runStatus: RunStatus;
  taskStatuses: TaskStatus[];
};

export function activeAgent({ runStatus, taskStatuses }: ActivityInput): AgentId | null {
  if (runStatus === "planning") return "orchestrator";
  if (runStatus !== "running") return null;
  const current = taskStatuses.find((status) => status !== "done");
  if (!current) return "orchestrator";
  return current === "in_review" ? "testing" : "develop";
}

export function agentActivity(agent: AgentId, input: ActivityInput): AgentActivity {
  if (input.runStatus === "completed") return "done";
  if (input.runStatus === "failed") {
    return agent === "orchestrator" ? "blocked" : "idle";
  }
  return activeAgent(input) === agent ? "working" : "idle";
}

export function projectStage(runStatus: RunStatus | null, taskStatuses: TaskStatus[]): ProjectStage {
  if (!runStatus) return "idle";
  if (runStatus !== "running") return runStatus;
  const current = taskStatuses.find((status) => status !== "done");
  if (current === "in_review") return "testing";
  if (current === "changes_requested") return "fixing";
  return "developing";
}

export function isActiveStage(stage: ProjectStage) {
  return ["queued", "planning", "developing", "fixing", "testing"].includes(stage);
}
