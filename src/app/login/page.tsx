import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { isAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "Iniciar sesión" };

async function LoginGate() {
  if (await isAuthenticated()) redirect("/");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
      <p className="mt-2 text-muted">Usa el usuario de prueba incluido en la entrega.</p>
      <Suspense fallback={<p className="card mt-6 p-6 text-muted">Cargando…</p>}>
        <LoginGate />
      </Suspense>
    </div>
  );
}
