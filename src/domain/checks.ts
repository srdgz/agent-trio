import { parse, type HTMLElement } from "node-html-parser";
import { LIMITS } from "./limits";
import { isSafePath, resolveInternalPath } from "./workspace";
import type { CheckResult, TaskCheck, Workspace } from "./types";

const LABELLED_CONTROLS = "input, select, textarea";
const UNLABELLED_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);

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

function canParseSelector(selector: string) {
  try {
    parse("<div></div>").querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeChecks(checks: TaskCheck[]) {
  return checks
    .filter((check) => {
      if (!isSafePath(check.path)) return false;
      if (check.type === "file_exists") return true;
      if (!check.path.endsWith(".html") || !check.value?.trim()) return false;
      return check.type === "selector_exists" ? canParseSelector(check.value) : true;
    })
    .slice(0, LIMITS.maxChecksPerTask);
}

function linksTo(root: HTMLElement, fromPath: string, target: string) {
  return root
    .querySelectorAll("a[href]")
    .some((link) => resolveInternalPath(fromPath, link.getAttribute("href") ?? "") === target);
}

function runTaskCheck(files: Workspace, check: TaskCheck): CheckResult {
  const source = files[check.path];
  if (source === undefined) {
    return result(check.description, [`No existe el archivo ${check.path}.`]);
  }
  if (check.type === "file_exists") return result(check.description, []);

  const root = parse(source);
  const value = check.value ?? "";
  if (check.type === "selector_exists") {
    const found = root.querySelector(value) !== null;
    return result(check.description, found ? [] : [`Falta «${value}» en ${check.path}.`]);
  }
  if (check.type === "text_contains") {
    const found = normalize(root.textContent).includes(normalize(value));
    return result(check.description, found ? [] : [`Falta el texto «${value}» en ${check.path}.`]);
  }
  const found = linksTo(root, check.path, value);
  return result(check.description, found ? [] : [`${check.path} no enlaza con ${value}.`]);
}

function hasAccessibleLabel(root: HTMLElement, control: HTMLElement) {
  if (control.getAttribute("aria-label")?.trim()) return true;
  if (control.getAttribute("aria-labelledby")?.trim()) return true;
  const id = control.getAttribute("id");
  if (id && root.querySelectorAll("label").some((label) => label.getAttribute("for") === id)) {
    return true;
  }
  let parent = control.parentNode;
  while (parent) {
    if (parent.rawTagName?.toLowerCase() === "label") return true;
    parent = parent.parentNode;
  }
  return false;
}

function auditPage(path: string, source: string, files: Workspace) {
  const root = parse(source);
  const failures: string[] = [];

  if (!root.querySelector("html")?.getAttribute("lang")) failures.push("Falta lang en <html>.");
  if (!root.querySelector("title")?.textContent.trim()) failures.push("Falta <title>.");
  if (!root.querySelector("main")) failures.push("Falta <main>.");

  const headings = root.querySelectorAll("h1").length;
  if (headings !== 1) failures.push(`Debe haber un <h1> y hay ${headings}.`);

  if (root.querySelectorAll("img").some((image) => image.getAttribute("alt") === undefined)) {
    failures.push("Hay imágenes sin alt.");
  }

  const unlabelled = root.querySelectorAll(LABELLED_CONTROLS).filter((control) => {
    const type = control.getAttribute("type")?.toLowerCase() ?? "text";
    return !UNLABELLED_INPUT_TYPES.has(type) && !hasAccessibleLabel(root, control);
  });
  if (unlabelled.length > 0) failures.push(`Hay ${unlabelled.length} campos sin etiqueta.`);

  const references = [
    ...root.querySelectorAll("a[href]").map((node) => node.getAttribute("href")),
    ...root.querySelectorAll("link[rel=stylesheet]").map((node) => node.getAttribute("href")),
    ...root.querySelectorAll("script[src]").map((node) => node.getAttribute("src")),
  ];
  for (const reference of references) {
    const target = reference ? resolveInternalPath(path, reference) : null;
    if (target && !(target in files)) failures.push(`Referencia rota a ${target}.`);
  }

  return result(`Calidad de ${path}`, failures);
}

export function runChecks(files: Workspace, checks: TaskCheck[]): CheckResult[] {
  const taskResults = checks.map((check) => runTaskCheck(files, check));
  const pageResults = Object.entries(files)
    .filter(([path]) => path.endsWith(".html"))
    .map(([path, source]) => auditPage(path, source, files));
  return [...taskResults, ...pageResults];
}
