export const LIMITS = {
  requestMinLength: 10,
  requestMaxLength: 500,
  maxBatch: 10,
  maxTasks: 4,
  maxChecksPerTask: 6,
  maxAttemptsPerTask: 3,
  maxTransientErrors: 4,
  maxFiles: 16,
  maxFileBytes: 60_000,
  maxWorkspaceBytes: 200_000,
  leaseMs: 130_000,
  modelTimeoutMs: 55_000,
  defaultRetryMs: 15_000,
  maxRetryMs: 60_000,
  draftWriteMs: 900,
} as const;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function maxRunsPerDay() {
  return positiveInteger(process.env.MAX_RUNS_PER_DAY, 30);
}

export function maxParallelRuns() {
  return positiveInteger(process.env.MAX_PARALLEL_RUNS, 3);
}
