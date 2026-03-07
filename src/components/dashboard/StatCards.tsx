import { Users, UserCheck, UserX, Building2 } from "lucide-react";
import type { Colaborador } from "@/types/colaborador";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  colaboradores: Colaborador[];
}

export function StatCards({ colaboradores }: StatCardsProps) {
  const total = colaboradores.length;
  const ativos = colaboradores.filter((c) => c.status === "Ativo").length;
  const desligados = colaboradores.filter((c) => c.status === "Desligado").length;
  const pilares = new Set(colaboradores.map((c) => c.pilar)).size;

  const cards = [
    {
      title: "Total de Colaboradores",
      value: total,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary-muted",
    },
    {
      title: "Colaboradores Ativos",
      value: ativos,
      icon: UserCheck,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Colaboradores Desligados",
      value: desligados,
      icon: UserX,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Pilares Ativos",
      value: pilares,
      icon: Building2,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, icon: Icon, color, bg }) => (
        <div key={title} className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
          </div>
          <p className={cn("text-3xl font-bold", color)}>{value}</p>
        </div>
      ))}
    </div>
  );
}
