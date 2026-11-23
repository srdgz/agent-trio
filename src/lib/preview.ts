import type { Workspace } from "@/domain/types";

export const PREVIEW_MESSAGE = "agent-trio-preview-navigate";

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

function serialize(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
}

export function buildPreview(files: Workspace, route: string, origin: string) {
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    `script-src 'unsafe-inline' 'unsafe-eval' ${origin}`,
    "img-src data:",
    "font-src data:",
    "form-action 'none'",
    "base-uri 'none'",
  ].join("; ");
  const data = serialize({ files, route, message: PREVIEW_MESSAGE });

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vista previa ${route}</title>
<style>body{margin:0}</style>
</head>
<body>
<div id="root"></div>
<script>window.__PREVIEW__=${data};</script>
<script src="${origin}/preview-runtime.js"></script>
</body>
</html>`;
}
