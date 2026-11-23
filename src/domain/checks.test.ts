import { describe, expect, it } from "vitest";
import { runChecks, sanitizeChecks } from "./checks";
import { SEED_FILES } from "./seed";
import type { TaskCheck, Workspace } from "./types";

const contactPage = (body: string) => `export default function ContactPage() {
  return (
    <section>
      <h1>Contacto</h1>
      ${body}
    </section>
  );
}
`;

const check = (overrides: Partial<TaskCheck>): TaskCheck => ({
  type: "file_exists",
  path: "app/contacto/page.tsx",
  value: null,
  description: "Criterio",
  ...overrides,
});

const failures = async (files: Workspace, checks: TaskCheck[] = []) =>
  (await runChecks(files, checks)).filter((item) => !item.passed);

const withContact = (body: string): Workspace => ({
  ...SEED_FILES,
  "app/contacto/page.tsx": contactPage(body),
});

describe("runChecks", () => {
  it("accepts the seed project", async () => {
    expect(await failures(SEED_FILES)).toEqual([]);
  });

  it("detects missing files and routes", async () => {
    const result = await failures(SEED_FILES, [check({}), check({ type: "route_exists", value: "/contacto" })]);
    expect(result).toHaveLength(2);
  });

  it("evaluates elements, text and links through imported components", async () => {
    const files: Workspace = {
      ...SEED_FILES,
      "components/contact-form.tsx": `"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />
      <button type="submit">Enviar</button>
      {sent ? <p role="status">Gracias</p> : null}
      <Link href="/servicios">Servicios</Link>
    </form>
  );
}
`,
      "app/contacto/page.tsx": `import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <section>
      <h1>Contacto</h1>
      <ContactForm />
    </section>
  );
}
`,
    };
    const checks = [
      check({ type: "route_exists", value: "/contacto" }),
      check({ type: "element_exists", value: "form" }),
      check({ type: "text_contains", value: "ENVIAR" }),
      check({ type: "links_to", value: "/servicios" }),
    ];
    expect(await failures(files, checks)).toEqual([]);
  });

  it("reports TypeScript errors", async () => {
    const files = withContact("<p>{missingValue}</p>");
    const [failure] = await failures(files);
    expect(failure.label).toBe("Compilación TypeScript");
    expect(failure.detail).toContain("missingValue");
  });

  it("flags unlabelled controls and broken links", async () => {
    const files = {
      ...withContact('<input id="email" /><a href="/missing">Roto</a>'),
    };
    const details = (await failures(files)).map((item) => item.detail).join(" ");
    expect(details).toContain("campos sin etiqueta");
    expect(details).toContain("/missing");
  });

  it("accepts controls wrapped by a label", async () => {
    expect(await failures(withContact("<label>Email <input /></label>"))).toEqual([]);
  });

  it("requires exactly one h1", async () => {
    const [failure] = await failures(withContact("<h1>Otro</h1>"));
    expect(failure.detail).toContain("un <h1>");
  });

  it("rejects dependencies outside the preview runtime", async () => {
    const files = {
      ...SEED_FILES,
      "lib/date.ts": 'import dayjs from "dayjs";\nexport const now = dayjs();\n',
    };
    const details = (await failures(files)).map((item) => item.detail).join(" ");
    expect(details).toContain("dependencia no disponible dayjs");
  });
});

describe("sanitizeChecks", () => {
  it("removes unsafe paths and invalid values", () => {
    const result = sanitizeChecks([
      check({ path: "../secret.tsx" }),
      check({ type: "text_contains", value: null }),
      check({ type: "element_exists", value: "div > a" }),
      check({ type: "links_to", value: "contacto" }),
      check({ type: "file_exists" }),
    ]);
    expect(result).toHaveLength(1);
  });
});
