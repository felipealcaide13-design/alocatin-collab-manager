import { useQuery } from '@tanstack/react-query';
import { colaboradorService } from '@/services/colaboradorService';
import { contratoService } from '@/services/contratoService';
import { torreService } from '@/services/torreService';
import { diretoriaService } from '@/services/diretoriaService';
import { areaService } from '@/services/areaService';
import {
  calcWorkforceMetrics,
  calcContratoMetrics,
  calcSenioridadeData,
  calcDiretoriaData,
  calcAreaHeadcountData,
  calcTorresData,
  calcRecentAdmissions,
  calcAlerts,
} from '@/utils/dashboardRH';
import type {
  WorkforceMetrics,
  ContratoMetrics,
  SenioridadeItem,
  DiretoriaItem,
  AreaHeadcountItem,
  TorreItem,
  RecentAdmission,
  Alert,
} from '@/utils/dashboardRH';

export interface DashboardRHData {
  isLoading: boolean;
  workforceMetrics: WorkforceMetrics;
  contratoMetrics: ContratoMetrics;
  senioridadeData: SenioridadeItem[];
  diretoriaData: DiretoriaItem[];
  areaHeadcountData: AreaHeadcountItem[];
  torresData: TorreItem[];
  recentAdmissions: RecentAdmission[];
  alerts: Alert[];
}

const emptyWorkforceMetrics: WorkforceMetrics = {
  totalColaboradores: 0,
  totalAtivos: 0,
  totalDesligados: 0,
  taxaOcupacao: 0,
  totalDiretoriasAtivas: 0,
  totalAreasAtivas: 0,
};

const emptyContratoMetrics: ContratoMetrics = {
  totalAtivos: 0,
  totalPausados: 0,
  totalTorresAtivas: 0,
  totalSquadsAtivos: 0,
};

export function useDashboardRH(): DashboardRHData {
  const colaboradoresQuery = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => colaboradorService.getAll(),
  });

  const contratosQuery = useQuery({
    queryKey: ['contratos'],
    queryFn: () => contratoService.getAll(),
  });

  const torresQuery = useQuery({
    queryKey: ['torres'],
    queryFn: () => torreService.getAllTorres(),
  });

  const diretoriasQuery = useQuery({
    queryKey: ['diretorias'],
    queryFn: () => diretoriaService.getAll(),
  });

  const areasQuery = useQuery({
    queryKey: ['areas'],
    queryFn: () => areaService.getAll(),
  });

  const isLoading =
    colaboradoresQuery.isLoading ||
    contratosQuery.isLoading ||
    torresQuery.isLoading ||
    diretoriasQuery.isLoading ||
    areasQuery.isLoading;

  const colaboradores = colaboradoresQuery.data ?? [];
  const contratos = contratosQuery.data ?? [];
  const torres = torresQuery.data ?? [];
  const diretorias = diretoriasQuery.data ?? [];
  const areas = areasQuery.data ?? [];

  const allSquads = torres.flatMap(t => t.squads ?? []);

  return {
    isLoading,
    workforceMetrics: isLoading
      ? emptyWorkforceMetrics
      : calcWorkforceMetrics(colaboradores, diretorias, areas),
    contratoMetrics: isLoading
      ? emptyContratoMetrics
      : calcContratoMetrics(contratos, torres),
    senioridadeData: isLoading ? [] : calcSenioridadeData(colaboradores),
    diretoriaData: isLoading ? [] : calcDiretoriaData(colaboradores, diretorias),
    areaHeadcountData: isLoading ? [] : calcAreaHeadcountData(colaboradores, areas),
    torresData: isLoading ? [] : calcTorresData(torres),
    recentAdmissions: isLoading ? [] : calcRecentAdmissions(colaboradores, 10),
    alerts: isLoading ? [] : calcAlerts(colaboradores, allSquads),
  };
}
