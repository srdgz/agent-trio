import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { ProjectWorkspace } from "@/components/project/project-workspace";
import { getProjectDetail } from "@/engine/repository";

export const metadata: Metadata = { title: "Proyecto" };

async function ProjectContent({ params }: { params: PageProps<"/projects/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const detail = await getProjectDetail(id);
  if (!detail) notFound();
  return <ProjectWorkspace key={id} initial={detail} />;
}

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Cargando el proyecto…</p>}>
      <ProjectContent params={params} />
    </Suspense>
  );
}
