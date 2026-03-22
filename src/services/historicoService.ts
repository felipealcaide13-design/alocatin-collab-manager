import type { Colaborador, ColaboradorInput } from "@/types/colaborador";
import type { CampoRastreavel, EventoAlteracao } from "@/types/historico";
import { CAMPOS_RASTREAVEIS } from "@/types/historico";
import { supabase } from "@/lib/supabase";

const CAMPOS_ARRAY: readonly CampoRastreavel[] = ["torre_ids", "squad_ids"] as const;

function serializarValor(campo: CampoRastreavel, valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (CAMPOS_ARRAY.includes(campo)) {
    return JSON.stringify(valor);
  }
  return String(valor);
}

/**
 * Compara o estado anterior do colaborador com o patch recebido e retorna
 * os eventos de alteração para os campos rastreáveis que mudaram de valor.
 */
export function diffCamposRastreaveis(
  anterior: Colaborador,
  patch: Partial<ColaboradorInput>
): Omit<EventoAlteracao, "id" | "alterado_em">[] {
  const eventos: Omit<EventoAlteracao, "id" | "alterado_em">[] = [];

  for (const campo of CAMPOS_RASTREAVEIS) {
    // Só processar campos presentes no patch
    if (!(campo in patch)) continue;

    const valorAnterior = serializarValor(campo, anterior[campo as keyof Colaborador]);
    const novoValor = serializarValor(campo, patch[campo as keyof ColaboradorInput]);

    // Omitir se não houve mudança real
    if (valorAnterior === novoValor) continue;

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
