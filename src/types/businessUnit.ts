export interface BusinessUnit {
  id: string;
  nome: string;
  descricao: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BusinessUnitInput = Pick<BusinessUnit, "nome" | "descricao">;
