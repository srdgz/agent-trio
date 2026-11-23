import { NextResponse } from "next/server";
import { z } from "zod";
import { getSnapshot } from "@/engine/repository";

export async function GET(_request: Request, context: RouteContext<"/api/runs/[id]">) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ejecución no encontrada." }, { status: 404 });
  }

  const snapshot = await getSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "Ejecución no encontrada." }, { status: 404 });
  }
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
