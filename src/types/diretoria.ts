export interface Diretoria {
  id: string;
  nome: string;
  descricao?: string | null;
  lideres: string[];
  created_at?: string;
  updated_at?: string;
}
export type DiretoriaInput = Pick<Diretoria, 'nome' | 'descricao' | 'lideres'>;
