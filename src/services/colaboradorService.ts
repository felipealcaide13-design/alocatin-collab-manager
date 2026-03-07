import { v4 as uuidv4 } from "uuid";
import type { Colaborador, ColaboradorInput } from "@/types/colaborador";
import { supabase } from "@/lib/supabase";

export const colaboradorService = {
  async getAll(): Promise<Colaborador[]> {
    const { data, error } = await supabase
      .from("colaboradores")
      .select(`
        *,
        colaborador_areas (
          areas (
            nome,
            subareas_possiveis
          )
        )
      `)
      .order("nomeCompleto");

    if (error) {
      console.warn("Using mock data as fallback, maybe not seeded?", error);
      return []; // fallback if they haven't run seed
    }

    // Map JOIN to flattened properties
    const mappedData: Colaborador[] = data.map((c: any) => {
      const colAreas = c.colaborador_areas || [];
      const areasJoined = colAreas.map((ca: any) => ca.areas?.nome).filter(Boolean);
      return {
        ...c,
        area: areasJoined.length > 0 ? areasJoined.join(", ") : c.area, // Default to string column or JOIN output
      };
    });

    return mappedData;
  },

  async getById(id: string): Promise<Colaborador | null> {
    const { data, error } = await supabase.from("colaboradores").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  },

  async create(input: ColaboradorInput): Promise<Colaborador> {
    const newId = uuidv4();
    const novo = { ...input, id: newId };

    // Check conflicts
    const { data: extDocs } = await supabase.from("colaboradores").select("id").eq("documento", input.documento);
    if (extDocs && extDocs.length > 0) throw new Error("CPF já cadastrado. (409)");

    const { data: extEmails } = await supabase.from("colaboradores").select("id").eq("email", input.email);
    if (extEmails && extEmails.length > 0) throw new Error("E-mail já cadastrado. (409)");

    const { data, error } = await supabase.from("colaboradores").insert(novo).select().single();
    if (error) throw new Error(error.message);

    // Integre com schema Colaboradores existente - Ao salvar colaborador: INSERT colaborador_areas relation
    if (input.area) {
      // Look up the area ID based on the area name
      const { data: areaData } = await supabase.from("areas").select("id").eq("nome", input.area).single();
      if (areaData) {
        await supabase.from("colaborador_areas").insert({
          colaborador_id: data.id,
          area_id: areaData.id,
        });
      }
    }

    return data;
  },

  async update(id: string, input: Partial<ColaboradorInput>): Promise<Colaborador> {
    const { data, error } = await supabase.from("colaboradores").update(input).eq("id", id).select().single();
    if (error) throw new Error(error.message);

    // Integre com schema Colaboradores existente 
    if (input.area) {
      // Look up the area ID
      const { data: areaData } = await supabase.from("areas").select("id").eq("nome", input.area).single();
      if (areaData) {
        // Clear existing and replace
        await supabase.from("colaborador_areas").delete().eq("colaborador_id", id);
        await supabase.from("colaborador_areas").insert({
          colaborador_id: id,
          area_id: areaData.id,
        });
      }
    }

    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
