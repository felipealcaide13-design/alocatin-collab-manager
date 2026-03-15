import React from "react";
import { BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  className?: string;
  height?: number;
}

export function ChartContainer({
  title,
  children,
  isLoading = false,
  isEmpty = false,
  className,
  height = 220,
}: ChartContainerProps) {
  return (
    <div className={cn("bg-card rounded-xl border shadow-sm p-6", className)}>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <span className="w-0.5 h-4 bg-[var(--primary-600)] rounded-full" />
        {title}
      </h3>

      {isLoading ? (
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      ) : isEmpty || !children ? (
        <div
          className="flex flex-col items-center justify-center text-muted-foreground gap-2"
          style={{ height }}
        >
          <BarChart2 className="h-8 w-8 opacity-30" aria-hidden="true" />
          <p className="text-sm">Sem dados disponíveis</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default ChartContainer;
