"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { LIMITS } from "@/domain/limits";

const SUGGESTIONS = [
  "Añade una página de contacto",
  "Añade preguntas frecuentes en servicios",
  "Crea una página de proyectos con tres trabajos",
];

export function NewRunForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [request, setRequest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function fail(message: string) {
    setError(message);
    setSubmitting(false);
    inputRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (request.trim().length < LIMITS.requestMinLength) {
      fail(`Escribe al menos ${LIMITS.requestMinLength} caracteres.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) {
        fail(body.error ?? "No se ha podido iniciar la ejecución.");
        return;
      }
      router.push(`/runs/${body.id}`);
    } catch {
      fail("No se ha podido conectar con el servidor.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="request" className="block font-display text-2xl font-medium tracking-tight">
        ¿Qué cambio necesita la app?
      </label>
      <p id="request-hint" className="mt-1 text-muted">
        Los agentes trabajarán sobre Taller Norte, una app Next.js de ejemplo.
      </p>
      <textarea
        ref={inputRef}
        id="request"
        name="request"
        rows={4}
        required
        maxLength={LIMITS.requestMaxLength}
        value={request}
        onChange={(event) => setRequest(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "request-hint request-error" : "request-hint"}
        className="field mt-4 resize-y"
      />
      {error ? (
        <p id="request-error" role="alert" className="mt-2 font-medium text-danger">
          {error}
        </p>
      ) : null}

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-muted">Ejemplos</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setRequest(suggestion);
                setError(null);
                inputRef.current?.focus();
              }}
              className="btn-chip"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={submitting} className="btn btn-primary mt-5 w-full sm:w-auto">
        {submitting ? "Iniciando…" : "Lanzar agentes"}
        <Icon name="arrow" className="size-4" />
      </button>
    </form>
  );
}
