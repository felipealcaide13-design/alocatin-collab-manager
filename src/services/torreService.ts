import { supabase } from "@/lib/supabase";
import { Torre, TorreInput, Squad, SquadInput } from "@/types/torre";

async function linkTorreToContrato(contratoId: string, torreId: string): Promise<void> {
    const { data: contrato } = await supabase
        .from("contratos")
        .select("torres")
        .eq("id", contratoId)
        .single();
    if (!contrato) return;

    const current: string[] = contrato.torres ?? [];
    if (!current.includes(torreId)) {
        await supabase
            .from("contratos")
            .update({ torres: [...current, torreId] })
            .eq("id", contratoId);
    }
}

export const torreService = {
    // Torres
    async getAllTorres(): Promise<Torre[]> {
        const { data, error } = await supabase
            .from("torres")
            .select(`
        *,
        squads ( id, nome, lider, membros, descricao, contrato_id )
      `)
            .order("nome");

        if (error) {
            console.warn("Error fetching torres:", error);
            return [];
        }

        // Map relationships directly
        return (data || []).map((t: any) => ({
            ...t,
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
        const { data, error } = await supabase.from("squads").select(`*, contratos(nome)`).eq("torre_id", torreId).order("nome");
        if (error) {
            console.warn("Error fetching squads:", error);
            return [];
        }
        return data || [];
    },

    async getAllSquads(): Promise<Squad[]> {
        const { data, error } = await supabase.from("squads").select(`*, contratos(nome)`).order("nome");
        if (error) {
            console.warn("Error fetching all squads:", error);
            return [];
        }
        return data || [];
    },

    async createSquad(input: SquadInput): Promise<Squad> {
        const { data, error } = await supabase.from("squads").insert(input).select().single();
        if (error) throw new Error(error.message);

        // Link torre to contrato automatically
        if (input.contrato_id && input.torre_id) {
            await linkTorreToContrato(input.contrato_id, input.torre_id);
        }

        return data;
    },

    async updateSquad(id: string, input: Partial<SquadInput>): Promise<Squad> {
        const { data, error } = await supabase.from("squads").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);

        // Link torre to contrato automatically when contrato or torre changes
        const contrato_id = input.contrato_id ?? data.contrato_id;
        const torre_id = input.torre_id ?? data.torre_id;
        if (contrato_id && torre_id) {
            await linkTorreToContrato(contrato_id, torre_id);
        }

        return data;
    },

    async removeSquad(id: string): Promise<void> {
        const { error } = await supabase.from("squads").delete().eq("id", id);
        if (error) throw new Error(error.message);
    }
};
