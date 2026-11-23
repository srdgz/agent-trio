import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { isAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "Iniciar sesión" };

async function LoginGate() {
  if (await isAuthenticated()) redirect("/");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="glass mx-auto mt-4 max-w-md p-6 sm:mt-10 sm:p-9">
      <BrandMark className="size-11" />
      <h1 className="mt-4 text-3xl font-normal tracking-tight">Iniciar sesión</h1>
      <p className="mt-2 text-muted">Usa el usuario de prueba incluido en la entrega.</p>
      <Suspense fallback={<p className="mt-6 text-muted">Cargando…</p>}>
        <LoginGate />
      </Suspense>
    </div>
  );
}
