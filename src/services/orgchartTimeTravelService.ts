import { supabase } from "@/lib/supabase";
import type { BusinessUnit } from "@/types/businessUnit";
import type { Torre, Squad } from "@/types/torre";
import type { Colaborador } from "@/types/colaborador";
import type { EventoBUTorreSquad } from "@/types/historicoBU";
import type { EventoAlteracao } from "@/types/historico";
import { businessUnitService } from "@/services/businessUnitService";
import { torreService } from "@/services/torreService";
import { colaboradorService } from "@/services/colaboradorService";

export interface OrgChartSnapshot {
  businessUnits: BusinessUnit[];
  torres: Torre[];
  squads: Squad[];
  colaboradores: Colaborador[];
  dataReferencia: string;
  isHistorico: boolean;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function endOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

/**
 * Reconstrução temporal do organograma de Business Units.
 *
 * Estratégia: Reverse Computation
 * 1. Carrega o estado ATUAL do banco
 * 2. Busca todos os eventos de histórico que ocorreram APÓS a data alvo
 * 3. Reverte esses eventos para reconstruir o estado na data alvo
 */
export async function getOrgChartAtDate(targetDate: string): Promise<OrgChartSnapshot> {
  const isToday = targetDate === todayStr();

  // Fast path: data de hoje = estado atual
  if (isToday) {
    const [businessUnits, torresRaw, squads, colaboradores] = await Promise.all([
      businessUnitService.getAll(),
      torreService.getAllTorres(),
      torreService.getAllSquads(),
      colaboradorService.getAll(),
    ]);
    return {
      businessUnits,
      torres: torresRaw,
      squads,
      colaboradores,
      dataReferencia: targetDate,
      isHistorico: false,
    };
  }

  // Slow path: reconstrução temporal
  const cutoff = endOfDay(targetDate);

  // Fetch paralelo: dados atuais + eventos após a data alvo
  const [
    currentBUs,
    currentTorres,
    currentSquads,
    currentColaboradores,
    buEventsAfter,
    colabEventsAfter,
  ] = await Promise.all([
    businessUnitService.getAll(),
    torreService.getAllTorres(),
    torreService.getAllSquads(),
    colaboradorService.getAll(),
    fetchBUEventsAfter(cutoff),
    fetchColabEventsAfter(cutoff),
  ]);

  // Reconstruir entidades BU/Torre/Squad
  const { businessUnits, torres, squads } = reconstructBUEntities(
    currentBUs, currentTorres, currentSquads, buEventsAfter
  );

  // Reconstruir colaboradores
  const colaboradores = reconstructColaboradores(
    currentColaboradores, colabEventsAfter
  );

  return {
    businessUnits,
    torres,
    squads,
    colaboradores,
    dataReferencia: targetDate,
    isHistorico: true,
  };
}

// ── Fetch helpers ───────────────────────────────────────────────────────────────

async function fetchBUEventsAfter(cutoff: string): Promise<EventoBUTorreSquad[]> {
  const { data, error } = await supabase
    .from("historico_bu_torre_squad")
    .select("*")
    .gt("ocorrido_em", cutoff)
    .order("ocorrido_em", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EventoBUTorreSquad[];
}

async function fetchColabEventsAfter(cutoff: string): Promise<EventoAlteracao[]> {
  const { data, error } = await supabase
    .from("historico_alteracoes")
    .select("*")
    .gt("alterado_em", cutoff)
    .order("alterado_em", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EventoAlteracao[];
}

// ── BU/Torre/Squad Reconstruction ───────────────────────────────────────────────

interface ReconstructedEntities {
  businessUnits: BusinessUnit[];
  torres: Torre[];
  squads: Squad[];
}

function reconstructBUEntities(
  currentBUs: BusinessUnit[],
  currentTorres: Torre[],
  currentSquads: Squad[],
  eventsAfter: EventoBUTorreSquad[]
): ReconstructedEntities {
  // Clonar para não mutar os originais
  const busMap = new Map(currentBUs.map((b) => [b.id, { ...b }]));
  const torresMap = new Map(currentTorres.map((t) => [t.id, { ...t }]));
  const squadsMap = new Map(currentSquads.map((s) => [s.id, { ...s }]));

  // Processar eventos em ordem cronológica (mais antigo primeiro)
  // Para cada evento APÓS a data alvo, reverter a operação
  for (const evt of eventsAfter) {
    const snap = evt.snapshot_dados as Record<string, any>;

    switch (evt.tipo_evento) {
      // ── BU ──────────────────────────────────────
      case "bu_criada":
        // BU foi criada DEPOIS da data alvo → remover (não existia)
        busMap.delete(evt.entidade_id);
        break;

      case "bu_deletada":
        // BU foi deletada DEPOIS da data alvo → restaurar (existia na data)
        busMap.set(evt.entidade_id, {
          id: evt.entidade_id,
          nome: snap.nome ?? "BU Restaurada",
          descricao: snap.descricao ?? null,
          liderancas: snap.liderancas ?? {},
        });
        break;

      case "bu_alterada":
        // BU foi alterada DEPOIS da data alvo → reverter para estado anterior
        if (snap.antes && busMap.has(evt.entidade_id)) {
          const bu = busMap.get(evt.entidade_id)!;
          if (snap.antes.nome !== undefined) bu.nome = snap.antes.nome;
          if (snap.antes.descricao !== undefined) bu.descricao = snap.antes.descricao;
        }
        break;

      // ── Torre ──────────────────────────────────
      case "torre_criada":
        torresMap.delete(evt.entidade_id);
        break;

      case "torre_deletada":
        torresMap.set(evt.entidade_id, {
          id: evt.entidade_id,
          nome: snap.nome ?? "Torre Restaurada",
          bu_id: snap.bu_id ?? null,
          responsavel_negocio: snap.responsavel_negocio ?? null,
          head_tecnologia: snap.head_tecnologia ?? null,
          head_produto: snap.head_produto ?? null,
          gerente_produto: snap.gerente_produto ?? null,
          gerente_design: snap.gerente_design ?? null,
          descricao: snap.descricao ?? null,
          liderancas: snap.liderancas ?? {},
        });
        break;

      case "torre_alterada":
        if (snap.antes && torresMap.has(evt.entidade_id)) {
          const torre = torresMap.get(evt.entidade_id)!;
          if (snap.antes.nome !== undefined) torre.nome = snap.antes.nome;
          if (snap.antes.descricao !== undefined) torre.descricao = snap.antes.descricao;
          if (snap.antes.bu_id !== undefined) torre.bu_id = snap.antes.bu_id;
        }
        break;

      // ── Squad ──────────────────────────────────
      case "squad_criado":
        squadsMap.delete(evt.entidade_id);
        break;

      case "squad_deletado":
        squadsMap.set(evt.entidade_id, {
          id: evt.entidade_id,
          nome: snap.nome ?? "Squad Restaurado",
          torre_id: snap.torre_id ?? "",
          contrato_id: snap.contrato_id ?? null,
          lider: snap.lider ?? null,
          membros: snap.membros ?? [],
          descricao: snap.descricao ?? null,
        });
        break;

      case "squad_alterado":
        if (snap.antes && squadsMap.has(evt.entidade_id)) {
          const squad = squadsMap.get(evt.entidade_id)!;
          if (snap.antes.nome !== undefined) squad.nome = snap.antes.nome;
          if (snap.antes.torre_id !== undefined) squad.torre_id = snap.antes.torre_id;
          if (snap.antes.lider !== undefined) squad.lider = snap.antes.lider;
        }
        break;

      // Liderança events affect the entity's liderancas field
      case "lideranca_atribuida":
      case "lideranca_alterada":
      case "lideranca_removida":
        reverseLiderancaEvent(evt, busMap, torresMap);
        break;
    }
  }

  // Filtrar torres de BUs que não existem na data alvo
  const validBUIds = new Set(Array.from(busMap.keys()));
  const filteredTorres = Array.from(torresMap.values()).filter(
    (t) => !t.bu_id || validBUIds.has(t.bu_id)
  );

  // Filtrar squads de torres que não existem na data alvo
  const validTorreIds = new Set(filteredTorres.map((t) => t.id));
  const filteredSquads = Array.from(squadsMap.values()).filter(
    (s) => validTorreIds.has(s.torre_id)
  );

  return {
    businessUnits: Array.from(busMap.values()),
    torres: filteredTorres,
    squads: filteredSquads,
  };
}

function reverseLiderancaEvent(
  evt: EventoBUTorreSquad,
  busMap: Map<string, BusinessUnit>,
  torresMap: Map<string, Torre>
): void {
  const snap = evt.snapshot_dados as Record<string, any>;
  const cargo = snap.cargo as string;
  if (!cargo) return;

  // Determina qual mapa usar
  const entity = evt.entidade_tipo === "bu"
    ? busMap.get(evt.entidade_id)
    : evt.entidade_tipo === "torre"
      ? torresMap.get(evt.entidade_id)
      : null;

  if (!entity || !entity.liderancas) return;
  const lid = entity.liderancas as Record<string, string | null>;

  switch (evt.tipo_evento) {
    case "lideranca_atribuida":
      // Foi atribuída depois → reverter = remover
      delete lid[cargo];
      break;
    case "lideranca_removida":
      // Foi removida depois → reverter = restaurar com o anterior
      lid[cargo] = snap.colaborador_anterior_id ?? null;
      break;
    case "lideranca_alterada":
      // Foi alterada depois → reverter para o valor anterior
      lid[cargo] = snap.colaborador_anterior_id ?? null;
      break;
  }
}

// ── Colaboradores Reconstruction ────────────────────────────────────────────────

function reconstructColaboradores(
  currentColaboradores: Colaborador[],
  eventsAfter: EventoAlteracao[]
): Colaborador[] {
  // Agrupar eventos por colaborador_id
  const eventsByColab = new Map<string, EventoAlteracao[]>();
  for (const evt of eventsAfter) {
    const cid = evt.colaborador_id;
    if (!cid) continue;
    if (!eventsByColab.has(cid)) eventsByColab.set(cid, []);
    eventsByColab.get(cid)!.push(evt);
  }

  // Clonar colaboradores atuais
  const colabMap = new Map(currentColaboradores.map((c) => [c.id, { ...c }]));

  // Processar eventos de cada colaborador
  for (const [colabId, events] of eventsByColab) {
    // Verificar se o colaborador foi CRIADO depois da data alvo
    const cadastroEvent = events.find((e) => e.campo === "cadastro");
    if (cadastroEvent) {
      // Colaborador foi criado depois da data alvo → remover
      colabMap.delete(colabId);
      continue;
    }

    // Verificar se o colaborador foi DELETADO depois da data alvo
    const deleteEvent = events.find((e) => e.campo === "deletado");
    if (deleteEvent && deleteEvent.valor_anterior) {
      // Colaborador foi deletado depois da data alvo → restaurar
      try {
        const snapshot = JSON.parse(deleteEvent.valor_anterior);
        const restored: Colaborador = {
          id: colabId,
          nomeCompleto: snapshot.nomeCompleto ?? "Colaborador Restaurado",
          senioridade: snapshot.senioridade ?? "Analista junior",
          status: snapshot.status ?? "Ativo",
          diretoria_id: snapshot.diretoria_id ?? null,
          bu_id: snapshot.bu_id ?? null,
          torre_ids: snapshot.torre_ids ?? [],
          squad_ids: snapshot.squad_ids ?? [],
          area_ids: snapshot.area_ids ?? [],
          lider_id: snapshot.lider_id ?? null,
          dataAdmissao: snapshot.dataAdmissao ?? "",
        };
        colabMap.set(colabId, restored);
      } catch {
        // Se não conseguir parsear o snapshot, ignorar
        continue;
      }
    }

    // Reverter alterações campo a campo
    const colab = colabMap.get(colabId);
    if (!colab) continue;

    // Para cada campo, precisamos do valor_anterior do primeiro evento após a data
    // (já estão ordenados cronologicamente → o primeiro é o mais antigo após a data)
    const camposJaRevertidos = new Set<string>();

    for (const evt of events) {
      if (evt.campo === "cadastro" || evt.campo === "deletado") continue;
      if (camposJaRevertidos.has(evt.campo)) continue;

      // Pegar o valor_anterior do PRIMEIRO evento do campo → esse era o estado na data alvo
      camposJaRevertidos.add(evt.campo);
      applyFieldRevert(colab, evt.campo, evt.valor_anterior);
    }
  }

  return Array.from(colabMap.values());
}

function applyFieldRevert(
  colab: Colaborador,
  campo: string,
  valorAnterior: string | null
): void {
  switch (campo) {
    case "senioridade":
      if (valorAnterior) colab.senioridade = valorAnterior as Colaborador["senioridade"];
      break;
    case "status":
      if (valorAnterior) colab.status = valorAnterior as Colaborador["status"];
      break;
    case "diretoria_id":
      colab.diretoria_id = parseIdField(valorAnterior);
      break;
    case "bu_id":
      colab.bu_id = parseIdField(valorAnterior);
      break;
    case "lider_id":
      colab.lider_id = valorAnterior ?? null;
      break;
    case "dataAdmissao":
      if (valorAnterior) colab.dataAdmissao = valorAnterior;
      break;
    case "torre_ids":
      colab.torre_ids = parseArrayField(valorAnterior);
      break;
    case "squad_ids":
      colab.squad_ids = parseArrayField(valorAnterior);
      break;
    case "area_ids":
      colab.area_ids = parseArrayField(valorAnterior);
      break;
  }
}

/** Parseia campos de ID que podem ser string simples ou JSON { id, nome } */
function parseIdField(valor: string | null): string | null {
  if (!valor) return null;
  try {
    const parsed = JSON.parse(valor);
    if (typeof parsed === "object" && parsed.id) return parsed.id;
  } catch {
    // Não é JSON → retorna como ID direto
  }
  return valor;
}

/** Parseia campos de array que podem ser JSON de IDs ou [{id, nome}] */
function parseArrayField(valor: string | null): string[] {
  if (!valor) return [];
  try {
    const parsed = JSON.parse(valor);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) =>
      typeof item === "object" && item.id ? item.id : String(item)
    );
  } catch {
    return [];
  }
}
