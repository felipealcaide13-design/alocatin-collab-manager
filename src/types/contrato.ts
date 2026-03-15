export type ContratoStatus = 'Ativo' | 'Encerrado' | 'Pausado';
export type ContractType = 'Aberto' | 'Fechado';

export interface Contrato {
    id: string;
    nome: string;
    cliente: string;
    /** Valor mensal se contract_type='Aberto'; valor total do período se 'Fechado'. */
    valor: number | null;
    /** @deprecated use `valor` — mantido temporariamente para compatibilidade */
    valor_total?: number | null;
    contract_type: ContractType;
    data_inicio: string;
    /** Obrigatório para contratos Fechados; opcional para Abertos. */
    data_fim: string | null;
    status: ContratoStatus;
    descricao: string | null;
    torres: string[] | null;
    created_at?: string;
}

export interface ContractCost {
    id: string;
    contrato_id: string;
    categoria: string;
    descricao: string | null;
    valor: number;
    created_at?: string;
}

export type ContratoInput = Omit<Contrato, "id" | "created_at" | "valor_total">;

export const CONTRATO_STATUS: ContratoStatus[] = ['Ativo', 'Encerrado', 'Pausado'];
export const CONTRACT_TYPES: ContractType[] = ['Aberto', 'Fechado'];
