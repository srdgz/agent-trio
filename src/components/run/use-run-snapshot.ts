"use client";

import { useCallback, useEffect, useState } from "react";
import type { RunSnapshot } from "@/domain/types";

const POLL_MS = 2_000;
const BUSY_WAIT_MS = 3_000;
const NEXT_STEP_WAIT_MS = 300;
const NETWORK_WAIT_MS = 5_000;

type AdvanceResponse =
  | { state: "advanced" }
  | { state: "busy" }
  | { state: "retry"; retryAfterMs: number };

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export function useRunSnapshot(initialSnapshot: RunSnapshot, canAdvance: boolean) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [sessionExpired, setSessionExpired] = useState(false);
  const runId = initialSnapshot.run.id;
  const active = snapshot.run.status === "planning" || snapshot.run.status === "running";

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
      if (response.ok) setSnapshot((await response.json()) as RunSnapshot);
    } catch {
      return;
    }
  }, [runId]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  useEffect(() => {
    if (!active || !canAdvance || sessionExpired) return;
    const controller = new AbortController();
    const { signal } = controller;

    async function loop() {
      while (!signal.aborted) {
        let delay = NEXT_STEP_WAIT_MS;
        try {
          const response = await fetch(`/api/runs/${runId}/advance`, { method: "POST", signal });
          if (response.status === 401) {
            setSessionExpired(true);
            return;
          }
          if (response.ok) {
            const result = (await response.json()) as AdvanceResponse;
            if (result.state === "busy") delay = BUSY_WAIT_MS;
            if (result.state === "retry") delay = result.retryAfterMs + 250;
          } else {
            delay = NETWORK_WAIT_MS;
          }
        } catch {
          if (signal.aborted) return;
          delay = NETWORK_WAIT_MS;
        }
        await refresh();
        await wait(delay, signal);
      }
    }

    void loop();
    return () => controller.abort();
  }, [active, canAdvance, sessionExpired, refresh, runId]);

  return { snapshot, active, sessionExpired };
}
