"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const invalid = state.error ? true : undefined;
  const describedBy = state.error ? "login-error" : undefined;

  return (
    <form action={action} className="card mt-6 space-y-4 p-4 sm:p-6">
      {state.error ? (
        <p id="login-error" role="alert" className="rounded-lg bg-danger-soft p-3 font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="username" className="block font-medium">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="field mt-1"
        />
      </div>
      <div>
        <label htmlFor="password" className="block font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="field mt-1"
        />
        <button
          type="button"
          aria-pressed={showPassword}
          onClick={() => setShowPassword((value) => !value)}
          className="btn btn-secondary mt-2 text-sm"
        >
          Mostrar contraseña
        </button>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
