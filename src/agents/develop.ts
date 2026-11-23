import { z } from "zod";
import type { Workspace } from "@/domain/types";
import { UNTRUSTED_DATA_RULE, renderWorkspace } from "./context";
import { generateStructured } from "./model";

const developSchema = z.object({
  notes: z.string().describe("Qué has cambiado, en una o dos frases"),
  files: z
    .array(
      z.object({
        path: z.string().describe("Ruta en minúsculas, por ejemplo contacto.html"),
        content: z.string().describe("Contenido completo del archivo"),
      }),
    )
    .min(1),
});

const SYSTEM = `Eres el agente Develop. Implementas una única tarea en una web estática.

Reglas:
- Devuelve solo los archivos creados o modificados, siempre con su contenido completo.
- Usa solo HTML, CSS y JavaScript sin dependencias, CDN, fuentes externas ni peticiones de red.
- Respeta el diseño, la estructura de cabecera y pie, y styles.css.
- Cada página tiene lang, title, main y un único h1.
- Todo campo de formulario tiene label asociado, nombre accesible y autocomplete cuando proceda.
- El diseño funciona desde 320 px, con foco visible y contraste AA.
- Los formularios no envían datos a ningún servidor: valida en cliente y muestra un mensaje accesible.
- Si hay comentarios de Testing, corrige todos sin romper lo que ya funciona.

${UNTRUSTED_DATA_RULE}`;

export async function developTask(input: {
  request: string;
  title: string;
  description: string;
  criteria: string[];
  feedback: string[];
  files: Workspace;
}) {
  const feedback =
    input.feedback.length > 0
      ? `\n\nFallos que debes corregir:\n<feedback>\n${input.feedback.join("\n")}\n</feedback>`
      : "";

  return generateStructured({
    agent: "develop",
    system: SYSTEM,
    prompt: `Petición original: <request>${input.request}</request>

Tarea: ${input.title}
${input.description}

Criterios de aceptación:
${input.criteria.map((criterion) => `- ${criterion}`).join("\n")}${feedback}

Proyecto actual:
${renderWorkspace(input.files)}`,
    schema: developSchema,
  });
}
