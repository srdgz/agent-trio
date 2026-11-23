"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions";
import { Icon } from "@/components/icons";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const invalid = state.error ? true : undefined;
  const describedBy = state.error ? "login-error" : undefined;

  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error ? (
        <p id="login-error" role="alert" className="rounded-md bg-danger-soft p-3 font-medium text-danger">
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
        <div className="relative mt-1">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="field !pr-13"
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-0 top-0 grid size-10 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:text-foreground"
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} className="size-5" />
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Entrando…" : "Entrar"}
        <Icon name="arrow" className="size-4" />
      </button>
    </form>
  );
}
