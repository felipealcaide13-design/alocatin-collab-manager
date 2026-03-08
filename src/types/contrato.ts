export type ContratoStatus = 'Ativo' | 'Encerrado' | 'Pausado';

export interface Contrato {
    id: string;
    nome: string;
    cliente: string;
    valor_total: number | null;
    data_inicio: string;
    data_fim: string | null;
    status: ContratoStatus;
    descricao: string | null;
    torres: string[] | null;
    created_at?: string;
}

export type ContratoInput = Omit<Contrato, "id" | "created_at">;

export const CONTRATO_STATUS: ContratoStatus[] = ['Ativo', 'Encerrado', 'Pausado'];
