"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PortfolioSnapshot } from "@/domain/types";

const ACTIVE_POLL_MS = 2_000;
const IDLE_POLL_MS = 8_000;
const NEXT_STEP_MS = 150;
const IDLE_WAIT_MS = 1_500;
const ERROR_WAIT_MS = 5_000;
const MAX_RETRY_WAIT_MS = 5_000;

type TickResponse = { state: "advanced" } | { state: "idle" } | { state: "retry"; retryAfterMs: number };

type EngineValue = {
  portfolio: PortfolioSnapshot;
  hasWork: boolean;
  refresh: () => Promise<void>;
};

const EngineContext = createContext<EngineValue | null>(null);

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

export function EngineProvider({ initial, children }: { initial: PortfolioSnapshot; children: ReactNode }) {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(initial);
  const hasWork = portfolio.stats.executing + portfolio.stats.queued > 0;
  const slots = portfolio.stats.maxParallel;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/portfolio", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.ok) setPortfolio((await response.json()) as PortfolioSnapshot);
    } catch {
      return;
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, hasWork ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    return () => clearInterval(timer);
  }, [hasWork, refresh]);

  useEffect(() => {
    if (!hasWork) return;
    const controller = new AbortController();
    const { signal } = controller;

    async function worker() {
      while (!signal.aborted) {
        let delay = NEXT_STEP_MS;
        try {
          const response = await fetch("/api/engine/tick", { method: "POST", signal });
          if (response.status === 401) {
            router.replace("/login");
            return;
          }
          if (!response.ok) {
            delay = ERROR_WAIT_MS;
          } else {
            const result = (await response.json()) as TickResponse;
            if (result.state === "idle") delay = IDLE_WAIT_MS;
            if (result.state === "retry") delay = Math.min(result.retryAfterMs, MAX_RETRY_WAIT_MS);
            if (result.state === "advanced") await refresh();
          }
        } catch {
          if (signal.aborted) return;
          delay = ERROR_WAIT_MS;
        }
        await wait(delay, signal);
      }
    }

    for (let index = 0; index < slots; index += 1) void worker();
    return () => controller.abort();
  }, [hasWork, slots, refresh, router]);

  const value = useMemo(() => ({ portfolio, hasWork, refresh }), [portfolio, hasWork, refresh]);
  return <EngineContext value={value}>{children}</EngineContext>;
}

export function useEngine() {
  const value = useContext(EngineContext);
  if (!value) throw new Error("useEngine must be used inside EngineProvider");
  return value;
}
