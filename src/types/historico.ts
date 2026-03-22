export type CampoRastreavel =
  | "cadastro"
  | "senioridade"
  | "diretoria_id"
  | "status"
  | "bu_id"
  | "torre_ids"
  | "squad_ids";

export const CAMPOS_RASTREAVEIS: readonly CampoRastreavel[] = [
  "senioridade",
  "diretoria_id",
  "status",
  "bu_id",
  "torre_ids",
  "squad_ids",
] as const;

export const ROTULOS_CAMPOS: Record<CampoRastreavel, string> = {
  cadastro:     "Cadastro",
  senioridade:  "Senioridade",
  diretoria_id: "Diretoria",
  status:       "Status",
  bu_id:        "Business Unit",
  torre_ids:    "Torres",
  squad_ids:    "Squads",
};

export interface EventoAlteracao {
  id: string;
  colaborador_id: string;
  campo: CampoRastreavel;
  valor_anterior: string | null;
  novo_valor: string | null;
  alterado_em: string;
  autor_alteracao: string | null;
}
