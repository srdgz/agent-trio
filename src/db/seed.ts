import { config } from "dotenv";
import { and, count, eq } from "drizzle-orm";
import { DEMO_CLIENTS, kindForIndex } from "@/domain/portfolio";
import { buildProjectFiles } from "@/domain/seed";
import { getDb } from "./client";
import { clients, projects } from "./schema";

config({ path: ".env.local", quiet: true });

async function seed() {
  const db = getDb();

  for (const [index, client] of DEMO_CLIENTS.entries()) {
    await db.insert(clients).values(client).onConflictDoNothing();
    const [row] = await db.select({ id: clients.id }).from(clients).where(eq(clients.name, client.name));
    const projectKind = kindForIndex(index);
    const name = `${projectKind.kind} ${client.name.split(" ")[0]}`;
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.clientId, row.id), eq(projects.name, name)));
    if (existing) continue;
    await db.insert(projects).values({
      clientId: row.id,
      name,
      kind: projectKind.kind,
      files: buildProjectFiles(client.name, projectKind),
    });
  }

  const [clientTotal] = await db.select({ total: count() }).from(clients);
  const [projectTotal] = await db.select({ total: count() }).from(projects);
  console.log(`clients=${clientTotal.total} projects=${projectTotal.total}`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
