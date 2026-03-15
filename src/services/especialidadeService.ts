import { supabase } from "@/lib/supabase";
import { Especialidade, EspecialidadeInput } from "@/types/especialidade";

export const especialidadeService = {
  async getAll(): Promise<Especialidade[]> {
    const { data, error } = await supabase.from("especialidades").select("*").order("nome");
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getByArea(areaId: string): Promise<Especialidade[]> {
    const { data, error } = await supabase
      .from("especialidades")
      .select("*")
      .eq("area_id", areaId)
      .order("nome");
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(input: EspecialidadeInput): Promise<Especialidade> {
    const { data, error } = await supabase.from("especialidades").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, input: Partial<EspecialidadeInput>): Promise<Especialidade> {
    const { data, error } = await supabase
      .from("especialidades")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { count, error: countError } = await supabase
      .from("colaboradores")
      .select("id", { count: "exact", head: true })
      .eq("especialidade_id", id);
    if (countError) throw new Error(countError.message);
    if (count && count > 0)
      throw new Error("Esta Especialidade possui Colaboradores associados e não pode ser excluída.");
    const { error } = await supabase.from("especialidades").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
