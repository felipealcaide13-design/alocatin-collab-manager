import { Button } from '@/components/ui/button';
import type { RecentAdmission } from '@/utils/dashboardRH';

interface RecentAdmissionsListProps {
  admissions: RecentAdmission[];
  collapsed: boolean;
  onViewAll: () => void;
}

export function RecentAdmissionsList({ admissions, collapsed, onViewAll }: RecentAdmissionsListProps) {
  if (admissions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum colaborador cadastrado</p>;
  }

  const visible = collapsed ? admissions.slice(0, 5) : admissions.slice(0, 10);

  return (
    <div>
      <ul className="divide-y">
        {visible.map((admission) => (
          <li key={admission.id} className="py-2">
            <p className="text-sm font-medium">{admission.nomeCompleto}</p>
            <p className="text-sm text-muted-foreground">{admission.senioridade}</p>
            <p className="text-xs text-muted-foreground">{admission.dataAdmissao}</p>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={onViewAll}>
        Ver todos
      </Button>
    </div>
  );
}
