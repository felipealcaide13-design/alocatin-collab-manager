import { Colaborador, Senioridade } from "../types/colaborador";
import { Area } from "../types/area";

/**
 * Filtra colaboradores por senioridade e área (identificada pelo nome, case-insensitive).
 *
 * - Se a área for encontrada: retorna colaboradores com a senioridade correta E que pertencem à área.
 * - Se a área NÃO for encontrada (fallback): retorna todos os colaboradores com a senioridade correta.
 */
export function filterColaboradores(
  colaboradores: Colaborador[],
  areas: Area[],
  senioridade: Senioridade,
  areaNome: string
): Colaborador[] {
  const area = areas.find(
    (a) => a.nome.toLowerCase() === areaNome.toLowerCase()
  );

  if (!area) {
    return colaboradores.filter((c) => c.senioridade === senioridade);
  }

  return colaboradores.filter(
    (c) => c.senioridade === senioridade && c.area_ids.includes(area.id)
  );
}

/**
 * Filtra colaboradores por múltiplas senioridades, sem filtro de área.
 */
export function filterColaboradoresBySenioridades(
  colaboradores: Colaborador[],
  senioridades: Senioridade[]
): Colaborador[] {
  return colaboradores.filter((c) => senioridades.includes(c.senioridade));
}
