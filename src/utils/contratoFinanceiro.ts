/**
 * Utilitário de cálculo financeiro para contratos Abertos e Fechados.
 *
 * Aberto  → valor = receita mensal recorrente; end_date opcional.
 * Fechado → valor = total do período; end_date obrigatório.
 */

export type ContractType = 'Aberto' | 'Fechado';

export interface ContratoFinanceiro {
  contract_type: ContractType;
  valor: number;
  data_inicio: string; // ISO date 'YYYY-MM-DD'
  data_fim?: string | null;
}

export interface ResultadoFinanceiro {
  receita_anual_prevista: number;
  receita_mensal: number;
  /** Margem mensal = receita_mensal - custo_mensal */
  margem_mensal: number;
  /** Margem total do período (igual à mensal * meses para Fechado) */
  margem_total: number;
  /** Percentual de margem sobre a receita mensal */
  margem_percentual: number;
  /** Número de meses do contrato (null para Aberto sem data_fim) */
  meses_contrato: number | null;
}

/** Calcula a diferença em meses entre duas datas ISO. */
function diffMeses(inicio: string, fim: string): number {
  const [yi, mi] = inicio.split('-').map(Number);
  const [yf, mf] = fim.split('-').map(Number);
  return Math.max(1, (yf - yi) * 12 + (mf - mi));
}

/**
 * Calcula os indicadores financeiros de um contrato.
 *
 * @param contrato  Dados do contrato
 * @param custos    Soma dos custos cadastrados (contract_costs.valor).
 *                  Para Aberto: total mensal. Para Fechado: total do período.
 */
export function calcularFinanceiro(
  contrato: ContratoFinanceiro,
  custos: number = 0
): ResultadoFinanceiro {
  const { contract_type, valor, data_inicio, data_fim } = contrato;

  if (contract_type === 'Aberto') {
    const receita_mensal = valor;
    const receita_anual_prevista = valor * 12;
    const custo_mensal = custos; // custos já são mensais
    const margem_mensal = receita_mensal - custo_mensal;
    const margem_total = margem_mensal; // sem horizonte fixo, retorna mensal
    const margem_percentual =
      receita_mensal > 0
        ? Math.round((margem_mensal / receita_mensal) * 10000) / 100
        : 0;

    return {
      receita_anual_prevista,
      receita_mensal,
      margem_mensal,
      margem_total,
      margem_percentual,
      meses_contrato: null,
    };
  }

  // Fechado
  if (!data_fim) {
    throw new Error('Contrato Fechado exige data_fim.');
  }

  const meses_contrato = diffMeses(data_inicio, data_fim);
  const receita_anual_prevista = valor; // total do período
  const receita_mensal = Math.round((valor / meses_contrato) * 100) / 100;
  const custo_mensal = Math.round((custos / meses_contrato) * 100) / 100;
  const margem_mensal = receita_mensal - custo_mensal;
  const margem_total = valor - custos; // total do período
  const margem_percentual =
    receita_mensal > 0
      ? Math.round((margem_mensal / receita_mensal) * 10000) / 100
      : 0;

  return {
    receita_anual_prevista,
    receita_mensal,
    margem_mensal,
    margem_total,
    margem_percentual,
    meses_contrato,
  };
}

/**
 * Agrega múltiplos contratos para o painel de faturamento mensal.
 * Retorna o total de receita mensal da empresa (Abertos + média mensal dos Fechados).
 */
export function calcularFaturamentoConsolidado(
  contratos: Array<ContratoFinanceiro & { custos?: number }>
): {
  receita_mensal_total: number;
  receita_anual_prevista_total: number;
  custo_mensal_total: number;
  margem_mensal_total: number;
  margem_percentual_media: number;
} {
  const resultados = contratos.map((c) =>
    calcularFinanceiro(c, c.custos ?? 0)
  );

  const receita_mensal_total = resultados.reduce((s, r) => s + r.receita_mensal, 0);
  const receita_anual_prevista_total = resultados.reduce((s, r) => s + r.receita_anual_prevista, 0);
  const custo_mensal_total = resultados.reduce((s, r) => s + (r.receita_mensal - r.margem_mensal), 0);
  const margem_mensal_total = receita_mensal_total - custo_mensal_total;
  const margem_percentual_media =
    receita_mensal_total > 0
      ? Math.round((margem_mensal_total / receita_mensal_total) * 10000) / 100
      : 0;

  return {
    receita_mensal_total,
    receita_anual_prevista_total,
    custo_mensal_total,
    margem_mensal_total,
    margem_percentual_media,
  };
}
