import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/actions";
import { isAuthenticated } from "@/lib/auth";

async function SessionControl() {
  if (await isAuthenticated()) {
    return (
      <form action={logout}>
        <button type="submit" className="btn btn-secondary">
          Cerrar sesión
        </button>
      </form>
    );
  }

  return (
    <Link href="/login" className="btn btn-secondary">
      Iniciar sesión
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-lg font-bold">
          <span aria-hidden="true" className="flex gap-1">
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="size-2.5 rounded-full bg-success" />
            <span className="size-2.5 rounded-full bg-warning" />
          </span>
          Agent Trio
        </Link>
        <Suspense fallback={<span className="block h-11 w-32" />}>
          <SessionControl />
        </Suspense>
      </div>
    </header>
  );
}
