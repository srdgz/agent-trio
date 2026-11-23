import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-center gap-2 font-semibold">
          <BrandMark className="size-6" />
          Agent Trio
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-muted">Consola interna de proyectos.</p>
        <LoginForm />
      </div>
    </main>
  );
}
