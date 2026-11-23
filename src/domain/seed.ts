import { PROJECT_KINDS, type ProjectKind } from "./portfolio";
import type { Workspace } from "./types";

const STYLES = `:root { --ink: #1f2933; --paper: #f5f7fa; --accent: #1f5f8b; --line: #d5dce4; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: var(--paper); font-family: system-ui, sans-serif; line-height: 1.5; }
a { color: var(--accent); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.site { min-height: 100dvh; display: flex; flex-direction: column; }
.site-main { flex: 1; width: min(100% - 2rem, 60rem); margin-inline: auto; padding-block: 1.5rem; }
.site-header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; padding: .75rem 1rem; background: #fff; border-bottom: 1px solid var(--line); }
.site-header ul { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.brand { font-weight: 700; text-decoration: none; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(10rem, 100%), 1fr)); gap: .75rem; padding: 0; list-style: none; }
.stats li { padding: 1rem; background: #fff; border: 1px solid var(--line); border-radius: .5rem; }
.stats strong { display: block; font-size: 1.5rem; }
.table-wrap { overflow-x: auto; background: #fff; border: 1px solid var(--line); border-radius: .5rem; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: .625rem .75rem; text-align: left; border-bottom: 1px solid var(--line); }
`;

export function buildProjectFiles(clientName: string, project: ProjectKind): Workspace {
  const route = `/${project.slug}`;

  return {
    "app/layout.tsx": `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = { title: ${JSON.stringify(`${project.kind} | ${clientName}`)} };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="site">
        <SiteHeader />
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
`,
    "app/page.tsx": `import Link from "next/link";
import { records } from "@/lib/data";

export default function DashboardPage() {
  return (
    <section>
      <h1>Panel de ${project.kind}</h1>
      <ul className="stats">
        <li>
          <strong>{records.length}</strong> ${project.entity.toLowerCase()}
        </li>
      </ul>
      <Link href="${route}">Ver ${project.entity.toLowerCase()}</Link>
    </section>
  );
}
`,
    [`app/${project.slug}/page.tsx`]: `import { records } from "@/lib/data";

export default function RecordsPage() {
  return (
    <section>
      <h1>${project.entity}</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">${project.columns[0]}</th>
              <th scope="col">${project.columns[1]}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
`,
    "components/site-header.tsx": `import Link from "next/link";

const links = [
  { href: "/", label: "Panel" },
  { href: "${route}", label: "${project.entity}" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        ${clientName}
      </Link>
      <nav aria-label="Principal">
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
`,
    "lib/data.ts": `export type RecordItem = { id: string; value: string };

export const records: RecordItem[] = ${JSON.stringify(
      project.rows.map(([id, value]) => ({ id, value })),
      null,
      2,
    )};
`,
    "app/globals.css": STYLES,
  };
}

export const SEED_FILES: Workspace = buildProjectFiles("Cliente de ejemplo", PROJECT_KINDS[0]);
