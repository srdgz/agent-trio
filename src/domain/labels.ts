import type { AgentActivity, AgentId, RunStatus, TaskStatus } from "./types";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const AGENT_INFO: Record<
  AgentId,
  { name: string; provider: string; role: string; icon: "route" | "code" | "flask"; avatar: string }
> = {
  orchestrator: {
    name: "Orquestador",
    provider: "Gemini",
    role: "Divide la petición y reparte las tareas.",
    icon: "route",
    avatar: "bg-accent-soft text-on-accent-soft",
  },
  develop: {
    name: "Develop",
    provider: "Groq",
    role: "Implementa cada tarea en Next.js y TypeScript.",
    icon: "code",
    avatar: "bg-violet-soft text-violet",
  },
  testing: {
    name: "Testing",
    provider: "OpenRouter",
    role: "Compila, comprueba y devuelve los fallos.",
    icon: "flask",
    avatar: "bg-success-soft text-success",
  },
};

export const RUN_STATUS_INFO: Record<RunStatus, { label: string; tone: Tone }> = {
  planning: { label: "Planificando", tone: "accent" },
  running: { label: "En curso", tone: "accent" },
  completed: { label: "Completada", tone: "success" },
  failed: { label: "Fallida", tone: "danger" },
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
