import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/StatCards";
import { PilarChart, SenioridadeChart } from "@/components/dashboard/Charts";
import { colaboradorService } from "@/services/colaboradorService";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => colaboradorService.getAll(),
  });

  const top10 = colaboradores.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral dos colaboradores</p>
        </div>
        <Button onClick={() => navigate("/colaboradores")} className="w-fit">
          Gerenciar Colaboradores
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <StatCards colaboradores={colaboradores} />
      )}

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PilarChart colaboradores={colaboradores} />
          <SenioridadeChart colaboradores={colaboradores} />
        </div>
      )}

      {/* Top 10 Table */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-foreground">Colaboradores Recentes</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/colaboradores")}>
            Ver todos <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground hidden md:table-cell">Área</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground hidden lg:table-cell">Subárea</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground hidden sm:table-cell">Senioridade</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    </tr>
                  ))
                : top10.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 font-medium">{c.nomeCompleto}</td>
                      <td className="px-6 py-3 text-muted-foreground hidden md:table-cell">{c.area}</td>
                      <td className="px-6 py-3 text-muted-foreground hidden lg:table-cell">
                        {c.subarea || <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground hidden sm:table-cell">{c.senioridade}</td>
                      <td className="px-6 py-3">
                        <span className={c.status === "Ativo" ? "badge-active" : "badge-inactive"}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
