"use client";

import { useActionState, useState } from "react";
import { loginAction } from "./actions";

type LoginRole = "admin" | "client";

const PRESETS: Record<LoginRole, { email: string; password: string }> = {
  admin: { email: "admin@iseg.com", password: "iseg2024" },
  client: { email: "cemaco@cliente.com", password: "cemaco2024" },
};

export function LoginForm() {
  const [role, setRole] = useState<LoginRole>("admin");
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState(PRESETS.admin.email);
  const [password, setPassword] = useState(PRESETS.admin.password);

  function pickRole(r: LoginRole) {
    setRole(r);
    setEmail(PRESETS[r].email);
    setPassword(PRESETS[r].password);
  }

  return (
    <form action={formAction} className="w-full max-w-[360px]">
      <p className="eyebrow mb-3">Ingresar a la plataforma</p>
      <h1
        className="text-accent uppercase font-black tracking-[3px] text-[28px] mb-1"
        style={{ textShadow: "0 0 40px rgba(43,214,197,.25)" }}
      >
        Login
      </h1>
      <p className="text-text-dim text-[10px] tracking-[4px] uppercase font-semibold mb-3">
        Selecciona tu rol
      </p>
      <div className="divider-accent mb-7" />

      <div className="flex border border-border mb-7">
        {(["admin", "client"] as const).map((r, i) => (
          <button
            key={r}
            type="button"
            onClick={() => pickRole(r)}
            className={
              "flex-1 py-2.5 text-[10px] font-bold tracking-[1.5px] uppercase transition " +
              (role === r
                ? "text-accent bg-[rgba(43,214,197,0.06)] relative after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-accent"
                : "text-text-dim hover:text-text") +
              (i > 0 ? " border-l border-border" : "")
            }
          >
            {r === "admin" ? "🛡️ ISEG ADMIN" : "🏢 CLIENTE"}
          </button>
        ))}
      </div>

      <div className="field mb-4">
        <label htmlFor="email">Usuario</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
          placeholder="email@dominio.com"
          autoComplete="email"
        />
      </div>

      <div className="field mb-4">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-accent w-full justify-center mt-7">
        {pending ? "Ingresando…" : "Ingresar →"}
      </button>

      <p className="text-alto text-[11px] mt-3 text-center min-h-[16px]">
        {state?.error ?? ""}
      </p>
    </form>
  );
}
