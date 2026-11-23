export type ProjectKind = {
  kind: string;
  slug: string;
  entity: string;
  columns: [string, string];
  rows: [string, string][];
};

export const PROJECT_KINDS: ProjectKind[] = [
  {
    kind: "CRM",
    slug: "contactos",
    entity: "Contactos",
    columns: ["Empresa", "Fase"],
    rows: [
      ["Cuenta Alfa", "Propuesta"],
      ["Cuenta Beta", "Negociación"],
      ["Cuenta Delta", "Cerrada"],
    ],
  },
  {
    kind: "Facturación",
    slug: "facturas",
    entity: "Facturas",
    columns: ["Número", "Estado"],
    rows: [
      ["F-2026-104", "Pagada"],
      ["F-2026-105", "Pendiente"],
      ["F-2026-106", "Vencida"],
    ],
  },
  {
    kind: "Inventario",
    slug: "articulos",
    entity: "Artículos",
    columns: ["Referencia", "Stock"],
    rows: [
      ["REF-1020", "48"],
      ["REF-1021", "12"],
      ["REF-1022", "3"],
    ],
  },
];

export const DEMO_CLIENTS: { name: string; sector: string }[] = [
  { name: "Clínica Altamar", sector: "Salud" },
  { name: "Asesoría Puente Nuevo", sector: "Servicios" },
  { name: "Aceros Valdeluna", sector: "Industria" },
];

export function kindForIndex(index: number) {
  return PROJECT_KINDS[index % PROJECT_KINDS.length];
}
