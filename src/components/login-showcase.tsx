import { Icon } from "@/components/icons";
import { AGENT_INFO } from "@/domain/labels";
import { AGENTS, type AgentId } from "@/domain/types";

const AGENT_STATES: Record<AgentId, { label: string; className: string }> = {
  orchestrator: { label: "2 tareas", className: "login-state-done" },
  develop: { label: "Escribiendo", className: "login-state-live" },
  testing: { label: "En espera", className: "login-state-idle" },
};

const DIFF_LINES = [
  { sign: " ", text: "const links = [", type: "same" },
  { sign: " ", text: '  { href: "/", label: "Panel" },', type: "same" },
  { sign: "-", text: '  { href: "/ayuda", label: "Ayuda" },', type: "del" },
  { sign: "+", text: '  { href: "/facturas", label: "Facturas" },', type: "add" },
  { sign: "+", text: '  { href: "/contacto", label: "Contacto" },', type: "add" },
  { sign: " ", text: "];", type: "same" },
];

export function LoginShowcase() {
  return (
    <aside aria-label="Cómo funciona la consola" className="login-panel hidden lg:flex">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col justify-center gap-8 px-10 py-12 xl:px-14">
        <div>
          <p className="login-eyebrow">Orquestación de agentes</p>
          <p className="mt-3 max-w-xl text-3xl font-semibold leading-tight xl:text-4xl">
            Todos los proyectos, sus agentes y cada línea de código en una sola consola.
          </p>
        </div>

        <div aria-hidden="true" className="login-window">
          <div className="login-window-bar">
            <span className="size-2.5 rounded-full bg-[#ff8f86]" />
            <span className="size-2.5 rounded-full bg-[#f5c16c]" />
            <span className="size-2.5 rounded-full bg-[#6fe0a1]" />
            <span className="ml-2 truncate font-mono text-xs">components/site-header.tsx</span>
          </div>
          <div className="grid grid-cols-3 gap-px bg-white/10">
            {AGENTS.map((agent) => {
              const state = AGENT_STATES[agent];
              return (
                <div key={agent} className="login-agent">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Icon name={AGENT_INFO[agent].icon} className="size-4" />
                    {AGENT_INFO[agent].name}
                  </span>
                  <span className={`login-state ${state.className}`}>{state.label}</span>
                </div>
              );
            })}
          </div>
          <div className="py-3 font-mono text-[0.8125rem] leading-6">
            {DIFF_LINES.map((line) => (
              <div key={`${line.sign}${line.text}`} className={`login-diff login-diff-${line.type}`}>
                <span className="w-7 shrink-0 select-none text-center font-semibold">{line.sign}</span>
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-pre">{line.text}</span>
              </div>
            ))}
            <div className="login-diff login-diff-same">
              <span className="w-7 shrink-0" />
              <span className="pulse-dot inline-block h-4 w-2 translate-y-1 bg-[#a5c8ff]" />
            </div>
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {["Ejecución en paralelo", "Pruebas antes de aplicar", "Código en directo"].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Icon name="check" className="size-4 text-[#6fe0a1]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
