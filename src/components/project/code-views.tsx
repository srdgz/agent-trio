"use client";

import { diffLines } from "diff";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Workspace } from "@/domain/types";
import { listRoutes, resolveInternalRoute } from "@/domain/workspace";
import { PREVIEW_MESSAGE, buildPreview } from "@/lib/preview";

const subscribeToOrigin = () => () => undefined;

type DiffLine = { type: "add" | "del" | "same"; text: string; number: number | null };

const LINE_CLASSES = {
  add: "bg-success-soft",
  del: "bg-danger-soft",
  same: "",
};

const LINE_SIGNS = { add: "+", del: "-", same: " " };

function buildDiff(before: string, after: string) {
  const lines: DiffLine[] = [];
  let number = 1;
  for (const part of diffLines(before, after)) {
    const type = part.added ? "add" : part.removed ? "del" : "same";
    const texts = part.value.replace(/\n$/, "").split("\n");
    for (const text of texts) {
      lines.push({ type, text, number: type === "del" ? null : number });
      if (type !== "del") number += 1;
    }
  }
  return lines;
}

export function DiffView({ path, before, after }: { path: string; before: string; after: string }) {
  const lines = useMemo(() => buildDiff(before, after), [before, after]);
  const changed = lines.some((line) => line.type !== "same");

  if (!changed) {
    return <p className="p-4 text-sm text-muted">Sin cambios en {path} durante esta ejecución.</p>;
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`Cambios en ${path}`}
      className="h-full overflow-auto font-mono text-[0.8125rem] leading-5 [overflow-wrap:normal]"
    >
      <div className="inline-block min-w-full py-2">
        {lines.map((line, index) => (
          <div key={index} className={`flex whitespace-pre ${LINE_CLASSES[line.type]}`}>
            <span className="w-11 shrink-0 select-none pr-2 text-right text-muted">{line.number ?? ""}</span>
            <span className="w-5 shrink-0 select-none text-center font-semibold">{LINE_SIGNS[line.type]}</span>
            <span className="pr-4">{line.text || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceView({ path, content, follow }: { path: string; content: string; follow: boolean }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (follow && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [content, follow]);

  return (
    <pre
      ref={ref}
      tabIndex={0}
      aria-label={`Código de ${path}`}
      className="h-full overflow-auto p-3 font-mono text-[0.8125rem] leading-5 [overflow-wrap:normal]"
    >
      <code>{content}</code>
    </pre>
  );
}

export function PreviewView({ files }: { files: Workspace }) {
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-2">
        <label htmlFor="preview-route" className="text-sm font-medium">
          Ruta
        </label>
        <select
          id="preview-route"
          value={route}
          onChange={(event) => setSelected(event.target.value)}
          className="field max-w-60 font-mono text-sm"
        >
          {routes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <iframe
        ref={frameRef}
        title={`Vista previa de la ruta ${route}`}
        sandbox="allow-scripts"
        srcDoc={preview}
        className="block min-h-0 w-full flex-1 bg-white"
      />
    </div>
  );
}
