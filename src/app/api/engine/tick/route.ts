import { NextResponse } from "next/server";
import { advanceNextRun } from "@/engine/advance";
import { isAuthenticated } from "@/lib/auth";

export const maxDuration = 120;

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }
  return NextResponse.json(await advanceNextRun());
}
