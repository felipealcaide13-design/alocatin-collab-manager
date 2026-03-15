import { v4 as uuidv4 } from "uuid";
import type { Colaborador, ColaboradorInput } from "@/types/colaborador";
import { supabase } from "@/lib/supabase";

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
  if (input.senioridade !== undefined) mapped.senioridade = input.senioridade;
  if (input.status !== undefined) mapped.status = input.status;
  if (input.dataAdmissao !== undefined) mapped.data_admissao = input.dataAdmissao;
  return mapped;
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
    return fromDb(data);
  },

  async update(id: string, input: Partial<ColaboradorInput>): Promise<Colaborador> {
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
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
