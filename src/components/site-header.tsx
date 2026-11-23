import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
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
    <Link href="/login" className="btn btn-primary">
      Iniciar sesión
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="px-4 pt-4 sm:px-6">
      <div className="glass mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 !rounded-full px-4 py-2 sm:px-5">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
          <BrandMark />
          Agent Trio
        </Link>
        <Suspense fallback={<span className="block h-11 w-32" />}>
          <SessionControl />
        </Suspense>
      </div>
    </header>
  );
}
