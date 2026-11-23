"use client";

import { useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { LIMITS } from "@/domain/limits";
import { useEngine } from "./engine-provider";

export function LaunchForm({
  projectIds,
  label,
  hint,
  disabledReason,
  onLaunched,
}: {
  projectIds: string[];
  label: string;
  hint: string;
  disabledReason: string | null;
  onLaunched?: () => void;
}) {
  const { refresh } = useEngine();
  const inputRef = useRef<HTMLInputElement>(null);
  const [request, setRequest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const blocked = disabledReason !== null;

  function fail(message: string) {
    setError(message);
    setSubmitting(false);
    inputRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || blocked) return;
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
        body: JSON.stringify({ projectIds, request }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        fail(body.error ?? "No se ha podido lanzar la ejecución.");
        return;
      }
      setRequest("");
      setSubmitting(false);
      await refresh();
      onLaunched?.();
    } catch {
      fail("No se ha podido conectar con el servidor.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="launch-request" className="block font-semibold">
        {label}
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          id="launch-request"
          name="request"
          type="text"
          autoComplete="off"
          maxLength={LIMITS.requestMaxLength}
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "launch-hint launch-error" : "launch-hint"}
          placeholder="Ej.: añade una página de contacto"
          className="field min-w-0 flex-1"
        />
        <button type="submit" disabled={submitting || blocked} className="btn btn-primary shrink-0">
          {submitting ? "Lanzando…" : "Lanzar agentes"}
          <Icon name="arrow" className="size-4" />
        </button>
      </div>
      <p id="launch-hint" className="mt-1 text-sm text-muted">
        {disabledReason ?? hint}
      </p>
      {error ? (
        <p id="launch-error" role="alert" className="mt-1 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
