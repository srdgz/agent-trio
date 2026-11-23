import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, maxRunsPerDay } from "@/domain/limits";
import { createRun, runsCreatedToday } from "@/engine/repository";
import { isAuthenticated } from "@/lib/auth";

const bodySchema = z.object({
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
        error: `Describe la petición con entre ${LIMITS.requestMinLength} y ${LIMITS.requestMaxLength} caracteres.`,
      },
      { status: 400 },
    );
  }

  if ((await runsCreatedToday()) >= maxRunsPerDay()) {
    return NextResponse.json(
      { error: "Se ha alcanzado el límite diario de ejecuciones de la demo." },
      { status: 429 },
    );
  }

  const id = await createRun(parsed.data.request);
  return NextResponse.json({ id }, { status: 201 });
}
