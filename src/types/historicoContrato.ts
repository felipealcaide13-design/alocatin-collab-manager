export type CampoRastreavelContrato =
  | "nome"
  | "cliente"
  | "valor"
  | "contract_type"
  | "data_inicio"
  | "data_fim"
  | "status"
  | "descricao"
  | "torres"
  | "squads_ids"
  | "arquivo_nome"
  | "cadastro";

export interface EventoAlteracaoContrato {
  id: string;
  contrato_id: string;
  campo: CampoRastreavelContrato;
  valor_anterior: string | null;
  novo_valor: string | null;
  autor_alteracao: string | null;
  alterado_em: string;
}

export const CAMPOS_RASTREAVEIS_CONTRATO: CampoRastreavelContrato[] = [
  "nome",
  "cliente",
  "valor",
  "contract_type",
  "data_inicio",
  "data_fim",
  "status",
  "descricao",
  "torres",
  "squads_ids",
  "arquivo_nome",
];

export const ROTULOS_CAMPOS_CONTRATO: Record<CampoRastreavelContrato, string> = {
  nome: "Nome do Contrato",
  cliente: "Cliente",
  valor: "Valor",
  contract_type: "Tipo de Contrato",
  data_inicio: "Data de Início",
  data_fim: "Data de Fim",
  status: "Status",
  descricao: "Descrição",
  torres: "Torres",
  squads_ids: "Squads Específicas",
  arquivo_nome: "Documento Anexo",
  cadastro: "Criação do Contrato",
};
