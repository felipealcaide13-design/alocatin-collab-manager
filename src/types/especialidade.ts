export interface Especialidade {
  id: string;
  nome: string;
  area_id: string;
  descricao?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type EspecialidadeInput = Pick<Especialidade, 'nome' | 'area_id' | 'descricao'>;
