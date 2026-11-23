import Link from "next/link";
import { AGENT_INFO } from "@/domain/labels";
import type { EventKind, FeedItem } from "@/domain/types";

const timeFormat = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Madrid",
});

const KIND_CLASSES: Record<EventKind, string> = {
  info: "border-border",
  start: "border-accent",
  success: "border-success",
  warning: "border-warning",
  error: "border-danger",
};

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  return (
    <section aria-labelledby="feed-title" className="card flex min-h-0 flex-col">
      <h2 id="feed-title" className="section-title border-b border-border px-3 py-2.5">
        Actividad global
      </h2>
      {items.length === 0 ? (
        <p className="p-3 text-sm text-muted">Todavía no hay actividad.</p>
      ) : (
        <div role="log" aria-live="off" aria-labelledby="feed-title" tabIndex={0} className="max-h-[36rem] overflow-y-auto p-3">
          <ol className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className={`border-l-2 pl-2.5 text-sm ${KIND_CLASSES[item.kind]}`}>
                <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted">
                  <Link href={`/projects/${item.projectId}`} className="inline-flex min-h-6 items-center font-semibold text-foreground underline">
                    {item.projectName}
                  </Link>
                  <span className="font-mono">
                    {AGENT_INFO[item.agent].short} ·{" "}
                    <time dateTime={item.createdAt}>{timeFormat.format(new Date(item.createdAt))}</time>
                  </span>
                </p>
                <p className="mt-0.5 text-muted">{item.message}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
