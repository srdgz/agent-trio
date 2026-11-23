import { LIMITS } from "./limits";
import type { Workspace } from "./types";

const SAFE_PATH = /^[a-z0-9-]+(\/[a-z0-9-]+)*\.(html|css|js)$/;

export type FileChange = { path: string; content: string };

export class WorkspaceError extends Error {}

export function isSafePath(path: string) {
  return SAFE_PATH.test(path);
}

export function applyChanges(files: Workspace, changes: FileChange[]): Workspace {
  if (changes.length === 0) {
    throw new WorkspaceError("Develop no ha entregado ningún archivo.");
  }
  const next = { ...files };
  for (const { path, content } of changes) {
    if (!isSafePath(path)) throw new WorkspaceError(`Ruta no permitida: ${path}`);
    if (Buffer.byteLength(content) > LIMITS.maxFileBytes) {
      throw new WorkspaceError(`El archivo ${path} supera el tamaño máximo.`);
    }
    next[path] = content;
  }
  if (Object.keys(next).length > LIMITS.maxFiles) {
    throw new WorkspaceError("El proyecto supera el número máximo de archivos.");
  }
  const total = Object.values(next).reduce((sum, value) => sum + Buffer.byteLength(value), 0);
  if (total > LIMITS.maxWorkspaceBytes) {
    throw new WorkspaceError("El proyecto supera el tamaño máximo.");
  }
  return next;
}

export function resolveInternalPath(fromPath: string, href: string): string | null {
  const value = href.trim();
  if (!value || value.startsWith("#")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return null;
  const url = new URL(value, `https://site.invalid/${fromPath}`);
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!pathname) return "index.html";
  return pathname.endsWith("/") ? `${pathname}index.html` : pathname;
}

export function changedFiles(base: Workspace, current: Workspace) {
  return Object.keys(current)
    .sort()
    .map((path) => ({
      path,
      change: !(path in base)
        ? ("added" as const)
        : base[path] === current[path]
          ? ("unchanged" as const)
          : ("modified" as const),
    }));
}
