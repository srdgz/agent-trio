"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { SEED_FILES } from "@/domain/seed";
import type { Workspace } from "@/domain/types";
import { changedFiles, resolveInternalPath } from "@/domain/workspace";
import { PREVIEW_MESSAGE, buildPreview } from "@/lib/preview";

const TABS = [
  { id: "preview", label: "Vista previa" },
  { id: "files", label: "Archivos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CHANGE_LABELS = { added: "Nuevo", modified: "Modificado", unchanged: null };

function PreviewTab({ files }: { files: Workspace }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pages = useMemo(() => Object.keys(files).filter((path) => path.endsWith(".html")).sort(), [files]);
  const [selected, setSelected] = useState("index.html");
  const page = pages.includes(selected) ? selected : (pages[0] ?? "");
  const document = useMemo(() => buildPreview(files, page), [files, page]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; href?: unknown };
      if (data?.type !== PREVIEW_MESSAGE || typeof data.href !== "string") return;
      const target = resolveInternalPath(page, data.href);
      if (target && pages.includes(target)) setSelected(target);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [page, pages]);

  return (
    <div>
      <label htmlFor="preview-page" className="block font-medium">
        Página
      </label>
      <select
        id="preview-page"
        value={page}
        onChange={(event) => setSelected(event.target.value)}
        className="field mt-1 sm:max-w-xs"
      >
        {pages.map((path) => (
          <option key={path} value={path}>
            {path}
          </option>
        ))}
      </select>
      <iframe
        ref={frameRef}
        title={`Vista previa de ${page}`}
        sandbox="allow-scripts"
        srcDoc={document}
        className="mt-3 h-[34rem] w-full rounded-lg border border-border bg-white"
      />
    </div>
  );
}

function FilesTab({ files }: { files: Workspace }) {
  const entries = useMemo(() => changedFiles(SEED_FILES, files), [files]);
  const [selected, setSelected] = useState("index.html");
  const path = selected in files ? selected : (entries[0]?.path ?? "");

  return (
    <div className="grid gap-3 md:grid-cols-[14rem_minmax(0,1fr)]">
      <ul className="space-y-1">
        {entries.map((entry) => {
          const label = CHANGE_LABELS[entry.change];
          return (
            <li key={entry.path}>
              <button
                type="button"
                aria-pressed={entry.path === path}
                onClick={() => setSelected(entry.path)}
                className={`flex min-h-11 w-full flex-wrap items-center justify-between gap-1 rounded-lg px-3 py-1 text-left text-sm font-medium ${
                  entry.path === path ? "bg-accent-soft text-on-accent-soft" : "hover:bg-surface-muted"
                }`}
              >
                <span className="font-mono">{entry.path}</span>
                {label ? <span className="text-xs font-semibold">{label}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <pre
        tabIndex={0}
        aria-label={`Código de ${path}`}
        className="max-h-[34rem] overflow-auto rounded-lg bg-surface-muted p-3 font-mono text-sm [overflow-wrap:normal]"
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
      <h2 id="result-title" className="text-xl font-semibold">
        Resultado
      </h2>
      <div className="card mt-3 p-4">
        <div role="tablist" aria-labelledby="result-title" onKeyDown={handleKeyDown} className="flex gap-1 border-b border-border">
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
              className={`min-h-11 border-b-3 px-3 font-semibold ${
                active === tab.id ? "border-accent text-foreground" : "border-transparent text-muted"
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
