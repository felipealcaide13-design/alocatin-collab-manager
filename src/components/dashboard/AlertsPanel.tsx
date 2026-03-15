import { AlertTriangle, CheckCircle2, Users, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Alert } from '@/utils/dashboardRH';

interface AlertsPanelProps {
  alerts: Alert[];
  collapsed: boolean;
}

function AlertIcon({ type }: { type: Alert['type'] }) {
  if (type === 'Squad sem líder') return <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />;
  if (type === 'Squad vazio') return <Users className="h-4 w-4 text-[var(--color-danger)]" />;
  return <UserX className="h-4 w-4 text-[var(--color-info)]" />;
}

function alertBadgeClass(type: Alert['type']): string {
  if (type === 'Squad sem líder') return 'border-[var(--color-warning)] text-[var(--color-warning)] bg-[var(--color-warning-subtle)]';
  if (type === 'Squad vazio') return 'border-[var(--color-danger)] text-[var(--color-danger)] bg-[var(--color-danger-subtle)]';
  return 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-info-subtle)]';
}

export function AlertsPanel({ alerts, collapsed }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>Tudo certo por aqui 🎉</span>
      </div>
    );
  }

  const visible = collapsed ? alerts.slice(0, 3) : alerts;
  const remaining = alerts.length - 3;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((alert) => (
        <div key={`${alert.type}-${alert.itemId}`} className="flex items-center gap-2">
          <AlertIcon type={alert.type} />
          <Badge variant="outline" className={alertBadgeClass(alert.type)}>
            {alert.type}
          </Badge>
          <span className="text-sm">{alert.itemName}</span>
        </div>
      ))}
      {collapsed && remaining > 0 && (
        <span className="text-xs text-muted-foreground">... e mais {remaining} alertas</span>
      )}
    </div>
  );
}
