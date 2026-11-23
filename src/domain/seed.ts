import type { Workspace } from "./types";

const header = `<header class="site-header">
      <a class="brand" href="index.html">Taller Norte</a>
      <nav aria-label="Principal">
        <ul>
          <li><a href="index.html">Inicio</a></li>
          <li><a href="servicios.html">Servicios</a></li>
        </ul>
      </nav>
    </header>`;

const footer = `<footer class="site-footer">
      <p>Taller Norte, empresa ficticia para demostración.</p>
    </footer>`;

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    ${header}
    <main>
${body}
    </main>
    ${footer}
    <script src="main.js"></script>
  </body>
</html>
`;
}

export const SEED_FILES: Workspace = {
  "index.html": page(
    "Taller Norte | Carpintería a medida",
    `      <section class="hero">
        <h1>Carpintería a medida para tu negocio</h1>
        <p>Diseñamos y fabricamos mobiliario para oficinas, tiendas y restaurantes.</p>
        <a class="button" href="servicios.html">Ver servicios</a>
      </section>`,
  ),
  "servicios.html": page(
    "Servicios | Taller Norte",
    `      <section class="content">
        <h1>Servicios</h1>
        <ul class="cards">
          <li><h2>Mobiliario</h2><p>Mesas, estanterías y mostradores.</p></li>
          <li><h2>Reformas</h2><p>Revestimientos y divisiones de madera.</p></li>
          <li><h2>Mantenimiento</h2><p>Reparación y restauración de piezas.</p></li>
        </ul>
      </section>`,
  ),
  "styles.css": `:root {
  --ink: #22201c;
  --paper: #faf7f1;
  --accent: #7a3e12;
}
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; color: var(--ink); background: var(--paper); font-family: system-ui, sans-serif; line-height: 1.6; }
main { flex: 1; width: min(100% - 2rem, 60rem); margin-inline: auto; padding-block: 2rem; }
a { color: var(--accent); }
.site-header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #d8d0c2; }
.brand { font-weight: 700; text-decoration: none; }
nav ul { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.hero { padding-block: 3rem; }
.hero h1 { margin: 0 0 1rem; font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.1; }
.button { display: inline-block; padding: .75rem 1.25rem; color: #fff; background: var(--accent); border-radius: .5rem; text-decoration: none; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; padding: 0; list-style: none; }
.cards li { padding: 1rem; background: #fff; border: 1px solid #d8d0c2; border-radius: .5rem; }
.cards h2 { margin: 0; font-size: 1.25rem; }
.site-footer { padding: 1rem; text-align: center; border-top: 1px solid #d8d0c2; }
`,
  "main.js": `document.documentElement.classList.add("js");
`,
};
