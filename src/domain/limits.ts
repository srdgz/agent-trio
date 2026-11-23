export const LIMITS = {
  requestMinLength: 10,
  requestMaxLength: 500,
  maxTasks: 4,
  maxChecksPerTask: 6,
  maxAttemptsPerTask: 3,
  maxTransientErrors: 4,
  maxFiles: 12,
  maxFileBytes: 60_000,
  maxWorkspaceBytes: 200_000,
  leaseMs: 130_000,
  modelTimeoutMs: 55_000,
  defaultRetryMs: 15_000,
  maxRetryMs: 60_000,
} as const;

export function maxRunsPerDay() {
  const parsed = Number(process.env.MAX_RUNS_PER_DAY);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 15;
}
