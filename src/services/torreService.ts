import { supabase } from "@/lib/supabase";
import { Torre, TorreInput, Squad, SquadInput } from "@/types/torre";

export const torreService = {
    // Torres
    async getAllTorres(): Promise<Torre[]> {
        // We combine fields for the UI: counts of squads and contract names.
        const { data, error } = await supabase
            .from("torres")
            .select(`
        *,
        contratos ( nome ),
        squads ( id, nome, lider, membros, descricao )
      `)
            .order("nome");

        if (error) {
            console.warn("Error fetching torres:", error);
            return [];
        }

        // Map relationships directly
        return (data || []).map((t: any) => ({
            ...t,
            contrato_nome: t.contratos?.nome || "",
            squads_count: t.squads ? t.squads.length : 0,
            squads: t.squads || [],
        }));
    },

    async getTorreById(id: string): Promise<Torre | null> {
        const { data, error } = await supabase.from("torres").select("*").eq("id", id).single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(error.message);
        }
        return data;
    },

    async createTorre(input: TorreInput): Promise<Torre> {
        const { data, error } = await supabase.from("torres").insert(input).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async updateTorre(id: string, input: Partial<TorreInput>): Promise<Torre> {
        const { data, error } = await supabase.from("torres").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async removeTorre(id: string): Promise<void> {
        const { error } = await supabase.from("torres").delete().eq("id", id);
        if (error) throw new Error(error.message);
    },

    // Squads
    async getSquadsByTorreId(torreId: string): Promise<Squad[]> {
        const { data, error } = await supabase.from("squads").select("*").eq("torre_id", torreId).order("nome");
        if (error) {
            console.warn("Error fetching squads:", error);
            return [];
        }
        return data || [];
    },

    async createSquad(input: SquadInput): Promise<Squad> {
        const { data, error } = await supabase.from("squads").insert(input).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async updateSquad(id: string, input: Partial<SquadInput>): Promise<Squad> {
        const { data, error } = await supabase.from("squads").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async removeSquad(id: string): Promise<void> {
        const { error } = await supabase.from("squads").delete().eq("id", id);
        if (error) throw new Error(error.message);
    }
};
