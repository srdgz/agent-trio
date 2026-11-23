import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-muted">La dirección no existe o la ejecución se ha eliminado.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}
