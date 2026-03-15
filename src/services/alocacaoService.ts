import { supabase } from "@/lib/supabase";
import type {
  AlocacaoExpandida,
  AlocacaoInput,
  CaminhoHierarquico,
  ColaboradorComAlocacoes,
  SubordinadoRow,
} from "@/types/alocacao";
import { colaboradorService } from "./colaboradorService";

function fromDbExpandida(row: any): AlocacaoExpandida {
  return {
    alocacao_id: row.alocacao_id,
    colaborador_id: row.colaborador_id,
    nome_completo: row.nome_completo,
    senioridade: row.senioridade,
    scope: row.scope,
    especialidade_id: row.especialidade_id ?? null,
    especialidade_nome: row.especialidade_nome ?? null,
    area_id: row.area_id ?? null,
    area_nome: row.area_nome ?? null,
    diretoria_id: row.diretoria_id ?? null,
    diretoria_nome: row.diretoria_nome ?? null,
  };
}

export const alocacaoService = {
  /** Busca alocações expandidas de um colaborador via view */
  async getByColaborador(colaboradorId: string): Promise<AlocacaoExpandida[]> {
    const { data, error } = await supabase
      .from("alocacoes_expandidas")
      .select("*")
      .eq("colaborador_id", colaboradorId);
    if (error) throw new Error(error.message);
    return (data || []).map(fromDbExpandida);
  },

  /** Insere uma alocação — o trigger no banco valida as regras */
  async alocar(input: AlocacaoInput): Promise<void> {
    const { error } = await supabase.from("alocacoes").insert({
      colaborador_id: input.colaborador_id,
      scope: input.scope,
      especialidade_id: input.especialidade_id ?? null,
      area_id: input.area_id ?? null,
      diretoria_id: input.diretoria_id ?? null,
    });
    if (error) throw new Error(error.message);
  },

  /** Remove uma alocação pelo id */
  async desalocar(alocacaoId: string): Promise<void> {
    const { error } = await supabase.from("alocacoes").delete().eq("id", alocacaoId);
    if (error) throw new Error(error.message);
  },

  /** Chama RPC `get_caminho_colaborador` */
  async getCaminho(colaboradorId: string): Promise<CaminhoHierarquico | null> {
    const { data, error } = await supabase.rpc("get_caminho_colaborador", {
      p_colaborador_id: colaboradorId,
    });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;
    const row = data[0];
    return {
      caminho: row.caminho,
      gestor_id: row.gestor_id ?? null,
      gestor_nome: row.gestor_nome ?? null,
      gestor_senioridade: row.gestor_senioridade ?? null,
    };
  },

  /** Chama RPC `get_subordinados` */
  async getSubordinados(gestorId: string): Promise<SubordinadoRow[]> {
    const { data, error } = await supabase.rpc("get_subordinados", {
      p_gestor_id: gestorId,
    });
    if (error) throw new Error(error.message);
    return (data || []) as SubordinadoRow[];
  },

  /** Monta ColaboradorComAlocacoes combinando colaborador + alocações + caminho */
  async getColaboradorComAlocacoes(colaboradorId: string): Promise<ColaboradorComAlocacoes> {
    const [colaborador, alocacoes, caminho] = await Promise.all([
      colaboradorService.getById(colaboradorId),
      alocacaoService.getByColaborador(colaboradorId),
      alocacaoService.getCaminho(colaboradorId),
    ]);
    if (!colaborador) throw new Error(`Colaborador ${colaboradorId} não encontrado`);
    return { ...colaborador, alocacoes, caminho };
  },
};
