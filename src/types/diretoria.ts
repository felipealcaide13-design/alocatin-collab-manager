export interface Diretoria {
  id: string;
  nome: string;
  descricao?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type DiretoriaInput = Pick<Diretoria, 'nome' | 'descricao'>;
