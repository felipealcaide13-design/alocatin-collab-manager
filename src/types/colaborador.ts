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

export interface Colaborador {
  id: string;
  nomeCompleto: string;
  email?: string | null;
  documento?: string | null;
  diretoria_id?: string | null;   // FK → diretorias.id
  area_ids: string[];             // FK[] → areas.id (1..N dependendo da senioridade)
  especialidade_id?: string | null; // FK → especialidades.id (apenas ICs)
  torre_ids: string[];            // FK[] → torres.id (multi-torre)
  squad_ids: string[];            // FK[] → squads.id (opcional, exceto C-level/Diretor)
  bu_id?: string | null;          // FK → business_units.id (C-level/Diretor)
  lider_id?: string | null;       // FK → colaboradores.id (líder direto)
  senioridade: Senioridade;
  status: Status;
  dataAdmissao: string;
}

export const SENIORIDADES: Senioridade[] = [
  "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
  "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
];

// Grupos de senioridade para controle de UX
export const SENIORIDADE_GRUPOS = {
  clevel_diretor: ["C-level", "Diretor(a)"] as Senioridade[],
  gestor: ["Head", "Gerente", "Coordenador(a)"] as Senioridade[],
  ic: ["Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior"] as Senioridade[],
};

export type ColaboradorInput = Omit<Colaborador, "id">;
