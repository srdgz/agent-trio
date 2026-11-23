import { z } from "zod";
import { sanitizeChecks } from "@/domain/checks";
import { LIMITS } from "@/domain/limits";
import { CHECK_TYPES, type TaskCheck, type Workspace } from "@/domain/types";
import { UNTRUSTED_DATA_RULE, renderWorkspace } from "./context";
import { generateStructured } from "./model";

const planSchema = z.object({
  summary: z.string().describe("Resumen del plan en una frase"),
  tasks: z
    .array(
      z.object({
        title: z.string().describe("Título breve en imperativo"),
        description: z.string().describe("Qué debe hacer Develop, con archivos concretos"),
        checks: z
          .array(
            z.object({
              type: z.enum(CHECK_TYPES),
              path: z.string().describe("Archivo a comprobar"),
              value: z
                .string()
                .nullable()
                .describe("Ruta web, etiqueta JSX o texto. Null en file_exists"),
              description: z.string().describe("Criterio legible para una persona"),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const SYSTEM = `Eres el agente Orquestador de un equipo de desarrollo web. Divides una petición en tareas pequeñas, ordenadas y verificables para los agentes Develop y Testing.

Reglas:
- Crea entre 1 y ${LIMITS.maxTasks} tareas. Usa las mínimas necesarias.
- El proyecto es Next.js con App Router y TypeScript. Las páginas están en app/<ruta>/page.tsx, los componentes en components/ y los estilos en app/globals.css. No hay backend ni dependencias nuevas.
- Cada tarea tiene de 1 a ${LIMITS.maxChecksPerTask} comprobaciones objetivas.
- Tipos: file_exists con la ruta del archivo; route_exists con la ruta web en value, por ejemplo /contacto; element_exists con una etiqueta JSX en value, por ejemplo form; text_contains con un texto exacto; links_to con la ruta web destino en value.
- En path indica siempre un archivo .tsx, .ts o .css existente al terminar la tarea. Si es una página, se comprueban también sus componentes y su layout.
- Las comprobaciones deben ser alcanzables al terminar esa tarea, sin depender de tareas posteriores.
- La navegación principal está en components/site-header.tsx.
- Escribe en español.

${UNTRUSTED_DATA_RULE}`;

export type PlannedTask = {
  title: string;
  description: string;
  checks: TaskCheck[];
};

export async function planTasks(request: string, files: Workspace) {
  const { data, tokens, usedFallback } = await generateStructured({
    agent: "orchestrator",
    system: SYSTEM,
    prompt: `<request>${request}</request>\n\nProyecto actual:\n${renderWorkspace(files)}`,
    schema: planSchema,
  });

  const tasks: PlannedTask[] = data.tasks.slice(0, LIMITS.maxTasks).map((task) => ({
    title: task.title,
    description: task.description,
    checks: sanitizeChecks(task.checks),
  }));

  return { summary: data.summary, tasks, tokens, usedFallback };
}
