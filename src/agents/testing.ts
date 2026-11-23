import { z } from "zod";
import { runChecks } from "@/domain/checks";
import type { CheckResult, TaskCheck, Workspace } from "@/domain/types";
import { UNTRUSTED_DATA_RULE, renderWorkspace } from "./context";
import { generateStructured } from "./model";

const reviewSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()).describe("Fallos concretos y accionables. Vacío si pasa"),
});

const SYSTEM = `Eres el agente Testing. Las comprobaciones automáticas ya han pasado. Revisas si el código cumple la tarea.

Reglas:
- Rechaza solo por fallos reales: requisito ausente, JavaScript roto, HTML inválido, formulario inutilizable o problema claro de accesibilidad o diseño responsive.
- No rechaces por preferencias de estilo ni mejoras opcionales.
- Cada fallo indica archivo, problema y corrección esperada.

${UNTRUSTED_DATA_RULE}`;

export type TestOutcome = {
  passed: boolean;
  results: CheckResult[];
  feedback: string[];
  tokens: number;
  usedFallback: boolean;
};

export async function testTask(input: {
  title: string;
  description: string;
  checks: TaskCheck[];
  files: Workspace;
}): Promise<TestOutcome> {
  const results = runChecks(input.files, input.checks);
  const failed = results.filter((item) => !item.passed);

  if (failed.length > 0) {
    return {
      passed: false,
      results,
      feedback: failed.map((item) => `${item.label}: ${item.detail}`),
      tokens: 0,
      usedFallback: false,
    };
  }

  const { data, tokens, usedFallback } = await generateStructured({
    agent: "testing",
    system: SYSTEM,
    prompt: `Tarea: ${input.title}
${input.description}

Proyecto:
${renderWorkspace(input.files)}`,
    schema: reviewSchema,
  });

  const issues = data.issues.filter((issue) => issue.trim().length > 0);
  const passed = data.passed && issues.length === 0;
  const feedback = passed ? [] : issues.length > 0 ? issues : ["La revisión no ha aprobado la tarea."];

  return {
    passed,
    results: [
      ...results,
      { label: "Revisión del código", passed, detail: passed ? null : feedback.join(" ") },
    ],
    feedback,
    tokens,
    usedFallback,
  };
}
