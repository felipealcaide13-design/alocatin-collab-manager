import { Colaborador } from "./colaborador";

export interface Area {
    id: string;
    nome: string;
    subareas_possiveis: string[];
    lideres: string[]; // UUIDs of leaders
    descricao: string;
    created_at?: string;
}

export type AreaInput = Omit<Area, "id" | "created_at">;

export interface AreaWithLideres extends Area {
    lideres_details?: Pick<Colaborador, 'id' | 'nomeCompleto'>[];
}
