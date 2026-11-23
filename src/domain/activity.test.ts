import { describe, expect, it } from "vitest";
import { activeAgent, agentActivity, isActiveStage, projectStage } from "./activity";

describe("activeAgent", () => {
  it("follows the task lifecycle", () => {
    expect(activeAgent({ runStatus: "queued", taskStatuses: [] })).toBeNull();
    expect(activeAgent({ runStatus: "planning", taskStatuses: [] })).toBe("orchestrator");
    expect(activeAgent({ runStatus: "running", taskStatuses: ["done", "pending"] })).toBe("develop");
    expect(activeAgent({ runStatus: "running", taskStatuses: ["in_review"] })).toBe("testing");
    expect(activeAgent({ runStatus: "running", taskStatuses: ["changes_requested"] })).toBe("develop");
    expect(activeAgent({ runStatus: "running", taskStatuses: ["done"] })).toBe("orchestrator");
    expect(activeAgent({ runStatus: "completed", taskStatuses: ["done"] })).toBeNull();
  });
});

describe("agentActivity", () => {
  it("reports final states", () => {
    expect(agentActivity("testing", { runStatus: "completed", taskStatuses: ["done"] })).toBe("done");
    expect(agentActivity("orchestrator", { runStatus: "failed", taskStatuses: ["failed"] })).toBe("blocked");
  });
});

describe("projectStage", () => {
  it("maps runs to board columns", () => {
    expect(projectStage(null, [])).toBe("idle");
    expect(projectStage("queued", [])).toBe("queued");
    expect(projectStage("running", ["done", "in_progress"])).toBe("developing");
    expect(projectStage("running", ["changes_requested"])).toBe("fixing");
    expect(projectStage("running", ["in_review"])).toBe("testing");
    expect(projectStage("failed", ["failed"])).toBe("failed");
  });

  it("identifies active stages", () => {
    expect(isActiveStage("testing")).toBe(true);
    expect(isActiveStage("completed")).toBe(false);
    expect(isActiveStage("idle")).toBe(false);
  });
});
