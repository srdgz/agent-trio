import { describe, expect, it } from "vitest";
import { runChecks, sanitizeChecks } from "./checks";
import { SEED_FILES } from "./seed";
import type { TaskCheck, Workspace } from "./types";

const contactPage = (body: string) => `<!doctype html>
<html lang="es"><head><title>Contacto</title></head>
<body><main><h1>Contacto</h1>${body}</main></body></html>`;

const check = (overrides: Partial<TaskCheck>): TaskCheck => ({
  type: "file_exists",
  path: "contacto.html",
  value: null,
  description: "Criterio",
  ...overrides,
});

const failures = (files: Workspace, checks: TaskCheck[] = []) =>
  runChecks(files, checks).filter((item) => !item.passed);

describe("runChecks", () => {
  it("accepts the seed project", () => {
    expect(failures(SEED_FILES)).toEqual([]);
  });

  it("detects a missing file", () => {
    expect(failures(SEED_FILES, [check({})])).toHaveLength(1);
  });

  it("evaluates selectors, text and links", () => {
    const files = {
      ...SEED_FILES,
      "contacto.html": contactPage(
        '<form><label for="email">Email</label><input id="email" type="email"></form><a href="./index.html#top">Inicio</a>',
      ),
    };
    const checks = [
      check({ type: "selector_exists", value: "form input[type=email]" }),
      check({ type: "text_contains", value: "CONTACTO" }),
      check({ type: "links_to", value: "index.html" }),
    ];
    expect(failures(files, checks)).toEqual([]);
  });

  it("flags unlabelled controls and broken references", () => {
    const files = {
      ...SEED_FILES,
      "contacto.html": contactPage('<input id="email"><a href="missing.html">Roto</a>'),
    };
    const [failure] = failures(files);
    expect(failure.detail).toContain("campos sin etiqueta");
    expect(failure.detail).toContain("missing.html");
  });

  it("accepts controls wrapped by a label", () => {
    const files = { ...SEED_FILES, "contacto.html": contactPage("<label>Email <input></label>") };
    expect(failures(files)).toEqual([]);
  });

  it("requires exactly one h1", () => {
    const files = { ...SEED_FILES, "contacto.html": contactPage("<h1>Otro</h1>") };
    expect(failures(files)[0].detail).toContain("un <h1>");
  });
});

describe("sanitizeChecks", () => {
  it("removes unsafe paths and checks without value", () => {
    const result = sanitizeChecks([
      check({ path: "../secret.html" }),
      check({ type: "text_contains", value: null }),
      check({ type: "file_exists" }),
    ]);
    expect(result).toHaveLength(1);
  });
});
