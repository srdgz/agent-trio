import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { logout } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { EngineProvider } from "@/components/console/engine-provider";
import { EngineStatus } from "@/components/console/engine-status";
import { getPortfolio } from "@/engine/repository";

async function ConsoleFrame({ children }: { children: ReactNode }) {
  await connection();
  const portfolio = await getPortfolio();

  return (
    <EngineProvider initial={portfolio}>
      <header className="border-b border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5">
          <div className="flex items-center gap-5">
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 font-semibold">
              <BrandMark className="size-5" />
              Agent Trio
            </Link>
            <nav aria-label="Principal">
              <Link href="/" className="inline-flex min-h-10 items-center font-medium text-muted hover:text-foreground">
                Proyectos
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <EngineStatus />
            <form action={logout}>
              <button type="submit" className="btn btn-secondary">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="w-full flex-1 p-4">
        {children}
      </main>
    </EngineProvider>
  );
}

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main id="main" tabIndex={-1} className="flex-1 p-4 text-muted">
          Cargando la consola…
        </main>
      }
    >
      <ConsoleFrame>{children}</ConsoleFrame>
    </Suspense>
  );
}
