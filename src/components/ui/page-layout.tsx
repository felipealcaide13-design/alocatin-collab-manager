import React from "react";
import { cn } from "@/lib/utils";

// PageLayout — estrutura padrão de página com cabeçalho e conteúdo
interface PageLayoutProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ title, subtitle, action, children, className }: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// FilterBar — container padronizado para filtros
interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn("bg-card rounded-xl border shadow-sm p-4", className)}>
      {children}
    </div>
  );
}

export default PageLayout;
