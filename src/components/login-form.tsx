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
    <form action={action} className="mt-7 space-y-4">
      {state.error ? (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-2 rounded-md bg-danger-soft p-3 font-medium text-danger"
        >
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      <div>
        <label htmlFor="username" className="block font-medium">
          Usuario
        </label>
        <div className="relative mt-1.5">
          <Icon name="user" className="pointer-events-none absolute left-3 top-3 size-5 text-muted" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="field login-field !pl-10"
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="block font-medium">
          Contraseña
        </label>
        <div className="relative mt-1.5">
          <Icon name="lock" className="pointer-events-none absolute left-3 top-3 size-5 text-muted" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="field login-field !pl-10 !pr-12"
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-0 top-0 grid size-11 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:text-foreground"
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} className="size-5" />
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary login-submit w-full">
        {pending ? "Entrando…" : "Entrar"}
        <Icon name="arrow" className="size-4" />
      </button>
    </form>
  );
}
