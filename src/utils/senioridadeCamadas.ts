import type { Database } from "@/integrations/supabase/types";

export type Senioridade = Database["public"]["Enums"]["senioridade_enum"];
export type Camada = "BU" | "Torre" | "Squad";

export const SENIORIDADES: Senioridade[] = [
  "C-level",
  "Diretor(a)",
  "Head",
  "Gerente",
  "Coordenador(a)",
  "Staf I",
  "Staf II",
  "Analista senior",
  "Analista pleno",
  "Analista junior",
];

const CAMADAS: Camada[] = ["BU", "Torre", "Squad"];

export const REGRAS_SENIORIDADE_CAMADA: Record<Senioridade, Camada[]> = {
  "C-level":         [],
  "Diretor(a)":      ["BU", "Torre"],
  "Head":            ["Torre"],
  "Gerente":         ["Torre"],
  "Coordenador(a)":  ["Torre", "Squad"],
  "Staf I":          ["Torre", "Squad"],
  "Staf II":         ["Torre", "Squad"],
  "Analista senior": ["Torre", "Squad"],
  "Analista pleno":  ["Squad"],
  "Analista junior": ["Squad"],
};

/** Retorna as camadas permitidas para uma senioridade. */
export function getCamadasPermitidas(senioridade: Senioridade): Camada[] {
  return REGRAS_SENIORIDADE_CAMADA[senioridade];
}

/** Verifica se uma camada específica é permitida para a senioridade. */
export function isCamadaPermitida(senioridade: Senioridade, camada: Camada): boolean {
  return REGRAS_SENIORIDADE_CAMADA[senioridade].includes(camada);
}

/**
 * Valida se o conjunto de camadas fornecido é compatível com a senioridade.
 * Retorna { valido: true } ou { valido: false, mensagem: string }.
 */
export function validarCamadasPorSenioridade(
  senioridade: Senioridade,
  camadas: Camada[]
): { valido: boolean; mensagem?: string } {
  if (camadas.length === 0) {
    return { valido: false, mensagem: "Selecione ao menos uma camada." };
  }

  const permitidas = REGRAS_SENIORIDADE_CAMADA[senioridade];
  const invalidas = camadas.filter((c) => !permitidas.includes(c));

  if (invalidas.length > 0) {
    return {
      valido: false,
      mensagem: `Camadas inválidas para ${senioridade}. Camadas permitidas: ${permitidas.join(", ")}.`,
    };
  }

  return { valido: true };
}

/**
 * Deserializa uma string JSON para Record<Senioridade, Camada[]>.
 * Lança erro descritivo para senioridades ou camadas desconhecidas.
 */
export function parsearRegrasSenioridade(json: string): Record<Senioridade, Camada[]> {
  const parsed = JSON.parse(json) as Record<string, string[]>;

  for (const key of Object.keys(parsed)) {
    if (!SENIORIDADES.includes(key as Senioridade)) {
      throw new Error(`Senioridade inválida: ${key}`);
    }
    for (const camada of parsed[key]) {
      if (!CAMADAS.includes(camada as Camada)) {
        throw new Error(`Camada inválida: ${camada}`);
      }
    }
  }

  return parsed as Record<Senioridade, Camada[]>;
}
