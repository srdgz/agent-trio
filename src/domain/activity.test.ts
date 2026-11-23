import { describe, expect, it } from "vitest";
import { activeAgent, agentActivity } from "./activity";

describe("activeAgent", () => {
  it("follows the task lifecycle", () => {
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
