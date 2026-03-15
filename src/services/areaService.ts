import { supabase } from "@/lib/supabase";
import { Area, AreaInput } from "@/types/area";

export const areaService = {
    async getAll(): Promise<Area[]> {
        const { data, error } = await supabase.from("areas").select("*").order("nome");
        if (error) throw new Error(error.message);
        return data || [];
    },

    async getById(id: string): Promise<Area | null> {
        const { data, error } = await supabase.from("areas").select("*").eq("id", id).single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(error.message);
        }
        return data;
    },

    async getByPilar(pilar: string): Promise<Area[]> {
        const { data, error } = await supabase.from("areas").select("*").eq("pilar", pilar).order("nome");
        if (error) throw new Error(error.message);
        return data || [];
    },

    async getByDiretoria(diretoriaId: string): Promise<Area[]> {
        const { data, error } = await supabase
            .from("areas")
            .select("*")
            .eq("diretoria_id", diretoriaId)
            .order("nome");
        if (error) throw new Error(error.message);
        return data || [];
    },

    async create(input: AreaInput): Promise<Area> {
        const { data, error } = await supabase.from("areas").insert(input).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: string, input: Partial<AreaInput>): Promise<Area> {
        const { data, error } = await supabase.from("areas").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from("areas").delete().eq("id", id);
        if (error) throw new Error(error.message);
    },
};
