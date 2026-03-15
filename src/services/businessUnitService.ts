import { supabase } from "@/lib/supabase";
import { BusinessUnit, BusinessUnitInput } from "@/types/businessUnit";

export const businessUnitService = {
  async getAll(): Promise<BusinessUnit[]> {
    const { data, error } = await supabase
      .from("business_units")
      .select("*")
      .order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getById(id: string): Promise<BusinessUnit | null> {
    const { data, error } = await supabase
      .from("business_units")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data;
  },

  async create(input: BusinessUnitInput): Promise<BusinessUnit> {
    const { data, error } = await supabase
      .from("business_units")
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, input: Partial<BusinessUnitInput>): Promise<BusinessUnit> {
    const { data, error } = await supabase
      .from("business_units")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("business_units")
      .delete()
      .eq("id", id);
    if (error) {
      // FK violation: torres ainda vinculadas
      if (error.code === "23503") {
        throw new Error(
          "Não é possível excluir esta BU pois existem Torres vinculadas a ela. Remova ou reatribua as Torres primeiro."
        );
      }
      throw new Error(error.message);
    }
  },

  /** Retorna a árvore completa BU → Torres → Squads via RPC */
  async getArvore(): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_arvore_bu");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
