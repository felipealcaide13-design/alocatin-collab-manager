import { supabase } from "@/lib/supabase";
import { EventoBUTorreSquad, TipoEventoBU, EntidadeTipo } from "@/types/historicoBU";
import { CampoLiderancaConfig } from "@/types/configuracaoTorre";

type LiderancaMap = Record<string, string | null>;

export function diffLiderancas(
  entidadeId: string,
  entidadeTipo: EntidadeTipo,
  anterior: LiderancaMap,
  novo: LiderancaMap
): Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[] {
  const eventos: Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[] = [];
  const todosOsCargos = new Set([...Object.keys(anterior), ...Object.keys(novo)]);

  for (const cargo of todosOsCargos) {
    const ant = anterior[cargo] ?? null;
    const nov = novo[cargo] ?? null;

    if (ant === nov) continue;

    let tipo_evento: TipoEventoBU;
    let snapshot_dados: Record<string, unknown>;

    if (!ant && nov) {
      tipo_evento = "lideranca_atribuida";
      snapshot_dados = { cargo, colaborador_novo_id: nov };
    } else if (ant && !nov) {
      tipo_evento = "lideranca_removida";
      snapshot_dados = { cargo, colaborador_anterior_id: ant };
    } else {
      tipo_evento = "lideranca_alterada";
      snapshot_dados = { cargo, colaborador_anterior_id: ant, colaborador_novo_id: nov };
    }

    eventos.push({ tipo_evento, entidade_tipo: entidadeTipo, entidade_id: entidadeId, entidade_pai_id: null, snapshot_dados, autor_alteracao: "sistema" });
  }

  return eventos;
}

export function diffCamposLideranca(
  entidadeId: string,
  entidadeTipo: EntidadeTipo,
  anterior: CampoLiderancaConfig[],
  novo: CampoLiderancaConfig[]
): Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[] {
  const eventos: Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[] = [];
  const mapAnt = new Map(anterior.map((c) => [c.id, c]));
  const mapNov = new Map(novo.map((c) => [c.id, c]));

  for (const [id, camp] of mapNov) {
    if (!mapAnt.has(id)) {
      eventos.push({ tipo_evento: "campo_lideranca_criado", entidade_tipo: entidadeTipo, entidade_id: entidadeId, entidade_pai_id: null, snapshot_dados: { campo_id: id, nome: camp.nome, senioridade: camp.senioridade, diretoria_id: camp.diretoria_id }, autor_alteracao: "sistema" });
    } else {
      const a = mapAnt.get(id)!;
      if (a.nome !== camp.nome || a.senioridade !== camp.senioridade || a.diretoria_id !== camp.diretoria_id) {
        eventos.push({ tipo_evento: "campo_lideranca_alterado", entidade_tipo: entidadeTipo, entidade_id: entidadeId, entidade_pai_id: null, snapshot_dados: { campo_id: id, antes: { nome: a.nome, senioridade: a.senioridade, diretoria_id: a.diretoria_id }, depois: { nome: camp.nome, senioridade: camp.senioridade, diretoria_id: camp.diretoria_id } }, autor_alteracao: "sistema" });
      }
    }
  }

  for (const [id, camp] of mapAnt) {
    if (!mapNov.has(id)) {
      eventos.push({ tipo_evento: "campo_lideranca_removido", entidade_tipo: entidadeTipo, entidade_id: entidadeId, entidade_pai_id: null, snapshot_dados: { campo_id: id, nome: camp.nome, senioridade: camp.senioridade, diretoria_id: camp.diretoria_id }, autor_alteracao: "sistema" });
    }
  }

  return eventos;
}

export const historicoBUService = {
  async registrarEvento(evento: Omit<EventoBUTorreSquad, "id" | "ocorrido_em">): Promise<void> {
    const { error } = await supabase.from("historico_bu_torre_squad").insert(evento);
    if (error) throw new Error(error.message);
  },

  async registrarEventos(eventos: Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[]): Promise<void> {
    if (eventos.length === 0) return;
    const { error } = await supabase.from("historico_bu_torre_squad").insert(eventos);
    if (error) throw new Error(error.message);
  },

  async getEventosByPeriodo(dataInicio: Date, dataFim: Date): Promise<EventoBUTorreSquad[]> {
    const { data, error } = await supabase
      .from("historico_bu_torre_squad")
      .select("*")
      .gte("ocorrido_em", dataInicio.toISOString())
      .lte("ocorrido_em", dataFim.toISOString())
      .order("ocorrido_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as EventoBUTorreSquad[];
  },

  async getEventosByEntidade(entidadeId: string): Promise<EventoBUTorreSquad[]> {
    const { data, error } = await supabase
      .from("historico_bu_torre_squad")
      .select("*")
      .eq("entidade_id", entidadeId)
      .order("ocorrido_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as EventoBUTorreSquad[];
  },
};
