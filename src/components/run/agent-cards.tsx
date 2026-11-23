import { StatusBadge } from "@/components/status-badge";
import { agentActivity } from "@/domain/activity";
import { ACTIVITY_INFO, AGENT_INFO } from "@/domain/labels";
import { AGENTS, type RunSnapshot } from "@/domain/types";

export function AgentCards({ snapshot }: { snapshot: RunSnapshot }) {
  const input = {
    runStatus: snapshot.run.status,
    taskStatuses: snapshot.tasks.map((task) => task.status),
  };

  return (
    <section aria-labelledby="agents-title">
      <h2 id="agents-title" className="text-xl font-semibold">
        Agentes
      </h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-3">
        {AGENTS.map((agent) => {
          const activity = agentActivity(agent, input);
          const lastEvent = snapshot.events.findLast((event) => event.agent === agent);
          const info = AGENT_INFO[agent];

          return (
            <li
              key={agent}
              className={`card p-4 ${activity === "working" ? "border-2 border-accent" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{info.name}</h3>
                  <p className="text-sm text-muted">{info.provider}</p>
                </div>
                <span className="inline-flex items-center gap-2">
                  {activity === "working" ? (
                    <span aria-hidden="true" className="pulse-dot size-2 rounded-full bg-accent" />
                  ) : null}
                  <StatusBadge {...ACTIVITY_INFO[activity]} />
                </span>
              </div>
              <p className="mt-3 text-sm">{lastEvent?.message ?? info.role}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
