export type Senioridade =
  | "C-level"
  | "Diretor(a)"
  | "Head"
  | "Gerente"
  | "Coordenador(a)"
  | "Staf I"
  | "Staf II"
  | "Analista senior"
  | "Analista pleno"
  | "Analista junior";

export type Status = "Ativo" | "Desligado";

// Area = o que antes era "Pilar". São o mesmo conceito no sistema.
export type Area = "Engenharia" | "Produto" | "Financeiro" | "RH" | "Marketing";

/** @deprecated use Area instead */
export type Pilar = Area;

export interface Colaborador {
  id: string;
  nomeCompleto: string;
  email: string;
  documento: string;
  cargo: string;
  area: Area;
  subarea: string | null;
  senioridade: Senioridade;
  status: Status;
  dataAdmissao: string;
  time: string | null;
}

export const SENIORIDADES: Senioridade[] = [
  "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
  "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
];

export const AREAS: Area[] = ["Engenharia", "Produto", "Financeiro", "RH", "Marketing"];

/** @deprecated use AREAS instead */
export const PILARES: Area[] = AREAS;

export const SUBAREAS_POR_AREA: Record<string, string[]> = {
  PX: ["QA", "Tech Writer"],
  "Product Design": ["Product Design", "Design System"],
};

export type ColaboradorInput = Omit<Colaborador, "id">;
