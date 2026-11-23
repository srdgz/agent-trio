import ts from "typescript";
import { LIMITS } from "./limits";
import { typecheckWorkspace } from "./typecheck";
import type { CheckResult, TaskCheck, Workspace } from "./types";
import { isSafePath, listRoutes, resolveInternalRoute, routeFromPagePath } from "./workspace";

const ALLOWED_PACKAGES = new Set(["react", "next", "next/link", "next/image", "next/navigation"]);
const LABELLED_TAGS = new Set(["input", "select", "textarea"]);
const UNLABELLED_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);

type JsxTag = {
  name: string;
  attributes: Map<string, string | true>;
  ancestors: string[];
};

type ParsedFile = {
  tags: JsxTag[];
  imports: string[];
  hrefs: string[];
  text: string;
  hasDefaultExport: boolean;
  isAsyncDefault: boolean;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("es").replace(/\s+/g, " ").trim();
}

function result(label: string, failures: string[]): CheckResult {
  return {
    label,
    passed: failures.length === 0,
    detail: failures.length > 0 ? failures.join(" ") : null,
  };
}

function attributeValue(attribute: ts.JsxAttribute): string | true {
  const initializer = attribute.initializer;
  if (!initializer) return true;
  if (ts.isStringLiteral(initializer)) return initializer.text;
  if (ts.isJsxExpression(initializer) && initializer.expression) {
    const expression = initializer.expression;
    if (ts.isStringLiteralLike(expression)) return expression.text;
  }
  return true;
}

function readTag(node: ts.JsxOpeningLikeElement, ancestors: string[]): JsxTag {
  const attributes = new Map<string, string | true>();
  for (const property of node.attributes.properties) {
    if (ts.isJsxAttribute(property)) attributes.set(property.name.getText(), attributeValue(property));
  }
  return { name: node.tagName.getText(), attributes, ancestors };
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
  return ts.canHaveModifiers(node) && (ts.getModifiers(node)?.some((item) => item.kind === kind) ?? false);
}

function parseFile(path: string, source: string): ParsedFile {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const parsed: ParsedFile = { tags: [], imports: [], hrefs: [], text: "", hasDefaultExport: false, isAsyncDefault: false };
  const textParts: string[] = [];

  function visit(node: ts.Node, ancestors: string[]) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      parsed.imports.push(node.moduleSpecifier.text);
    }
    if (ts.isExportAssignment(node) && !node.isExportEquals) parsed.hasDefaultExport = true;
    if (ts.isFunctionDeclaration(node) && hasModifier(node, ts.SyntaxKind.DefaultKeyword)) {
      parsed.hasDefaultExport = true;
      parsed.isAsyncDefault = hasModifier(node, ts.SyntaxKind.AsyncKeyword);
    }
    if (ts.isJsxText(node)) textParts.push(node.text);
    if (ts.isStringLiteralLike(node) && !ts.isImportDeclaration(node.parent)) textParts.push(node.text);
    if (ts.isPropertyAssignment(node) && node.name.getText() === "href" && ts.isStringLiteralLike(node.initializer)) {
      parsed.hrefs.push(node.initializer.text);
    }

    if (ts.isJsxSelfClosingElement(node)) {
      parsed.tags.push(readTag(node, ancestors));
    } else if (ts.isJsxElement(node)) {
      const tag = readTag(node.openingElement, ancestors);
      parsed.tags.push(tag);
      const nested = [...ancestors, tag.name];
      node.children.forEach((child) => visit(child, nested));
      node.openingElement.attributes.properties.forEach((property) => visit(property, ancestors));
      return;
    }
    ts.forEachChild(node, (child) => visit(child, ancestors));
  }

  visit(file, []);
  parsed.text = normalize(textParts.join(" "));
  for (const tag of parsed.tags) {
    const href = tag.attributes.get("href");
    if ((tag.name === "Link" || tag.name === "a") && typeof href === "string") parsed.hrefs.push(href);
  }
  return parsed;
}

function resolveLocalImport(files: Workspace, from: string, specifier: string) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const base = specifier.startsWith("@/")
    ? specifier.slice(2)
    : new URL(specifier, `https://workspace.invalid/${from}`).pathname.slice(1);
  return [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`].find((path) => path in files) ?? null;
}

function layoutsFor(files: Workspace, page: string) {
  const segments = page.split("/").slice(0, -1);
  return segments
    .map((_, index) => `${segments.slice(0, index + 1).join("/")}/layout.tsx`)
    .filter((path) => path in files);
}

function reachableFiles(files: Workspace, entries: string[]) {
  const seen = new Set<string>();
  const pending = [...entries];
  while (pending.length > 0) {
    const path = pending.pop()!;
    if (seen.has(path) || !(path in files) || path.endsWith(".css")) continue;
    seen.add(path);
    for (const specifier of parseFile(path, files[path]).imports) {
      const target = resolveLocalImport(files, path, specifier);
      if (target) pending.push(target);
    }
  }
  return [...seen].map((path) => parseFile(path, files[path]));
}

function renderedFiles(files: Workspace, path: string) {
  const entries = routeFromPagePath(path) ? [path, ...layoutsFor(files, path)] : [path];
  return reachableFiles(files, entries);
}

export function sanitizeChecks(checks: TaskCheck[]) {
  return checks
    .filter((check) => {
      if (!isSafePath(check.path)) return false;
      if (check.type === "file_exists") return true;
      const value = check.value?.trim();
      if (!value) return false;
      if (check.type === "route_exists" || check.type === "links_to") return value.startsWith("/");
      return check.type === "element_exists" ? /^[A-Za-z][A-Za-z0-9]*$/.test(value) : true;
    })
    .slice(0, LIMITS.maxChecksPerTask);
}

function runTaskCheck(files: Workspace, check: TaskCheck): CheckResult {
  const value = check.value ?? "";
  if (check.type === "route_exists") {
    const found = listRoutes(files).includes(value);
    return result(check.description, found ? [] : [`No existe la ruta ${value}.`]);
  }
  if (!(check.path in files)) {
    return result(check.description, [`No existe el archivo ${check.path}.`]);
  }
  if (check.type === "file_exists") return result(check.description, []);

  const rendered = renderedFiles(files, check.path);
  if (check.type === "element_exists") {
    const found = rendered.some((file) => file.tags.some((tag) => tag.name === value));
    return result(check.description, found ? [] : [`Falta <${value}> en ${check.path}.`]);
  }
  if (check.type === "text_contains") {
    const found = rendered.some((file) => file.text.includes(normalize(value)));
    return result(check.description, found ? [] : [`Falta el texto «${value}» en ${check.path}.`]);
  }
  const route = routeFromPagePath(check.path) ?? "/";
  const found = rendered.some((file) => file.hrefs.some((href) => resolveInternalRoute(route, href) === value));
  return result(check.description, found ? [] : [`${check.path} no enlaza con ${value}.`]);
}

function auditFile(path: string, parsed: ParsedFile) {
  const failures: string[] = [];
  const labelTargets = new Set(
    parsed.tags
      .filter((tag) => tag.name === "label")
      .map((tag) => tag.attributes.get("htmlFor"))
      .filter((value): value is string => typeof value === "string"),
  );

  const unlabelled = parsed.tags.filter((tag) => {
    if (!LABELLED_TAGS.has(tag.name)) return false;
    const type = tag.attributes.get("type");
    if (typeof type === "string" && UNLABELLED_INPUT_TYPES.has(type)) return false;
    if (tag.attributes.has("aria-label") || tag.attributes.has("aria-labelledby")) return false;
    if (tag.ancestors.includes("label")) return false;
    const id = tag.attributes.get("id");
    return id === undefined || (typeof id === "string" && !labelTargets.has(id));
  });
  if (unlabelled.length > 0) failures.push(`${path}: hay ${unlabelled.length} campos sin etiqueta.`);

  if (parsed.tags.some((tag) => ["img", "Image"].includes(tag.name) && !tag.attributes.has("alt"))) {
    failures.push(`${path}: hay imágenes sin alt.`);
  }
  for (const specifier of parsed.imports) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".") && !ALLOWED_PACKAGES.has(specifier)) {
      failures.push(`${path}: dependencia no disponible ${specifier}.`);
    }
  }
  return failures;
}

function auditRoute(files: Workspace, page: string) {
  const route = routeFromPagePath(page) ?? "/";
  const routes = new Set(listRoutes(files));
  const pageFile = parseFile(page, files[page]);
  const rendered = renderedFiles(files, page);
  const failures: string[] = [];

  if (!pageFile.hasDefaultExport) failures.push("La página no tiene export default.");
  if (pageFile.isAsyncDefault) failures.push("La página no puede ser asíncrona.");

  const allTags = rendered.flatMap((file) => file.tags);
  const headings = allTags.filter((tag) => tag.name === "h1").length;
  if (headings !== 1) failures.push(`Debe haber un <h1> y hay ${headings}.`);
  if (!allTags.some((tag) => tag.name === "main")) failures.push("Falta <main>.");
  if (!allTags.some((tag) => tag.name === "html" && tag.attributes.has("lang"))) failures.push("Falta lang en <html>.");

  for (const href of rendered.flatMap((file) => file.hrefs)) {
    const target = resolveInternalRoute(route, href);
    if (target && !routes.has(target)) failures.push(`Enlace roto a ${target}.`);
  }
  return result(`Calidad de la ruta ${route}`, [...new Set(failures)]);
}

function auditProject(files: Workspace) {
  const failures: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    if (/\.tsx?$/.test(path)) failures.push(...auditFile(path, parseFile(path, source)));
    if (!path.endsWith(".tsx") && !path.endsWith(".ts")) continue;
    for (const specifier of parseFile(path, source).imports) {
      if (specifier.endsWith(".css") && !resolveLocalImport(files, path, specifier)) {
        failures.push(`${path}: no existe ${specifier}.`);
      }
    }
  }
  if (!("app/layout.tsx" in files)) failures.push("Falta app/layout.tsx.");
  return result("Componentes y dependencias", failures);
}

export async function runChecks(files: Workspace, checks: TaskCheck[]): Promise<CheckResult[]> {
  const taskResults = checks.map((check) => runTaskCheck(files, check));
  const routeResults = Object.keys(files)
    .filter((path) => routeFromPagePath(path))
    .map((page) => auditRoute(files, page));
  const diagnostics = await typecheckWorkspace(files);
  return [
    ...taskResults,
    ...routeResults,
    auditProject(files),
    result("Compilación TypeScript", diagnostics),
  ];
}
