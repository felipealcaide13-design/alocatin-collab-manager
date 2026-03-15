import { Users, UserCheck, UserX, Percent, Building2, LayoutGrid } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import type { WorkforceMetrics } from '@/utils/dashboardRH';

interface WorkforceStatCardsProps {
  metrics: WorkforceMetrics;
  isLoading: boolean;
}

export function WorkforceStatCards({ metrics, isLoading }: WorkforceStatCardsProps) {
  const cards = [
    {
      title: 'Total Colaboradores',
      value: metrics.totalColaboradores,
      icon: Users,
      variant: 'default' as const,
    },
    {
      title: 'Ativos',
      value: metrics.totalAtivos,
      icon: UserCheck,
      variant: 'success' as const,
    },
    {
      title: 'Desligados',
      value: metrics.totalDesligados,
      icon: UserX,
      variant: 'danger' as const,
    },
    {
      title: 'Taxa de Ocupação',
      value: `${metrics.taxaOcupacao.toFixed(1)}%`,
      icon: Percent,
      variant: 'info' as const,
    },
    {
      title: 'Diretorias Ativas',
      value: metrics.totalDiretoriasAtivas,
      icon: Building2,
      variant: 'warning' as const,
    },
    {
      title: 'Áreas Ativas',
      value: metrics.totalAreasAtivas,
      icon: LayoutGrid,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
