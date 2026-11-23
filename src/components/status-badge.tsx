import { Icon, type IconName } from "@/components/icons";
import type { Tone } from "@/domain/labels";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground",
  accent: "bg-accent-soft text-on-accent-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

const TONE_ICONS: Record<Tone, IconName> = {
  neutral: "clock",
  accent: "arrow",
  success: "check",
  warning: "alert",
  danger: "close",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[0.8125rem] font-semibold ${TONE_CLASSES[tone]}`}
    >
      <Icon name={TONE_ICONS[tone]} className="size-3.5" />
      {label}
    </span>
  );
}
