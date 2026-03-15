import { FileCheck, CirclePause, Layers, UsersRound } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import type { ContratoMetrics } from '@/utils/dashboardRH';

interface ContratoStatCardsProps {
  metrics: ContratoMetrics;
  isLoading: boolean;
}

export function ContratoStatCards({ metrics, isLoading }: ContratoStatCardsProps) {
  const cards = [
    {
      title: 'Contratos Ativos',
      value: metrics.totalAtivos,
      icon: FileCheck,
      variant: 'success' as const,
    },
    {
      title: 'Contratos Pausados',
      value: metrics.totalPausados,
      icon: CirclePause,
      variant: 'warning' as const,
    },
    {
      title: 'Torres Ativas',
      value: metrics.totalTorresAtivas,
      icon: Layers,
      variant: 'info' as const,
    },
    {
      title: 'Squads Ativos',
      value: metrics.totalSquadsAtivos,
      icon: UsersRound,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
