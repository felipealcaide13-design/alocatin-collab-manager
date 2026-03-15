import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useDashboardRH } from "@/hooks/useDashboardRH";
import { WorkforceStatCards } from "@/components/dashboard/WorkforceStatCards";
import { ContratoStatCards } from "@/components/dashboard/ContratoStatCards";
import { ExpandableCard } from "@/components/dashboard/ExpandableCard";
import { SenioridadeBarChart } from "@/components/dashboard/SenioridadeBarChart";
import { DiretoriaPieChart } from "@/components/dashboard/DiretoriaPieChart";
import { AreaBarChart } from "@/components/dashboard/AreaBarChart";
import { RecentAdmissionsList } from "@/components/dashboard/RecentAdmissionsList";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TorresList } from "@/components/dashboard/TorresList";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/ui/page-layout";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 11) return "Bom dia";
  if (hour >= 12 && hour <= 17) return "Boa tarde";
  return "Boa noite";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
      <span className="w-1 h-4 bg-[var(--primary-600)] rounded-full inline-block" />
      {children}
    </p>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    isLoading,
    workforceMetrics,
    contratoMetrics,
    senioridadeData,
    diretoriaData,
    areaHeadcountData,
    torresData,
    recentAdmissions,
    alerts,
  } = useDashboardRH();

  const lastUpdate = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lastUpdateBadge = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border rounded-full px-3 py-1.5">
      <RefreshCw className="h-3 w-3" />
      <span>Atualizado em {lastUpdate}</span>
    </div>
  );

  return (
    <PageLayout title={`${getGreeting()}, RH 👋`} action={lastUpdateBadge}>

      {/* Seção 1 — Força de Trabalho */}
      <div>
        <SectionTitle>Força de Trabalho</SectionTitle>
        <WorkforceStatCards metrics={workforceMetrics} isLoading={isLoading} />
      </div>

      {/* Seção 2 — Contratos */}
      <div>
        <SectionTitle>Contratos</SectionTitle>
        <ContratoStatCards metrics={contratoMetrics} isLoading={isLoading} />
      </div>

      {/* Seção 3 — Visão Operacional */}
      <div>
        <SectionTitle>Visão Operacional</SectionTitle>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExpandableCard
              title="Distribuição por Senioridade"
              preview={<SenioridadeBarChart data={senioridadeData} collapsed={true} />}
              full={<SenioridadeBarChart data={senioridadeData} collapsed={false} />}
            />
            <ExpandableCard
              title="Distribuição por Diretoria"
              preview={<DiretoriaPieChart data={diretoriaData} collapsed={true} />}
              full={<DiretoriaPieChart data={diretoriaData} collapsed={false} />}
            />
            <ExpandableCard
              title="Headcount por Área"
              preview={<AreaBarChart data={areaHeadcountData} collapsed={true} />}
              full={<AreaBarChart data={areaHeadcountData} collapsed={false} />}
            />
            <ExpandableCard
              title="Admissões Recentes"
              preview={
                <RecentAdmissionsList
                  admissions={recentAdmissions}
                  collapsed={true}
                  onViewAll={() => navigate('/colaboradores')}
                />
              }
              full={
                <RecentAdmissionsList
                  admissions={recentAdmissions}
                  collapsed={false}
                  onViewAll={() => navigate('/colaboradores')}
                />
              }
            />
            <ExpandableCard
              title="Alertas Operacionais"
              preview={<AlertsPanel alerts={alerts} collapsed={true} />}
              full={<AlertsPanel alerts={alerts} collapsed={false} />}
            />
            <ExpandableCard
              title="Torres e Squads"
              preview={<TorresList torres={torresData} collapsed={true} />}
              full={<TorresList torres={torresData} collapsed={false} />}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
