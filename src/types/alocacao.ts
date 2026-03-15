import type { Colaborador, Senioridade } from "./colaborador";

export type ScopeEnum = "especialidade" | "area" | "diretoria";

/** Linha retornada pela view `alocacoes_expandidas` */
export interface AlocacaoExpandida {
  alocacao_id: string;
  colaborador_id: string;
  nome_completo: string;
  senioridade: Senioridade;
  scope: ScopeEnum;
  especialidade_id: string | null;
  especialidade_nome: string | null;
  area_id: string | null;
  area_nome: string | null;
  diretoria_id: string | null;
  diretoria_nome: string | null;
}

/** Retorno da RPC `get_caminho_colaborador` */
export interface CaminhoHierarquico {
  caminho: string;          // ex: "Diretoria > Área > Especialidade"
  gestor_id: string | null;
  gestor_nome: string | null;
  gestor_senioridade: Senioridade | null;
}

/** Colaborador com suas alocações expandidas e caminho hierárquico */
export interface ColaboradorComAlocacoes extends Colaborador {
  alocacoes: AlocacaoExpandida[];
  caminho: CaminhoHierarquico | null;
}

/** Input para inserção na tabela `alocacoes` */
export interface AlocacaoInput {
  colaborador_id: string;
  scope: ScopeEnum;
  especialidade_id?: string | null;
  area_id?: string | null;
  diretoria_id?: string | null;
}

/** Linha retornada pela RPC `get_subordinados` */
export interface SubordinadoRow {
  colaborador_id: string;
  nome_completo: string;
  senioridade: Senioridade;
  via_scope: string;
  via_id: string | null;
  via_nome: string | null;
}
