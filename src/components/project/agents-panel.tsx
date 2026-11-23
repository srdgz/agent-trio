import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { agentActivity } from "@/domain/activity";
import { ACTIVITY_INFO, AGENT_INFO, TASK_STATUS_INFO } from "@/domain/labels";
import { LIMITS } from "@/domain/limits";
import { AGENTS, type EventKind, type ProjectDetail } from "@/domain/types";

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

export function AgentsPanel({ detail }: { detail: ProjectDetail }) {
  const { run, tasks, events } = detail;
  const input = run ? { runStatus: run.status, taskStatuses: tasks.map((task) => task.status) } : null;

  return (
    <div className="min-w-0 space-y-3">
      <section aria-labelledby="agents-title" className="card">
        <h2 id="agents-title" className="section-title border-b border-border px-3 py-2.5">
          Agentes
        </h2>
        <ul className="divide-y divide-border">
          {AGENTS.map((agent) => {
            const info = AGENT_INFO[agent];
            const activity = input ? agentActivity(agent, input) : "idle";
            const last = events.findLast((event) => event.agent === agent);
            return (
              <li key={agent} className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon name={info.icon} className="size-4 shrink-0 text-muted" />
                  <h3 className="min-w-0 flex-1 font-semibold">
                    {info.name} <span className="text-xs font-normal text-muted">{info.provider}</span>
                  </h3>
                  <StatusBadge {...ACTIVITY_INFO[activity]} />
                </div>
                {last ? <p className="mt-1 line-clamp-2 text-sm text-muted">{last.message}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="tasks-title" className="card">
        <h2 id="tasks-title" className="section-title border-b border-border px-3 py-2.5">
          Tareas ({tasks.filter((task) => task.status === "done").length}/{tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="p-3 text-sm text-muted">Sin tareas planificadas.</p>
        ) : (
          <ol className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="px-3 py-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 basis-32 text-sm font-semibold">
                    {task.position + 1}. {task.title}
                  </h3>
                  <StatusBadge {...TASK_STATUS_INFO[task.status]} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Intento {task.attempts} de {LIMITS.maxAttemptsPerTask}
                </p>
                {task.feedback.length > 0 ? (
                  <ul className="mt-1.5 list-disc space-y-1 rounded bg-warning-soft py-1.5 pl-6 pr-2 text-xs text-warning">
                    {task.feedback.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {task.results.length > 0 ? (
                  <details className="mt-1 text-sm">
                    <summary className="min-h-6 cursor-pointer py-0.5 font-medium">
                      Comprobaciones {task.results.filter((item) => item.passed).length}/{task.results.length}
                    </summary>
                    <ul className="mt-1 space-y-1 text-xs">
                      {task.results.map((item) => (
                        <li key={item.label}>
                          <span className={`font-semibold ${item.passed ? "text-success" : "text-danger"}`}>
                            {item.passed ? "OK" : "Error"}
                          </span>{" "}
                          {item.label}
                          {item.detail ? <span className="block text-muted">{item.detail}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="log-title" className="card">
        <h2 id="log-title" className="section-title border-b border-border px-3 py-2.5">
          Registro
        </h2>
        <div role="log" aria-live="off" aria-labelledby="log-title" tabIndex={0} className="max-h-72 overflow-y-auto p-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted">Sin eventos.</p>
          ) : (
            <ol className="space-y-2">
              {[...events].reverse().map((event) => (
                <li key={event.id} className={`border-l-2 pl-2 text-xs ${KIND_CLASSES[event.kind]}`}>
                  <p className="font-mono text-muted">
                    {AGENT_INFO[event.agent].short} ·{" "}
                    <time dateTime={event.createdAt}>{timeFormat.format(new Date(event.createdAt))}</time>
                  </p>
                  <p>{event.message}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
