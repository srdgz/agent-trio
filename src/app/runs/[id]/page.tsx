import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { RunDashboard } from "@/components/run/run-dashboard";
import { getSnapshot } from "@/engine/repository";
import { isAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "Ejecución" };

async function RunContent({ params }: { params: PageProps<"/runs/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [snapshot, authenticated] = await Promise.all([getSnapshot(id), isAuthenticated()]);
  if (!snapshot) notFound();

  return <RunDashboard initialSnapshot={snapshot} canAdvance={authenticated} />;
}

export default function RunPage({ params }: PageProps<"/runs/[id]">) {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ejecución de agentes</h1>
          <p className="mt-2 text-muted">Cargando la ejecución…</p>
        </div>
      }
    >
      <RunContent params={params} />
    </Suspense>
  );
}
