import type { Tone } from "@/domain/labels";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground",
  accent: "bg-accent-soft text-on-accent-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

const ICON_PATHS: Record<Tone, string> = {
  neutral: "M12 6v6l4 2",
  accent: "M5 12h14M13 6l6 6-6 6",
  success: "M5 13l4 4L19 7",
  warning: "M12 8v5M12 17h.01",
  danger: "M6 6l12 12M18 6L6 18",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${TONE_CLASSES[tone]}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={ICON_PATHS[tone]} />
      </svg>
      {label}
    </span>
  );
}
