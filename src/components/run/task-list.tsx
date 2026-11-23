import { StatusBadge } from "@/components/status-badge";
import { TASK_STATUS_INFO } from "@/domain/labels";
import { LIMITS } from "@/domain/limits";
import type { TaskView } from "@/domain/types";

export function TaskList({ tasks }: { tasks: TaskView[] }) {
  return (
    <section aria-labelledby="tasks-title">
      <h2 id="tasks-title" className="text-xl font-semibold">
        Tareas
      </h2>
      {tasks.length === 0 ? (
        <p className="card mt-3 p-4 text-muted">El Orquestador está preparando el plan.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 basis-48 font-semibold">
                  {task.position + 1}. {task.title}
                </h3>
                <StatusBadge {...TASK_STATUS_INFO[task.status]} />
              </div>
              <p className="mt-2 text-sm text-muted">{task.description}</p>
              <p className="mt-2 text-sm">
                Intentos: {task.attempts} de {LIMITS.maxAttemptsPerTask}
              </p>

              {task.feedback.length > 0 ? (
                <div className="mt-3 rounded-lg bg-warning-soft p-3 text-sm text-warning">
                  <p className="font-semibold">Fallos devueltos por Testing</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {task.feedback.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {task.results.length > 0 ? (
                <details className="mt-3">
                  <summary className="min-h-11 cursor-pointer py-2.5 font-medium">
                    Comprobaciones: {task.results.filter((item) => item.passed).length} de{" "}
                    {task.results.length} correctas
                  </summary>
                  <ul className="mt-1 space-y-2 text-sm">
                    {task.results.map((item) => (
                      <li key={item.label}>
                        <span className={`font-semibold ${item.passed ? "text-success" : "text-danger"}`}>
                          {item.passed ? "Correcto" : "Error"}:
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
  );
}
