import { supabase } from "@/lib/supabase";
import { Contrato, ContratoInput } from "@/types/contrato";

export const contratoService = {
    async getAll(): Promise<Contrato[]> {
        const { data, error } = await supabase.from("contratos").select("*").order("data_inicio", { ascending: false });
        if (error) {
            console.warn("Error fetching contratos:", error);
            return [];
        }
        return data || [];
    },

    async getById(id: string): Promise<Contrato | null> {
        const { data, error } = await supabase.from("contratos").select("*").eq("id", id).single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(error.message);
        }
        return data;
    },

    async create(input: ContratoInput): Promise<Contrato> {
        const { data, error } = await supabase.from("contratos").insert(input).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: string, input: Partial<ContratoInput>): Promise<Contrato> {
        const { data, error } = await supabase.from("contratos").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from("contratos").delete().eq("id", id);
        if (error) throw new Error(error.message);
    },

    async getKpis(): Promise<{ status: string; count: number }[]> {
        const { data, error } = await supabase.rpc('get_contratos_kpis');
        // If RPC doesn't exist, fallback to fetching all and grouping
        if (error) {
            const { data: allData } = await supabase.from('contratos').select('status');
            if (!allData) return [];
            const counts = allData.reduce((acc: any, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {});
            return Object.keys(counts).map(key => ({ status: key, count: counts[key] }));
        }
        return data || [];
    }
};
