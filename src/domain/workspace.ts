import { LIMITS } from "./limits";
import type { Workspace } from "./types";

const SAFE_PATH = /^(app|components|lib)(\/[a-z0-9-]+)*\/[a-z0-9-]+\.(tsx|ts|css)$/;
const PAGE_PATH = /^app(?:\/([a-z0-9-]+(?:\/[a-z0-9-]+)*))?\/page\.tsx$/;
const encoder = new TextEncoder();

export type FileChange = { path: string; content: string };

export class WorkspaceError extends Error {}

export function isSafePath(path: string) {
  return SAFE_PATH.test(path);
}

function byteLength(value: string) {
  return encoder.encode(value).length;
}

export function applyChanges(files: Workspace, changes: FileChange[]): Workspace {
  if (changes.length === 0) {
    throw new WorkspaceError("Develop no ha entregado ningún archivo.");
  }
  const next = { ...files };
  for (const { path, content } of changes) {
    if (!isSafePath(path)) throw new WorkspaceError(`Ruta no permitida: ${path}`);
    if (byteLength(content) > LIMITS.maxFileBytes) {
      throw new WorkspaceError(`El archivo ${path} supera el tamaño máximo.`);
    }
    next[path] = content;
  }
  if (Object.keys(next).length > LIMITS.maxFiles) {
    throw new WorkspaceError("El proyecto supera el número máximo de archivos.");
  }
  const total = Object.values(next).reduce((sum, value) => sum + byteLength(value), 0);
  if (total > LIMITS.maxWorkspaceBytes) {
    throw new WorkspaceError("El proyecto supera el tamaño máximo.");
  }
  return next;
}

export function routeFromPagePath(path: string) {
  const match = PAGE_PATH.exec(path);
  if (!match) return null;
  return match[1] ? `/${match[1]}` : "/";
}

export function pagePathFromRoute(route: string) {
  return route === "/" ? "app/page.tsx" : `app${route}/page.tsx`;
}

export function listRoutes(files: Workspace) {
  return Object.keys(files)
    .map(routeFromPagePath)
    .filter((route): route is string => route !== null)
    .sort();
}

export function resolveInternalRoute(fromRoute: string, href: string): string | null {
  const value = href.trim();
  if (!value || value.startsWith("#")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return null;
  const base = fromRoute.endsWith("/") ? fromRoute : `${fromRoute}/`;
  const pathname = new URL(value, `https://site.invalid${base}`).pathname;
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : "/";
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
