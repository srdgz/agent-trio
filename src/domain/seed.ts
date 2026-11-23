import type { Workspace } from "./types";

export const SEED_FILES: Workspace = {
  "app/layout.tsx": `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taller Norte | Carpintería a medida",
  description: "Mobiliario a medida para oficinas, tiendas y restaurantes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="site">
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
`,
  "app/page.tsx": `import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>Carpintería a medida para tu negocio</h1>
      <p>Diseñamos y fabricamos mobiliario para oficinas, tiendas y restaurantes.</p>
      <Link className="button" href="/servicios">
        Ver servicios
      </Link>
    </section>
  );
}
`,
  "app/servicios/page.tsx": `import type { Metadata } from "next";

export const metadata: Metadata = { title: "Servicios | Taller Norte" };

const services = [
  { title: "Mobiliario", text: "Mesas, estanterías y mostradores." },
  { title: "Reformas", text: "Revestimientos y divisiones de madera." },
  { title: "Mantenimiento", text: "Reparación y restauración de piezas." },
];

export default function ServicesPage() {
  return (
    <section>
      <h1>Servicios</h1>
      <ul className="cards">
        {services.map((service) => (
          <li key={service.title}>
            <h2>{service.title}</h2>
            <p>{service.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
`,
  "components/site-header.tsx": `import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        Taller Norte
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
  "components/site-footer.tsx": `export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Taller Norte, empresa ficticia para demostración.</p>
    </footer>
  );
}
`,
  "app/globals.css": `:root { --ink: #22201c; --paper: #faf7f1; --accent: #7a3e12; --line: #d8d0c2; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: var(--paper); font-family: system-ui, sans-serif; line-height: 1.6; }
a { color: var(--accent); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.site { min-height: 100dvh; display: flex; flex-direction: column; }
.site-main { flex: 1; width: min(100% - 2rem, 60rem); margin-inline: auto; padding-block: 2rem; }
.site-header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--line); }
.site-header ul { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.brand { font-weight: 700; text-decoration: none; }
.hero { padding-block: 3rem; }
.hero h1 { margin: 0 0 1rem; font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.1; }
.button { display: inline-block; padding: .75rem 1.25rem; color: #fff; background: var(--accent); border-radius: .5rem; text-decoration: none; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr)); gap: 1rem; padding: 0; list-style: none; }
.cards li { padding: 1rem; background: #fff; border: 1px solid var(--line); border-radius: .5rem; }
.cards h2 { margin: 0; font-size: 1.25rem; }
.site-footer { padding: 1rem; text-align: center; border-top: 1px solid var(--line); }
`,
};
