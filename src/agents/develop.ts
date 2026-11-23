import { z } from "zod";
import type { Workspace } from "@/domain/types";
import { isSafePath } from "@/domain/workspace";
import { UNTRUSTED_DATA_RULE, renderWorkspace } from "./context";
import { streamStructured } from "./model";

const developSchema = z.object({
  notes: z.string().describe("Qué has cambiado, en español y en una o dos frases"),
  files: z
    .array(
      z.object({
        path: z.string().describe("Ruta en minúsculas, por ejemplo app/contacto/page.tsx"),
        content: z.string().describe("Contenido completo del archivo"),
      }),
    )
    .min(1),
});

const SYSTEM = `Eres el agente Develop. Implementas una única tarea en un proyecto Next.js con App Router y TypeScript estricto.

Reglas:
- Devuelve solo los archivos creados o modificados, siempre con su contenido completo.
- Las rutas de archivo empiezan por app/, components/ o lib/, en minúsculas, y terminan en .tsx, .ts o .css.
- Una ruta nueva es app/<ruta>/page.tsx con un componente exportado por defecto y no asíncrono.
- Importa solo react, next, next/link, next/image, next/navigation y módulos locales con el alias @/. No uses CDN, fuentes externas ni peticiones de red.
- Usa Link para la navegación interna. Añade "use client" solo en los componentes con estado o eventos.
- Tipa todas las props y eventos. No uses any.
- Añade los estilos en app/globals.css conservando los existentes y usa className. No uses Tailwind ni CSS Modules.
- El layout ya aporta html, body, cabecera, main y pie. Cada página tiene un único h1 y no añade otro main.
- Todo campo de formulario tiene label con htmlFor, id y autocomplete cuando proceda.
- El diseño funciona desde 320 px, con foco visible y contraste AA.
- Los formularios no envían datos a ningún servidor: valida en cliente y muestra un mensaje accesible.
- Si hay comentarios de Testing, corrige todos sin romper lo que ya funciona.
- Escribe siempre en español el contenido de la web y el campo notes.

${UNTRUSTED_DATA_RULE}`;

function toDraft(partial: unknown): Workspace {
  const files = (partial as { files?: ({ path?: unknown; content?: unknown } | undefined)[] } | undefined)?.files;
  const draft: Workspace = {};
  for (const file of files ?? []) {
    if (typeof file?.path === "string" && typeof file.content === "string" && isSafePath(file.path)) {
      draft[file.path] = file.content;
    }
  }
  return draft;
}

export async function developTask(
  input: {
    request: string;
    title: string;
    description: string;
    criteria: string[];
    feedback: string[];
    files: Workspace;
  },
  onDraft: (draft: Workspace) => void,
) {
  const feedback =
    input.feedback.length > 0
      ? `\n\nFallos que debes corregir:\n<feedback>\n${input.feedback.join("\n")}\n</feedback>`
      : "";

  return streamStructured(
    {
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
    },
    (partial) => onDraft(toDraft(partial)),
  );
}
