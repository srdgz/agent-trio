import { Icon } from "@/components/icons";
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
      <h2 id="agents-title" className="text-xl font-medium tracking-tight">
        Agentes
      </h2>
      <ul className="mt-3 space-y-3">
        {AGENTS.map((agent) => {
          const activity = agentActivity(agent, input);
          const lastEvent = snapshot.events.findLast((event) => event.agent === agent);
          const info = AGENT_INFO[agent];

          return (
            <li key={agent} className={`card p-4 ${activity === "working" ? "!border-accent border-2" : ""}`}>
              <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
                <span className={`grid size-11 shrink-0 place-items-center rounded-full ${info.avatar}`}>
                  <Icon name={info.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1 basis-24">
                  <h3 className="font-medium">{info.name}</h3>
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
