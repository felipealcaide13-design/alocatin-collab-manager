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

export type Pilar = "Engenharia" | "Produto" | "Financeiro" | "RH" | "Marketing";

export interface Colaborador {
  id: string;
  nomeCompleto: string;
  email: string;
  documento: string;
  cargo: string;
  pilar: Pilar;
  area: string;
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

export const PILARES: Pilar[] = ["Engenharia", "Produto", "Financeiro", "RH", "Marketing"];

export const AREAS_POR_PILAR: Record<Pilar, string[]> = {
  Engenharia: ["Backend", "Frontend", "DevOps"],
  Produto: ["Produto", "Product Design", "PX", "Projeto"],
  Financeiro: ["Financeiro", "Financeiro Ops"],
  RH: ["Talent", "Business Partner"],
  Marketing: ["Growth", "PMM"],
};

export const SUBAREAS_POR_AREA: Record<string, string[]> = {
  PX: ["QA", "Tech Writer"],
  "Product Design": ["Product Design", "Design System"],
};

export type ColaboradorInput = Omit<Colaborador, "id">;
