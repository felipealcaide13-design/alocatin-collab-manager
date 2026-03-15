import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  trend?: { value: number; label: string };
  isLoading?: boolean;
  description?: string;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, { icon: string; bg: string }> = {
  default: {
    bg: "bg-[var(--primary-50)]",
    icon: "text-[var(--primary-600)]",
  },
  success: {
    bg: "bg-[var(--color-success-subtle)]",
    icon: "text-[var(--color-success)]",
  },
  warning: {
    bg: "bg-[var(--color-warning-subtle)]",
    icon: "text-[var(--color-warning)]",
  },
  danger: {
    bg: "bg-[var(--color-danger-subtle)]",
    icon: "text-[var(--color-danger)]",
  },
  info: {
    bg: "bg-[var(--color-info-subtle)]",
    icon: "text-[var(--color-info)]",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  isLoading = false,
  description,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border shadow-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-20 mt-1" />
        {trend !== undefined && <Skeleton className="h-4 w-24 mt-2" />}
        {description !== undefined && <Skeleton className="h-3 w-full mt-2" />}
      </div>
    );
  }

  const styles = variantStyles[variant];
  const TrendIcon = trend && trend.value >= 0 ? TrendingUp : TrendingDown;
  const trendColor = trend && trend.value >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]";

  return (
    <div
      className={cn(
        "bg-card border shadow-sm rounded-xl p-6",
        "hover:shadow-md hover:-translate-y-px transition-all duration-150"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", styles.bg)}>
          <Icon className={cn("h-5 w-5", styles.icon)} />
        </div>
      </div>

      <p className="text-3xl font-bold mt-2">{value}</p>

      {trend && (
        <div className={cn("flex items-center gap-1 mt-1 text-sm", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span>
            {trend.value > 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

export default StatCard;
