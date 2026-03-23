import React from "react";

// DetailSection — seção com ícone e título
interface DetailSectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function DetailSection({ icon: Icon, title, children, action }: DetailSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-[var(--primary-600)]" />
            {title}
          </p>
          {action}
        </div>
        <div className="border-b border-border/50 mb-3 mt-1" />
      </div>
      {children}
    </div>
  );
}

// DetailRow — linha label + valor
interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

export function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// StatMini — mini card de estatística
interface StatMiniProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}

export function StatMini({ label, value, icon: Icon }: StatMiniProps) {
  return (
    <div className="bg-[var(--primary-50)] rounded-lg p-3 text-center">
      {Icon && <Icon className="h-4 w-4 text-[var(--primary-600)] mx-auto mb-1" />}
      <p className="text-lg font-bold text-[var(--primary-700)]">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
