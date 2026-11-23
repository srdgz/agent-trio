import { AGENT_INFO } from "@/domain/labels";
import type { EventKind, EventView } from "@/domain/types";

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

export function ActivityLog({ events }: { events: EventView[] }) {
  const ordered = [...events].reverse();

  return (
    <section aria-labelledby="activity-title">
      <h2 id="activity-title" className="text-xl font-semibold">
        Actividad
      </h2>
      <div
        role="log"
        aria-live="off"
        aria-labelledby="activity-title"
        tabIndex={0}
        className="card mt-3 max-h-96 overflow-y-auto p-4"
      >
        <ol className="space-y-3">
          {ordered.map((event) => (
            <li key={event.id} className={`border-l-4 pl-3 text-sm ${KIND_CLASSES[event.kind]}`}>
              <p className="text-muted">
                <span className="font-semibold text-foreground">{AGENT_INFO[event.agent].name}</span>{" "}
                <time dateTime={event.createdAt}>{timeFormat.format(new Date(event.createdAt))}</time>
              </p>
              <p>{event.message}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
