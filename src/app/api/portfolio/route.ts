import { NextResponse } from "next/server";
import { getPortfolio } from "@/engine/repository";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  }
  return NextResponse.json(await getPortfolio(), { headers: { "Cache-Control": "no-store" } });
}
