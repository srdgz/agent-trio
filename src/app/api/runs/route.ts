import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, maxRunsPerDay } from "@/domain/limits";
import { createRuns, runsCreatedToday } from "@/engine/repository";
import { isAuthenticated } from "@/lib/auth";

const bodySchema = z.object({
  projectIds: z.array(z.uuid()).min(1).max(LIMITS.maxBatch),
  request: z.string().trim().min(LIMITS.requestMinLength).max(LIMITS.requestMaxLength),
});

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Inicia sesión para lanzar agentes." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Selecciona entre 1 y ${LIMITS.maxBatch} proyectos y describe la petición con entre ${LIMITS.requestMinLength} y ${LIMITS.requestMaxLength} caracteres.`,
      },
      { status: 400 },
    );
  }

  const projectIds = [...new Set(parsed.data.projectIds)];
  const remaining = maxRunsPerDay() - (await runsCreatedToday());
  if (projectIds.length > remaining) {
    return NextResponse.json(
      { error: `Quedan ${Math.max(remaining, 0)} ejecuciones disponibles hoy.` },
      { status: 429 },
    );
  }

  const { created, skipped } = await createRuns(projectIds, parsed.data.request);
  if (created.length === 0) {
    return NextResponse.json(
      { error: "Los proyectos seleccionados ya tienen una ejecución activa." },
      { status: 409 },
    );
  }
  return NextResponse.json({ created: created.length, skipped }, { status: 201 });
}
