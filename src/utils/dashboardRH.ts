import type { Colaborador } from '../types/colaborador';
import type { Contrato } from '../types/contrato';
import type { Torre, Squad } from '../types/torre';
import type { Diretoria } from '../types/diretoria';
import type { Area } from '../types/area';

// ─── Exported Types ───────────────────────────────────────────────────────────

export interface WorkforceMetrics {
  totalColaboradores: number;
  totalAtivos: number;
  totalDesligados: number;
  taxaOcupacao: number;           // % ativos com squad_ids.length > 0
  totalDiretoriasAtivas: number;  // diretorias com ao menos 1 colaborador ativo
  totalAreasAtivas: number;       // areas com ao menos 1 colaborador ativo
}

export interface ContratoMetrics {
  totalAtivos: number;
  totalPausados: number;
  totalTorresAtivas: number;  // torres vinculadas a contratos ativos
  totalSquadsAtivos: number;  // squads vinculados a contratos ativos
}

export interface SenioridadeItem {
  name: string;   // nível de senioridade
  value: number;  // headcount de ativos
}

export interface DiretoriaItem {
  name: string;   // nome da diretoria ou "Sem Diretoria"
  value: number;  // headcount de ativos
}

export interface AreaHeadcountItem {
  name: string;   // nome da área
  value: number;  // headcount de ativos
}

export interface TorreItem {
  id: string;
  nome: string;
  squadsCount: number;
  totalMembros: number;
}

export interface RecentAdmission {
  id: string;
  nomeCompleto: string;
  senioridade: string;
  dataAdmissao: string;  // formatada DD/MM/AAAA
}

export interface Alert {
  type: 'Squad sem líder' | 'Squad vazio' | 'Colaborador sem diretoria';
  itemName: string;
  itemId: string;
}

// ─── Pure Functions ───────────────────────────────────────────────────────────

/**
 * Calcula métricas gerais de força de trabalho.
 */
export function calcWorkforceMetrics(
  colaboradores: Colaborador[],
  diretorias: Diretoria[],
  areas: Area[],
): WorkforceMetrics {
  const ativos = colaboradores.filter(c => c.status === 'Ativo');
  const totalAtivos = ativos.length;

  const totalDesligados = colaboradores.filter(c => c.status === 'Desligado').length;

  const taxaOcupacao =
    totalAtivos === 0
      ? 0
      : (ativos.filter(c => c.squad_ids.length > 0).length / totalAtivos) * 100;

  const totalDiretoriasAtivas = diretorias.filter(d =>
    ativos.some(c => c.diretoria_id === d.id),
  ).length;

  const totalAreasAtivas = areas.filter(a =>
    ativos.some(c => c.area_ids.includes(a.id)),
  ).length;

  return {
    totalColaboradores: colaboradores.length,
    totalAtivos,
    totalDesligados,
    taxaOcupacao,
    totalDiretoriasAtivas,
    totalAreasAtivas,
  };
}

/**
 * Calcula métricas de saúde dos contratos.
 * `torres` aqui são as torres com squads populados para calcular squads ativos.
 */
export function calcContratoMetrics(
  contratos: Contrato[],
  torres: Torre[],
): ContratoMetrics {
  const contratosAtivos = contratos.filter(c => c.status === 'Ativo');
  const contratosPausados = contratos.filter(c => c.status === 'Pausado');

  // Torres únicas vinculadas a contratos ativos
  const torresAtivasSet = new Set<string>();
  for (const contrato of contratosAtivos) {
    if (contrato.torres) {
      for (const torreId of contrato.torres) {
        torresAtivasSet.add(torreId);
      }
    }
  }

  // Squads cujo contrato_id pertence a um contrato ativo
  const contratosAtivosIds = new Set(contratosAtivos.map(c => c.id));
  let totalSquadsAtivos = 0;
  for (const torre of torres) {
    if (torre.squads) {
      for (const squad of torre.squads) {
        if (squad.contrato_id && contratosAtivosIds.has(squad.contrato_id)) {
          totalSquadsAtivos++;
        }
      }
    }
  }

  return {
    totalAtivos: contratosAtivos.length,
    totalPausados: contratosPausados.length,
    totalTorresAtivas: torresAtivasSet.size,
    totalSquadsAtivos,
  };
}

/**
 * Retorna distribuição de colaboradores ativos por senioridade,
 * ordenada por value desc.
 */
export function calcSenioridadeData(colaboradores: Colaborador[]): SenioridadeItem[] {
  const ativos = colaboradores.filter(c => c.status === 'Ativo');
  const counts = new Map<string, number>();

  for (const c of ativos) {
    counts.set(c.senioridade, (counts.get(c.senioridade) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Retorna distribuição de colaboradores ativos por diretoria.
 * Colaboradores sem diretoria_id são agrupados em "Sem Diretoria".
 */
export function calcDiretoriaData(
  colaboradores: Colaborador[],
  diretorias: Diretoria[],
): DiretoriaItem[] {
  const ativos = colaboradores.filter(c => c.status === 'Ativo');
  const counts = new Map<string, number>();

  for (const c of ativos) {
    const diretoria = diretorias.find(d => d.id === c.diretoria_id);
    const nome = diretoria ? diretoria.nome : 'Sem Diretoria';
    counts.set(nome, (counts.get(nome) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

/**
 * Retorna headcount de colaboradores ativos por área,
 * omitindo áreas sem nenhum colaborador ativo.
 */
export function calcAreaHeadcountData(
  colaboradores: Colaborador[],
  areas: Area[],
): AreaHeadcountItem[] {
  const ativos = colaboradores.filter(c => c.status === 'Ativo');
  const result: AreaHeadcountItem[] = [];

  for (const area of areas) {
    const count = ativos.filter(c => c.area_ids.includes(area.id)).length;
    if (count > 0) {
      result.push({ name: area.nome, value: count });
    }
  }

  return result.sort((a, b) => b.value - a.value);
}

/**
 * Retorna lista de torres com contagem de squads e total de membros,
 * ordenada por squadsCount desc.
 */
export function calcTorresData(torres: Torre[]): TorreItem[] {
  return torres
    .map(torre => {
      const squads = torre.squads ?? [];
      const squadsCount = squads.length;
      const totalMembros = squads.reduce(
        (sum, squad) => sum + (squad.membros?.length ?? 0),
        0,
      );
      return { id: torre.id, nome: torre.nome, squadsCount, totalMembros };
    })
    .sort((a, b) => b.squadsCount - a.squadsCount);
}

/**
 * Retorna os N colaboradores mais recentes ordenados por dataAdmissao desc.
 * A data é formatada em DD/MM/AAAA.
 */
export function calcRecentAdmissions(
  colaboradores: Colaborador[],
  limit: number,
): RecentAdmission[] {
  return [...colaboradores]
    .sort((a, b) => b.dataAdmissao.localeCompare(a.dataAdmissao))
    .slice(0, limit)
    .map(c => ({
      id: c.id,
      nomeCompleto: c.nomeCompleto,
      senioridade: c.senioridade,
      dataAdmissao: formatDateBR(c.dataAdmissao),
    }));
}

/**
 * Gera alertas operacionais:
 * - Squad sem líder (lider === null)
 * - Squad vazio (membros === null ou [])
 * - Colaborador ativo sem diretoria_id
 */
export function calcAlerts(colaboradores: Colaborador[], squads: Squad[]): Alert[] {
  const alerts: Alert[] = [];

  for (const squad of squads) {
    if (squad.lider === null) {
      alerts.push({ type: 'Squad sem líder', itemName: squad.nome, itemId: squad.id });
    }
    if (!squad.membros || squad.membros.length === 0) {
      alerts.push({ type: 'Squad vazio', itemName: squad.nome, itemId: squad.id });
    }
  }

  for (const c of colaboradores) {
    if (c.status === 'Ativo' && !c.diretoria_id) {
      alerts.push({
        type: 'Colaborador sem diretoria',
        itemName: c.nomeCompleto,
        itemId: c.id,
      });
    }
  }

  return alerts;
}

/**
 * Converte uma data ISO (YYYY-MM-DD) para o formato brasileiro DD/MM/AAAA.
 */
export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
