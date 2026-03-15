import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: string;
  variant?: "entity" | "contract" | "seniority";
  className?: string;
}

const ENTITY_STYLES: Record<string, string> = {
  Ativo: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  Desligado: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
};

const CONTRACT_STYLES: Record<string, string> = {
  Ativo: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  Encerrado: "bg-muted text-muted-foreground",
  Pausado: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
};

const SENIORITY_STYLES: Record<string, string> = {
  Júnior: "bg-[var(--primary-50)] text-[var(--primary-700)]",
  Pleno: "bg-[var(--primary-100)] text-[var(--primary-800)]",
  Sênior: "bg-[var(--primary-800)] text-white",
  Especialista: "bg-[var(--primary-900)] text-white",
  Estagiário: "bg-muted text-muted-foreground",
};

const FALLBACK = "bg-muted text-muted-foreground";

function getStyles(status: string, variant?: StatusBadgeProps["variant"]): string {
  if (variant === "entity") return ENTITY_STYLES[status] ?? FALLBACK;
  if (variant === "contract") return CONTRACT_STYLES[status] ?? FALLBACK;
  if (variant === "seniority") return SENIORITY_STYLES[status] ?? FALLBACK;
  return FALLBACK;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1",
        getStyles(status, variant),
        className,
      )}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
