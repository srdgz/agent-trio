import type { AgentActivity, AgentId, ProjectStage, RunStatus, TaskStatus } from "./types";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const AGENT_INFO: Record<
  AgentId,
  { name: string; short: string; provider: string; role: string; icon: "route" | "code" | "flask" }
> = {
  orchestrator: {
    name: "Orquestador",
    short: "ORQ",
    provider: "Gemini",
    role: "Divide la petición y reparte las tareas.",
    icon: "route",
  },
  develop: {
    name: "Develop",
    short: "DEV",
    provider: "Groq",
    role: "Implementa cada tarea en Next.js y TypeScript.",
    icon: "code",
  },
  testing: {
    name: "Testing",
    short: "TEST",
    provider: "OpenRouter",
    role: "Compila, comprueba y devuelve los fallos.",
    icon: "flask",
  },
};

export const RUN_STATUS_INFO: Record<RunStatus, { label: string; tone: Tone }> = {
  queued: { label: "En cola", tone: "neutral" },
  planning: { label: "Planificando", tone: "accent" },
  running: { label: "En curso", tone: "accent" },
  completed: { label: "Completada", tone: "success" },
  failed: { label: "Bloqueada", tone: "danger" },
};

export const STAGE_INFO: Record<ProjectStage, { label: string; tone: Tone }> = {
  idle: { label: "Sin actividad", tone: "neutral" },
  queued: { label: "En cola", tone: "neutral" },
  planning: { label: "Planificando", tone: "accent" },
  developing: { label: "Desarrollando", tone: "accent" },
  fixing: { label: "Corrigiendo", tone: "warning" },
  testing: { label: "Probando", tone: "accent" },
  completed: { label: "Entregado", tone: "success" },
  failed: { label: "Bloqueado", tone: "danger" },
};

export const TASK_STATUS_INFO: Record<TaskStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendiente", tone: "neutral" },
  in_progress: { label: "En desarrollo", tone: "accent" },
  in_review: { label: "En pruebas", tone: "accent" },
  changes_requested: { label: "Con fallos", tone: "warning" },
  done: { label: "Superada", tone: "success" },
  failed: { label: "Fallida", tone: "danger" },
};

export const ACTIVITY_INFO: Record<AgentActivity, { label: string; tone: Tone }> = {
  idle: { label: "En espera", tone: "neutral" },
  working: { label: "Trabajando", tone: "accent" },
  done: { label: "Terminado", tone: "success" },
  blocked: { label: "Detenido", tone: "danger" },
};
