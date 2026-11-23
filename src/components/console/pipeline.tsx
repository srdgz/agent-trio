import type { ProjectStage } from "@/domain/types";

const STEPS = ["Plan", "Develop", "Testing", "Entrega"];

const CURRENT_STEP: Record<ProjectStage, number> = {
  idle: -1,
  queued: -1,
  planning: 0,
  developing: 1,
  fixing: 1,
  testing: 2,
  completed: 4,
  failed: 2,
};

export function Pipeline({ stage }: { stage: ProjectStage }) {
  const current = CURRENT_STEP[stage];

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Progreso del flujo">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const failed = active && stage === "failed";
        const bar = failed ? "bg-danger" : done ? "bg-success" : active ? "pulse-dot bg-accent" : "bg-surface-muted";
        const state = failed ? "detenido" : done ? "completado" : active ? "en curso" : "pendiente";

        return (
          <li key={step} className="min-w-0">
            <span aria-hidden="true" className={`block h-1.5 rounded-sm ${bar}`} />
            <span className={`mt-1 block truncate text-xs ${active ? "font-semibold text-foreground" : "text-muted"}`}>
              {step}
              <span className="sr-only">: {state}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
