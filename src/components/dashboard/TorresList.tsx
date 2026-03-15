import { Badge } from '@/components/ui/badge';
import type { TorreItem } from '@/utils/dashboardRH';

interface TorresListProps {
  torres: TorreItem[];
  collapsed: boolean;
}

export function TorresList({ torres, collapsed }: TorresListProps) {
  if (torres.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma torre cadastrada</p>;
  }

  const visible = collapsed ? torres.slice(0, 4) : torres;

  return (
    <ul className="divide-y">
      {visible.map((torre) => (
        <li key={torre.id} className="py-2 flex justify-between items-center">
          <span className="text-sm font-medium">{torre.nome}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{torre.squadsCount} squads</Badge>
            <span className="text-xs text-muted-foreground">{torre.totalMembros} membros</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
