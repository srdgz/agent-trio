"use client";

import { useCallback, useEffect, useState } from "react";
import { useEngine } from "@/components/console/engine-provider";
import { isActiveStage } from "@/domain/activity";
import type { ProjectDetail } from "@/domain/types";

const LIVE_POLL_MS = 1_000;

export function useProjectDetail(initial: ProjectDetail) {
  const { portfolio } = useEngine();
  const [detail, setDetail] = useState(initial);
  const [runId, setRunId] = useState<string | null>(null);
  const projectId = initial.project.id;
  const row = portfolio.projects.find((project) => project.id === projectId);
  const live = row ? isActiveStage(row.stage) : false;
  const liveKey = `${row?.stage}:${row?.tasksDone}:${row?.updatedAt}`;

  const load = useCallback(
    async (selectedRun: string | null) => {
      const query = selectedRun ? `?run=${selectedRun}` : "";
      try {
        const response = await fetch(`/api/projects/${projectId}${query}`, { cache: "no-store" });
        if (response.ok) setDetail((await response.json()) as ProjectDetail);
      } catch {
        return;
      }
    },
    [projectId],
  );

  useEffect(() => {
    const timeout = setTimeout(() => void load(runId), 0);
    return () => clearTimeout(timeout);
  }, [load, runId, liveKey]);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      if (!document.hidden) void load(runId);
    }, LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [live, load, runId]);

  return { detail, live, stage: row?.stage ?? "idle", selectRun: setRunId } as const;
}
