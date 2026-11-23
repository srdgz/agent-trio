import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { LoginShowcase } from "@/components/login-showcase";
import { AGENT_INFO } from "@/domain/labels";
import { AGENTS } from "@/domain/types";
import "./login.css";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="login-shell">
      <main id="main" tabIndex={-1} className="login-main">
        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col">
          <div className="flex items-center gap-2.5 text-lg font-semibold">
            <BrandMark className="size-7" />
            Agent Trio
          </div>

          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="login-card">
              <p className="login-badge">
                <Icon name="shield" className="size-3.5" />
                Acceso interno
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
              <p className="mt-1.5 text-muted">Entra para gestionar los proyectos y sus agentes.</p>
              <LoginForm />
            </div>

            <ol aria-label="Equipo de agentes" className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-muted min-[360px]:gap-x-2 min-[360px]:text-sm lg:hidden">
              {AGENTS.map((agent, index) => (
                <li key={agent} className="inline-flex items-center gap-2">
                  {index > 0 ? <Icon name="arrow" className="size-3.5" /> : null}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Icon name={AGENT_INFO[agent].icon} className="size-4" />
                    {AGENT_INFO[agent].name}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
      <LoginShowcase />
    </div>
  );
}
