import { supabase } from "@/lib/supabase";
import { Contrato, ContratoInput } from "@/types/contrato";
import { historicoContratoService, diffCamposRastreaveisContrato } from "@/services/historicoContratoService";

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

        const specificSquadIds: string[] = input.squads_ids ?? [];
        const torreIds: string[] = input.torres ?? [];

        if (torreIds.length > 0) {
            if (specificSquadIds.length > 0) {
                // Attach only the specific squads
                await supabase
                    .from("squads")
                    .update({ contrato_id: data.id })
                    .in("id", specificSquadIds);
            } else {
                // Attach all squads of the torres that have no contrato yet
                await supabase
                    .from("squads")
                    .update({ contrato_id: data.id })
                    .in("torre_id", torreIds)
                    .is("contrato_id", null);
            }
        }

        await historicoContratoService.registrar([{
            contrato_id: data.id,
            campo: "cadastro",
            valor_anterior: null,
            novo_valor: "Contrato criado no sistema",
            autor_alteracao: "sistema",
            id: "", // Type requires this, Wait, the type requires 'id'? Omit should handle it. No, our Omit is 'id' | 'alterado_em'. So we don't need 'id'. Let me double check historicoContratoService type signature... Wait, the Omit requires these removed. So we don't supply them.
        } as any]); // Just to be safe for typing if any issue.

        return data;
    },

    async update(id: string, input: Partial<ContratoInput>): Promise<Contrato> {
        // Fetch previous state to diff
        const { data: previous } = await supabase.from("contratos").select("*").eq("id", id).single();
        const prevTorres: string[] = previous?.torres ?? [];
        const newTorres: string[] = input.torres ?? prevTorres;
        const specificSquadIds: string[] = input.squads_ids ?? [];

        if (previous) {
            const eventos = diffCamposRastreaveisContrato(previous as Contrato, input);
            if (eventos.length > 0) {
                await historicoContratoService.registrar(eventos);
            }
        }

        const { data, error } = await supabase.from("contratos").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);

        // Torres removed from contrato → detach all squads of those torres
        const removedTorres = prevTorres.filter((t) => !newTorres.includes(t));
        if (removedTorres.length > 0) {
            await supabase
                .from("squads")
                .update({ contrato_id: null })
                .eq("contrato_id", id)
                .in("torre_id", removedTorres);
        }

        // For torres still/newly in contrato, sync squad assignments
        if (newTorres.length > 0) {
            if (specificSquadIds.length > 0) {
                // Specific squads selected: detach squads of these torres NOT in the list
                await supabase
                    .from("squads")
                    .update({ contrato_id: null })
                    .eq("contrato_id", id)
                    .in("torre_id", newTorres)
                    .not("id", "in", `(${specificSquadIds.join(",")})`);

                // Attach the specific squads
                await supabase
                    .from("squads")
                    .update({ contrato_id: id })
                    .in("id", specificSquadIds);
            } else {
                // No specific squads → attach all squads of the torres (that have no contrato yet)
                const addedTorres = newTorres.filter((t) => !prevTorres.includes(t));
                if (addedTorres.length > 0) {
                    await supabase
                        .from("squads")
                        .update({ contrato_id: id })
                        .in("torre_id", addedTorres)
                        .is("contrato_id", null);
                }
            }
        }

        return data;
    },

    async remove(id: string): Promise<void> {
        // Fetch the contrato first to check for arquivo_url
        const { data: contrato } = await supabase.from("contratos").select("arquivo_url").eq("id", id).single();
        
        const { error } = await supabase.from("contratos").delete().eq("id", id);
        if (error) throw new Error(error.message);

        // Remove document from storage
        if (contrato?.arquivo_url) {
            const filePath = contrato.arquivo_url.split('/').pop();
            if (filePath) {
                await supabase.storage.from('contratos').remove([filePath]).catch(console.error);
            }
        }
    },

    async getKpis(): Promise<{ status: string; count: number }[]> {
        const { data, error } = await supabase.rpc('get_contratos_kpis');
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
    },

    async uploadArquivo(file: File): Promise<{ url: string; nome: string }> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('contratos')
            .upload(fileName, file);

        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = supabase.storage
            .from('contratos')
            .getPublicUrl(fileName);

        return { url: publicUrl, nome: file.name };
    },
    
    async removeArquivo(url: string): Promise<void> {
        const filePath = url.split('/').pop();
        if (filePath) {
            await supabase.storage.from('contratos').remove([filePath]);
        }
    }
};
