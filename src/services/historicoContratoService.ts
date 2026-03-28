import type { Contrato, ContratoInput } from "@/types/contrato";
import type { CampoRastreavelContrato, EventoAlteracaoContrato } from "@/types/historicoContrato";
import { CAMPOS_RASTREAVEIS_CONTRATO } from "@/types/historicoContrato";
import { supabase } from "@/lib/supabase";

export interface NomesEntidadesContrato {
  torres?: Record<string, string>;
  squads?: Record<string, string>;
}

function serializarValor(
  campo: CampoRastreavelContrato,
  valor: unknown,
  nomes?: NomesEntidadesContrato
): string | null {
  if (valor === null || valor === undefined) return null;

  if (campo === "torres" || campo === "squads_ids") {
    const ids = Array.isArray(valor) ? valor as string[] : [];
    const mapa = campo === "torres" ? nomes?.torres : nomes?.squads;
    if (mapa) {
      const enriquecido = ids.map((id) => ({ id, nome: mapa[id] ?? null }));
      return JSON.stringify(enriquecido);
    }
    return JSON.stringify(ids);
  }

  return String(valor);
}

export function diffCamposRastreaveisContrato(
  anterior: Contrato,
  patch: Partial<ContratoInput>,
  nomes?: NomesEntidadesContrato
): Omit<EventoAlteracaoContrato, "id" | "alterado_em">[] {
  const eventos: Omit<EventoAlteracaoContrato, "id" | "alterado_em">[] = [];

  for (const campo of CAMPOS_RASTREAVEIS_CONTRATO) {
    if (!(campo in patch)) continue;

    const valorAnterior = serializarValor(campo, anterior[campo as keyof Contrato], nomes);
    const novoValor = serializarValor(campo, patch[campo as keyof ContratoInput], nomes);

    if (valorAnterior === novoValor) continue;

    if ((campo === "torres" || campo === "squads_ids") && nomes) {
      try {
        const antIds = (JSON.parse(valorAnterior ?? "[]") as any[]).map((x: any) =>
          typeof x === "object" ? x.id : x
        );
        const novIds = (JSON.parse(novoValor ?? "[]") as any[]).map((x: any) =>
          typeof x === "object" ? x.id : x
        );
        if (JSON.stringify(antIds) === JSON.stringify(novIds)) continue;
      } catch {
        // fallback
      }
    }

    eventos.push({
      contrato_id: anterior.id,
      campo,
      valor_anterior: valorAnterior,
      novo_valor: novoValor,
      autor_alteracao: "sistema", // Pode ser adaptado depois se houver user logado
    });
  }

  return eventos;
}

export const historicoContratoService = {
  async registrar(eventos: Omit<EventoAlteracaoContrato, "id" | "alterado_em">[]): Promise<void> {
    if (eventos.length === 0) return;

    const { error } = await supabase.from("historico_alteracoes_contrato").insert(eventos);
    if (error) {
      console.error("Erro ao registrar no histórico:", error.message);
    }
  },

  async getByContrato(contratoId: string): Promise<EventoAlteracaoContrato[]> {
    const { data, error } = await supabase
      .from("historico_alteracoes_contrato")
      .select("*")
      .eq("contrato_id", contratoId)
      .order("alterado_em", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as EventoAlteracaoContrato[];
  },
};
