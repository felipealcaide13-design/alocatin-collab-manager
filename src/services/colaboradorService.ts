import { v4 as uuidv4 } from "uuid";
import type { Colaborador, ColaboradorInput } from "@/types/colaborador";
import { supabase } from "@/lib/supabase";
import { diffCamposRastreaveis, historicoService } from "@/services/historicoService";
import type { CampoRastreavel, EventoAlteracao } from "@/types/historico";

function fromDb(row: any): Colaborador {
  return {
    id: row.id,
    nomeCompleto: row.nome_completo,
    email: row.email ?? null,
    documento: row.documento ?? null,
    diretoria_id: row.diretoria_id ?? null,
    area_ids: row.area_ids ?? [],
    especialidade_id: row.especialidade_id ?? null,
    squad_ids: row.squad_ids ?? [],
    torre_ids: row.torre_ids ?? [],
    bu_id: row.bu_id ?? null,
    lider_id: row.lider_id ?? null,
    senioridade: row.senioridade,
    status: row.status,
    dataAdmissao: row.data_admissao,
  };
}

function toDb(input: Partial<ColaboradorInput>): Record<string, any> {
  const mapped: Record<string, any> = {};
  if (input.nomeCompleto !== undefined) mapped.nome_completo = input.nomeCompleto;
  if (input.email !== undefined) mapped.email = input.email || null;
  if (input.documento !== undefined) mapped.documento = input.documento || null;
  if (input.diretoria_id !== undefined) mapped.diretoria_id = input.diretoria_id ?? null;
  if (input.area_ids !== undefined) mapped.area_ids = input.area_ids;
  if (input.especialidade_id !== undefined) mapped.especialidade_id = input.especialidade_id ?? null;
  if (input.squad_ids !== undefined) mapped.squad_ids = input.squad_ids;
  if (input.torre_ids !== undefined) mapped.torre_ids = input.torre_ids;
  if ("bu_id" in input) mapped.bu_id = input.bu_id ?? null;
  if ("lider_id" in input) mapped.lider_id = input.lider_id ?? null;
  if (input.senioridade !== undefined) mapped.senioridade = input.senioridade;
  if (input.status !== undefined) mapped.status = input.status;
  if (input.dataAdmissao !== undefined) mapped.data_admissao = input.dataAdmissao;
  return mapped;
}

/**
 * Gera os eventos de snapshot inicial com todos os campos rastreáveis do colaborador recém-criado.
 * Isso permite que a reconstrução temporal saiba exatamente o estado do colaborador na criação.
 */
function buildSnapshotCriacao(colaborador: Colaborador): Omit<EventoAlteracao, "id" | "alterado_em">[] {
  const eventos: Omit<EventoAlteracao, "id" | "alterado_em">[] = [];

  // Evento de cadastro (lifecycle)
  eventos.push({
    colaborador_id: colaborador.id,
    campo: "cadastro",
    valor_anterior: null,
    novo_valor: new Date().toISOString(),
    autor_alteracao: "sistema",
  });

  // Snapshot de cada campo rastreável com seu valor inicial
  const camposParaSnapshot: { campo: CampoRastreavel; valor: unknown }[] = [
    { campo: "senioridade", valor: colaborador.senioridade },
    { campo: "diretoria_id", valor: colaborador.diretoria_id },
    { campo: "status", valor: colaborador.status },
    { campo: "bu_id", valor: colaborador.bu_id },
    { campo: "torre_ids", valor: colaborador.torre_ids },
    { campo: "squad_ids", valor: colaborador.squad_ids },
    { campo: "lider_id", valor: colaborador.lider_id },
    { campo: "area_ids", valor: colaborador.area_ids },
    { campo: "dataAdmissao", valor: colaborador.dataAdmissao },
  ];

  for (const { campo, valor } of camposParaSnapshot) {
    const serializado = valor === null || valor === undefined
      ? null
      : Array.isArray(valor) ? JSON.stringify(valor) : String(valor);

    // Só registra se tem valor (evita poluir com campos null)
    if (serializado !== null) {
      eventos.push({
        colaborador_id: colaborador.id,
        campo,
        valor_anterior: null,
        novo_valor: serializado,
        autor_alteracao: "sistema",
      });
    }
  }

  return eventos;
}

export const colaboradorService = {
  async getAll(): Promise<Colaborador[]> {
    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("nome_completo");
    if (error) {
      console.warn("Error fetching colaboradores:", error);
      return [];
    }
    return (data || []).map(fromDb);
  },

  async getById(id: string): Promise<Colaborador | null> {
    const { data, error } = await supabase.from("colaboradores").select("*").eq("id", id).single();
    if (error) return null;
    return fromDb(data);
  },

  async create(input: ColaboradorInput): Promise<Colaborador> {
    if (input.documento) {
      const { data: extDocs } = await supabase.from("colaboradores").select("id").eq("documento", input.documento);
      if (extDocs && extDocs.length > 0) throw new Error("CPF já cadastrado.");
    }
    if (input.email) {
      const { data: extEmails } = await supabase.from("colaboradores").select("id").eq("email", input.email);
      if (extEmails && extEmails.length > 0) throw new Error("E-mail já cadastrado.");
    }
    const dbData = { id: uuidv4(), ...toDb(input) };
    const { data, error } = await supabase.from("colaboradores").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    const colaborador = fromDb(data);

    // Registra snapshot completo de criação (cadastro + todos os campos iniciais)
    const eventosCriacao = buildSnapshotCriacao(colaborador);
    await historicoService.registrar(eventosCriacao);

    return colaborador;
  },

  async update(id: string, input: Partial<ColaboradorInput>): Promise<Colaborador> {
    const anterior = await colaboradorService.getById(id);
    if (!anterior) throw new Error("Colaborador não encontrado.");

    // Buscar nomes das entidades para enriquecer o histórico
    const precisaNomes =
      "torre_ids" in input || "squad_ids" in input || "bu_id" in input
      || "diretoria_id" in input || "area_ids" in input;

    let nomes: import("@/services/historicoService").NomesEntidades | undefined;
    if (precisaNomes) {
      const [torresData, squadsData, busData, diretoriasData, areasData] = await Promise.all([
        "torre_ids" in input || "squad_ids" in input
          ? supabase.from("torres").select("id, nome").then(({ data }) => data ?? [])
          : Promise.resolve([]),
        "squad_ids" in input
          ? supabase.from("squads").select("id, nome").then(({ data }) => data ?? [])
          : Promise.resolve([]),
        "bu_id" in input
          ? supabase.from("business_units").select("id, nome").then(({ data }) => data ?? [])
          : Promise.resolve([]),
        "diretoria_id" in input
          ? supabase.from("diretorias").select("id, nome").then(({ data }) => data ?? [])
          : Promise.resolve([]),
        "area_ids" in input
          ? supabase.from("areas").select("id, nome").then(({ data }) => data ?? [])
          : Promise.resolve([]),
      ]);

      nomes = {
        torres: Object.fromEntries(torresData.map((t: any) => [t.id, t.nome])),
        squads: Object.fromEntries(squadsData.map((s: any) => [s.id, s.nome])),
        businessUnits: Object.fromEntries(busData.map((b: any) => [b.id, b.nome])),
        diretorias: Object.fromEntries(diretoriasData.map((d: any) => [d.id, d.nome])),
        areas: Object.fromEntries(areasData.map((a: any) => [a.id, a.nome])),
      };
    }

    const eventos = diffCamposRastreaveis(anterior, input, nomes);
    if (eventos.length > 0) {
      await historicoService.registrar(eventos);
    }

    const { data, error } = await supabase
      .from("colaboradores")
      .update(toDb(input))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromDb(data);
  },

  async remove(id: string): Promise<void> {
    // Salvar snapshot completo ANTES de deletar para reconstrução temporal
    const colaborador = await colaboradorService.getById(id);
    if (colaborador) {
      await historicoService.registrar([{
        colaborador_id: colaborador.id,
        campo: "deletado",
        valor_anterior: JSON.stringify({
          nomeCompleto: colaborador.nomeCompleto,
          senioridade: colaborador.senioridade,
          status: colaborador.status,
          diretoria_id: colaborador.diretoria_id,
          bu_id: colaborador.bu_id,
          torre_ids: colaborador.torre_ids,
          squad_ids: colaborador.squad_ids,
          area_ids: colaborador.area_ids,
          lider_id: colaborador.lider_id,
          dataAdmissao: colaborador.dataAdmissao,
        }),
        novo_valor: new Date().toISOString(),
        autor_alteracao: "sistema",
      }]);
    }

    // Remove o colaborador de squads.membros (array sem FK, não tem CASCADE automático)
    const { data: squadsComMembro } = await supabase
      .from("squads")
      .select("id, membros")
      .contains("membros", [id]);

    if (squadsComMembro && squadsComMembro.length > 0) {
      await Promise.all(
        squadsComMembro.map((sq) =>
          supabase
            .from("squads")
            .update({ membros: (sq.membros ?? []).filter((mid: string) => mid !== id) })
            .eq("id", sq.id)
        )
      );
    }

    // historico_alteracoes agora tem ON DELETE SET NULL (colaborador_id → null)
    // lider_id em colaboradores tem ON DELETE SET NULL
    // squads.lider tem ON DELETE SET NULL
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /**
   * Sincroniza membros de uma squad: garante que os colaboradores em `newMemberIds`
   * tenham o squadId em seus squad_ids, e os que saíram tenham removido.
   */
  async syncSquadMembers(squadId: string, oldMemberIds: string[], newMemberIds: string[]): Promise<void> {
    const removed = oldMemberIds.filter((id) => !newMemberIds.includes(id));
    const added = newMemberIds.filter((id) => !oldMemberIds.includes(id));

    for (const colaboradorId of removed) {
      const colab = await colaboradorService.getById(colaboradorId);
      if (!colab) continue;
      const updated = (colab.squad_ids ?? []).filter((sid) => sid !== squadId);
      await colaboradorService.update(colaboradorId, { squad_ids: updated });
    }

    for (const colaboradorId of added) {
      const colab = await colaboradorService.getById(colaboradorId);
      if (!colab) continue;
      const current = colab.squad_ids ?? [];
      if (!current.includes(squadId)) {
        await colaboradorService.update(colaboradorId, { squad_ids: [...current, squadId] });
      }
    }
  },
};
