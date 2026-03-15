import { supabase } from "@/lib/supabase";
import { Diretoria, DiretoriaInput } from "@/types/diretoria";

export const diretoriaService = {
  async getAll(): Promise<Diretoria[]> {
    const { data, error } = await supabase.from("diretorias").select("*").order("nome");
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getById(id: string): Promise<Diretoria | null> {
    const { data, error } = await supabase.from("diretorias").select("*").eq("id", id).single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data;
  },

  async create(input: DiretoriaInput): Promise<Diretoria> {
    const { data, error } = await supabase.from("diretorias").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, input: Partial<DiretoriaInput>): Promise<Diretoria> {
    const { data, error } = await supabase.from("diretorias").update(input).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { count, error: countError } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .eq("diretoria_id", id);
    if (countError) throw new Error(countError.message);
    if (count && count > 0)
      throw new Error("Esta Diretoria possui Áreas associadas e não pode ser excluída.");
    const { error } = await supabase.from("diretorias").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
