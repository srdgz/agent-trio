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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${TONE_CLASSES[tone]}`}
    >
      <Icon name={TONE_ICONS[tone]} className="size-4" />
      {label}
    </span>
  );
}
