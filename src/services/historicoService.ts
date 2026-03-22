import type { Colaborador, ColaboradorInput } from "@/types/colaborador";
import type { CampoRastreavel, EventoAlteracao } from "@/types/historico";
import { CAMPOS_RASTREAVEIS } from "@/types/historico";
import { supabase } from "@/lib/supabase";

const CAMPOS_ARRAY: readonly CampoRastreavel[] = ["torre_ids", "squad_ids"] as const;

export interface NomesEntidades {
  torres?: Record<string, string>;   // id → nome
  squads?: Record<string, string>;   // id → nome
  diretorias?: Record<string, string>;
  businessUnits?: Record<string, string>;
}

function serializarValor(
  campo: CampoRastreavel,
  valor: unknown,
  nomes?: NomesEntidades
): string | null {
  if (valor === null || valor === undefined) return null;

  if (CAMPOS_ARRAY.includes(campo)) {
    const ids = Array.isArray(valor) ? valor as string[] : [];
    const mapa = campo === "torre_ids" ? nomes?.torres : nomes?.squads;
    if (mapa) {
      // Salva [{id, nome}] para preservar o nome mesmo após deleção
      const enriquecido = ids.map((id) => ({ id, nome: mapa[id] ?? null }));
      return JSON.stringify(enriquecido);
    }
    return JSON.stringify(ids);
  }

  if (campo === "bu_id" && nomes?.businessUnits) {
    const id = String(valor);
    const nome = nomes.businessUnits[id] ?? null;
    return nome ? JSON.stringify({ id, nome }) : id;
  }

  if (campo === "diretoria_id" && nomes?.diretorias) {
    const id = String(valor);
    const nome = nomes.diretorias[id] ?? null;
    return nome ? JSON.stringify({ id, nome }) : id;
  }

  return String(valor);
}

/**
 * Compara o estado anterior do colaborador com o patch recebido e retorna
 * os eventos de alteração para os campos rastreáveis que mudaram de valor.
 * Aceita `nomes` opcionais para enriquecer o snapshot com nomes legíveis.
 */
export function diffCamposRastreaveis(
  anterior: Colaborador,
  patch: Partial<ColaboradorInput>,
  nomes?: NomesEntidades
): Omit<EventoAlteracao, "id" | "alterado_em">[] {
  const eventos: Omit<EventoAlteracao, "id" | "alterado_em">[] = [];

  for (const campo of CAMPOS_RASTREAVEIS) {
    // Só processar campos presentes no patch
    if (!(campo in patch)) continue;

    const valorAnterior = serializarValor(campo, anterior[campo as keyof Colaborador], nomes);
    const novoValor = serializarValor(campo, patch[campo as keyof ColaboradorInput], nomes);

    // Omitir se não houve mudança real — comparar apenas os IDs para arrays enriquecidos
    if (valorAnterior === novoValor) continue;

    // Para arrays enriquecidos, comparar só os IDs para evitar falsos positivos
    if (CAMPOS_ARRAY.includes(campo) && nomes) {
      try {
        const antIds = (JSON.parse(valorAnterior ?? "[]") as any[]).map((x) =>
          typeof x === "object" ? x.id : x
        );
        const novIds = (JSON.parse(novoValor ?? "[]") as any[]).map((x) =>
          typeof x === "object" ? x.id : x
        );
        if (JSON.stringify(antIds) === JSON.stringify(novIds)) continue;
      } catch {
        // fallback: usa comparação de string
      }
    }

    eventos.push({
      colaborador_id: anterior.id,
      campo,
      valor_anterior: valorAnterior,
      novo_valor: novoValor,
      autor_alteracao: "sistema",
    });
  }

  return eventos;
}

export const historicoService = {
  async registrar(eventos: Omit<EventoAlteracao, "id" | "alterado_em">[]): Promise<void> {
    if (eventos.length === 0) return;

    // Não incluir alterado_em — gerado pelo banco via DEFAULT now()
    const { error } = await supabase.from("historico_alteracoes").insert(eventos);
    if (error) throw new Error(error.message);
  },

  async getByColaborador(colaboradorId: string): Promise<EventoAlteracao[]> {
    const { data, error } = await supabase
      .from("historico_alteracoes")
      .select("*")
      .eq("colaborador_id", colaboradorId)
      .order("alterado_em", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as EventoAlteracao[];
  },
};
