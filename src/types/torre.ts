export interface Squad {
    id: string;
    nome: string;
    torre_id: string;
    lider: string | null; // UUID from colaboradores
    membros: string[] | null; // UUID[] from colaboradores
    descricao: string | null;
    created_at?: string;
}

export type SquadInput = Omit<Squad, "id" | "created_at">;

export interface Torre {
    id: string;
    nome: string;
    contrato_id: string | null;
    responsavel_negocio: string | null;
    head_tecnologia: string | null;
    head_produto: string | null;
    gerente_produto: string | null;
    gerente_design: string | null;
    descricao: string | null;
    created_at?: string;

    // Custom joined fields used for display in the table
    contrato_nome?: string;
    squads_count?: number;
    squads?: Squad[]; // List of squads for the expanded view
}

export type TorreInput = Omit<Torre, "id" | "created_at" | "contrato_nome" | "squads_count" | "squads">;
