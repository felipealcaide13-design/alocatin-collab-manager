export interface CampoLiderancaConfig {
  id: string;
  nome: string;
  senioridade: string;
  diretoria_id: string;
  ordem: number;
}

export interface BUTorreConfig {
  bu_id: string;
  campos_lideranca: CampoLiderancaConfig[];
  descricao_habilitada: boolean;
}

// Configuração global do formulário de cadastro de BU
export interface BUFormConfig {
  descricao_habilitada: boolean;
  campos_lideranca: CampoLiderancaConfig[];
}
