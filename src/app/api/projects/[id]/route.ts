import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getProjectDetail } from "@/engine/repository";
import { isAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest, context: RouteContext<"/api/projects/[id]">) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id } = await context.params;
  const runId = request.nextUrl.searchParams.get("run");
  const validRun = runId && z.uuid().safeParse(runId).success ? runId : undefined;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }

  const detail = await getProjectDetail(id, validRun);
  if (!detail) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
}
