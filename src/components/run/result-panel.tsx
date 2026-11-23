"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { SEED_FILES } from "@/domain/seed";
import type { Workspace } from "@/domain/types";
import { changedFiles, listRoutes, resolveInternalRoute } from "@/domain/workspace";
import { PREVIEW_MESSAGE, buildPreview } from "@/lib/preview";

const TABS = [
  { id: "preview", label: "Vista previa" },
  { id: "files", label: "Código" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CHANGE_LABELS = { added: "Nuevo", modified: "Modificado", unchanged: null };
const subscribeToOrigin = () => () => undefined;

function PreviewTab({ files }: { files: Workspace }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const origin = useSyncExternalStore(subscribeToOrigin, () => window.location.origin, () => "");
  const routes = useMemo(() => listRoutes(files), [files]);
  const [selected, setSelected] = useState("/");
  const route = routes.includes(selected) ? selected : (routes[0] ?? "/");
  const preview = useMemo(() => (origin ? buildPreview(files, route, origin) : ""), [files, route, origin]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; href?: unknown };
      if (data?.type !== PREVIEW_MESSAGE || typeof data.href !== "string") return;
      const target = resolveInternalRoute(route, data.href);
      if (target && routes.includes(target)) setSelected(target);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [route, routes]);

  return (
    <div>
      <label htmlFor="preview-route" className="block font-medium">
        Ruta
      </label>
      <select
        id="preview-route"
        value={route}
        onChange={(event) => setSelected(event.target.value)}
        className="field mt-1 font-mono text-sm sm:max-w-xs"
      >
        {routes.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        <div aria-hidden="true" className="flex items-center gap-1.5 bg-surface-muted px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-rose" />
          <span className="size-2.5 rounded-full bg-peach" />
          <span className="size-2.5 rounded-full bg-success" />
          <span className="ml-3 truncate font-mono text-xs text-muted">taller-norte.app{route}</span>
        </div>
        <iframe
          ref={frameRef}
          title={`Vista previa de la ruta ${route}`}
          sandbox="allow-scripts"
          srcDoc={preview}
          className="block h-[36rem] w-full bg-white"
        />
      </div>
    </div>
  );
}

function FilesTab({ files }: { files: Workspace }) {
  const entries = useMemo(() => changedFiles(SEED_FILES, files), [files]);
  const [selected, setSelected] = useState("app/page.tsx");
  const path = selected in files ? selected : (entries[0]?.path ?? "");

  return (
    <div className="grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <ul className="space-y-1">
        {entries.map((entry) => {
          const label = CHANGE_LABELS[entry.change];
          return (
            <li key={entry.path}>
              <button
                type="button"
                aria-pressed={entry.path === path}
                onClick={() => setSelected(entry.path)}
                className={`flex min-h-11 w-full cursor-pointer flex-wrap items-center justify-between gap-1 rounded-xl px-3 py-1 text-left text-sm font-medium ${
                  entry.path === path ? "bg-accent-soft text-on-accent-soft" : "hover:bg-surface-muted"
                }`}
              >
                <span className="font-mono text-xs">{entry.path}</span>
                {label ? <span className="text-xs font-semibold">{label}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <pre
        tabIndex={0}
        aria-label={`Código de ${path}`}
        className="max-h-[38rem] overflow-auto rounded-2xl bg-surface-muted p-4 font-mono text-[0.8125rem] leading-relaxed [overflow-wrap:normal]"
      >
        <code>{files[path]}</code>
      </pre>
    </div>
  );
}

export function ResultPanel({ files }: { files: Workspace }) {
  const [active, setActive] = useState<TabId>("preview");
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((tab) => tab.id === active);
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  return (
    <section aria-labelledby="result-title" className="min-w-0">
      <h2 id="result-title" className="text-xl font-medium tracking-tight">
        Resultado
      </h2>
      <div className="glass mt-3 p-3 sm:p-5">
        <div
          role="tablist"
          aria-labelledby="result-title"
          onKeyDown={handleKeyDown}
          className="inline-flex gap-1 rounded-full bg-surface-muted p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`min-h-11 cursor-pointer rounded-full px-4 font-semibold transition-colors ${
                active === tab.id ? "bg-ink text-on-ink" : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} className="pt-4">
          {active === "preview" ? <PreviewTab files={files} /> : <FilesTab files={files} />}
        </div>
      </div>
    </section>
  );
}
