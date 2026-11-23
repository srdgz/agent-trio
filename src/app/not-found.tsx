import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-muted">La dirección no existe o el proyecto se ha eliminado.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Volver a proyectos
      </Link>
    </main>
  );
}
