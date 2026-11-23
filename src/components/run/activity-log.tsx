import { AGENT_INFO } from "@/domain/labels";
import type { EventKind, EventView } from "@/domain/types";

const timeFormat = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Madrid",
});

const KIND_CLASSES: Record<EventKind, string> = {
  info: "bg-surface-muted text-foreground",
  start: "bg-accent-soft text-on-accent-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-danger-soft text-danger",
};

export function ActivityLog({ events }: { events: EventView[] }) {
  const ordered = [...events].reverse();

  return (
    <section aria-labelledby="activity-title">
      <h2 id="activity-title" className="text-xl font-medium tracking-tight">
        Actividad
      </h2>
      <div
        role="log"
        aria-live="off"
        aria-labelledby="activity-title"
        tabIndex={0}
        className="card mt-3 max-h-[28rem] overflow-y-auto p-4"
      >
        <ol className="space-y-3">
          {ordered.map((event) => (
            <li key={event.id} className="flex gap-3 text-sm">
              <time
                dateTime={event.createdAt}
                className={`h-fit shrink-0 rounded-lg px-2 py-1 font-mono text-xs font-medium ${KIND_CLASSES[event.kind]}`}
              >
                {timeFormat.format(new Date(event.createdAt))}
              </time>
              <div className="min-w-0">
                <p className="font-semibold">{AGENT_INFO[event.agent].name}</p>
                <p className="text-muted">{event.message}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
