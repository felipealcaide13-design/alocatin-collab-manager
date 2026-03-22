export type TipoEventoBU =
  | "bu_criada" | "bu_alterada" | "bu_deletada"
  | "torre_criada" | "torre_alterada" | "torre_deletada"
  | "squad_criado" | "squad_alterado" | "squad_deletado"
  | "campo_lideranca_criado" | "campo_lideranca_alterado" | "campo_lideranca_removido"
  | "lideranca_atribuida" | "lideranca_alterada" | "lideranca_removida";

export type EntidadeTipo = "bu" | "torre" | "squad";

export interface EventoBUTorreSquad {
  id: string;
  tipo_evento: TipoEventoBU;
  entidade_tipo: EntidadeTipo;
  entidade_id: string;
  entidade_pai_id: string | null;
  snapshot_dados: Record<string, unknown>;
  ocorrido_em: string;
  autor_alteracao: string | null;
}
