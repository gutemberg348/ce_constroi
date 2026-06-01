import { LucideIcon } from "lucide-react";

export function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]">
        <Icon size={20} />
      </div>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}
