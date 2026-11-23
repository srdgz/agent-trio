import { NextResponse } from "next/server";
import { z } from "zod";
import { advanceRun } from "@/engine/advance";
import { isAuthenticated } from "@/lib/auth";

export const maxDuration = 120;

export async function POST(_request: Request, context: RouteContext<"/api/runs/[id]/advance">) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ejecución no encontrada." }, { status: 404 });
  }

  return NextResponse.json(await advanceRun(id));
}
