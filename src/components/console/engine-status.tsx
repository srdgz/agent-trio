"use client";

import { useEngine } from "./engine-provider";

export function EngineStatus() {
  const { portfolio, hasWork } = useEngine();
  const { executing, queued, maxParallel } = portfolio.stats;
  const text = hasWork ? `${executing} de ${maxParallel} en ejecución, ${queued} en cola` : "Motor en espera";

  return (
    <p role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${hasWork ? "pulse-dot bg-accent" : "bg-control"}`}
      />
      {text}
    </p>
  );
}
