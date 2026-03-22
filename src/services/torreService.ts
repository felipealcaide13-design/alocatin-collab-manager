import { supabase } from "@/lib/supabase";
import { Torre, TorreInput, Squad, SquadInput } from "@/types/torre";
import { historicoBUService, diffLiderancas } from "@/services/historicoBUService";
import type { EventoBUTorreSquad } from "@/types/historicoBU";

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
    async getAllTorres(): Promise<Torre[]> {
        const { data, error } = await supabase
            .from("torres")
            .select(`*, squads ( id, nome, lider, membros, descricao, contrato_id )`)
            .order("nome");

        if (error) { console.warn("Error fetching torres:", error); return []; }

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

        await historicoBUService.registrarEvento({
            tipo_evento: "torre_criada",
            entidade_tipo: "torre",
            entidade_id: data.id,
            entidade_pai_id: data.bu_id ?? null,
            snapshot_dados: { nome: data.nome, descricao: data.descricao, bu_id: data.bu_id, liderancas: data.liderancas },
            autor_alteracao: "sistema",
        }).catch(console.error);

        return data;
    },

    async updateTorre(id: string, input: Partial<TorreInput>): Promise<Torre> {
        const anterior = await this.getTorreById(id);

        const { data, error } = await supabase.from("torres").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);

        const eventos: Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[] = [];

        eventos.push({
            tipo_evento: "torre_alterada",
            entidade_tipo: "torre",
            entidade_id: id,
            entidade_pai_id: data.bu_id ?? null,
            snapshot_dados: {
                antes: { nome: anterior?.nome, descricao: anterior?.descricao, bu_id: anterior?.bu_id },
                depois: { nome: data.nome, descricao: data.descricao, bu_id: data.bu_id },
            },
            autor_alteracao: "sistema",
        });

        if (anterior && input.liderancas !== undefined) {
            const ant = (anterior.liderancas as Record<string, string | null>) ?? {};
            const nov = (data.liderancas as Record<string, string | null>) ?? {};
            eventos.push(...diffLiderancas(id, "torre", ant, nov));
        }

        await historicoBUService.registrarEventos(eventos).catch(console.error);

        return data;
    },

    async removeTorre(id: string): Promise<void> {
        const anterior = await this.getTorreById(id);

        if (anterior) {
            await historicoBUService.registrarEvento({
                tipo_evento: "torre_deletada",
                entidade_tipo: "torre",
                entidade_id: id,
                entidade_pai_id: (anterior as any).bu_id ?? null,
                snapshot_dados: anterior as unknown as Record<string, unknown>,
                autor_alteracao: "sistema",
            });
        }

        // Deletar todas as squads desta torre em cascata (cada removeSquad cuida dos colaboradores)
        const { data: squadsDaTorre } = await supabase
            .from("squads")
            .select("id")
            .eq("torre_id", id);

        if (squadsDaTorre && squadsDaTorre.length > 0) {
            for (const squad of squadsDaTorre) {
                await this.removeSquad(squad.id);
            }
        }

        // Remove torre_ids dos colaboradores que estavam nesta torre
        const { data: colaboradoresNaTorre } = await supabase
            .from("colaboradores")
            .select("id, torre_ids")
            .contains("torre_ids", [id]);

        if (colaboradoresNaTorre && colaboradoresNaTorre.length > 0) {
            await Promise.all(
                colaboradoresNaTorre.map((c) =>
                    supabase
                        .from("colaboradores")
                        .update({ torre_ids: (c.torre_ids ?? []).filter((tid: string) => tid !== id) })
                        .eq("id", c.id)
                )
            );
        }

        const { error } = await supabase.from("torres").delete().eq("id", id);
        if (error) throw new Error(error.message);
    },

    async getSquadsByTorreId(torreId: string): Promise<Squad[]> {
        const { data, error } = await supabase.from("squads").select(`*, contratos(nome)`).eq("torre_id", torreId).order("nome");
        if (error) { console.warn("Error fetching squads:", error); return []; }
        return data || [];
    },

    async getAllSquads(): Promise<Squad[]> {
        const { data, error } = await supabase.from("squads").select(`*, contratos(nome)`).order("nome");
        if (error) { console.warn("Error fetching all squads:", error); return []; }
        return data || [];
    },

    async createSquad(input: SquadInput): Promise<Squad> {
        const { data, error } = await supabase.from("squads").insert(input).select().single();
        if (error) throw new Error(error.message);

        if (input.contrato_id && input.torre_id) {
            await linkTorreToContrato(input.contrato_id, input.torre_id);
        }

        await historicoBUService.registrarEvento({
            tipo_evento: "squad_criado",
            entidade_tipo: "squad",
            entidade_id: data.id,
            entidade_pai_id: data.torre_id ?? null,
            snapshot_dados: { nome: data.nome, descricao: data.descricao, torre_id: data.torre_id, contrato_id: data.contrato_id, lider: data.lider, membros: data.membros },
            autor_alteracao: "sistema",
        }).catch(console.error);

        return data;
    },

    async updateSquad(id: string, input: Partial<SquadInput>): Promise<Squad> {
        const { data: anterior } = await supabase.from("squads").select("*").eq("id", id).single();

        const { data, error } = await supabase.from("squads").update(input).eq("id", id).select().single();
        if (error) throw new Error(error.message);

        const contrato_id = input.contrato_id ?? data.contrato_id;
        const torre_id = input.torre_id ?? data.torre_id;
        if (contrato_id && torre_id) {
            await linkTorreToContrato(contrato_id, torre_id);
        }

        const eventos: Omit<EventoBUTorreSquad, "id" | "ocorrido_em">[] = [];

        eventos.push({
            tipo_evento: "squad_alterado",
            entidade_tipo: "squad",
            entidade_id: id,
            entidade_pai_id: data.torre_id ?? null,
            snapshot_dados: {
                antes: { nome: anterior?.nome, lider: anterior?.lider, torre_id: anterior?.torre_id },
                depois: { nome: data.nome, lider: data.lider, torre_id: data.torre_id },
            },
            autor_alteracao: "sistema",
        });

        if (anterior && input.lider !== undefined && anterior.lider !== data.lider) {
            eventos.push(...diffLiderancas(id, "squad", { lider: anterior.lider ?? null }, { lider: data.lider ?? null }));
        }

        await historicoBUService.registrarEventos(eventos).catch(console.error);

        return data;
    },

    async removeSquad(id: string): Promise<void> {
        const { data: anterior } = await supabase.from("squads").select("*").eq("id", id).single();

        if (anterior) {
            await historicoBUService.registrarEvento({
                tipo_evento: "squad_deletado",
                entidade_tipo: "squad",
                entidade_id: id,
                entidade_pai_id: anterior.torre_id ?? null,
                snapshot_dados: anterior as unknown as Record<string, unknown>,
                autor_alteracao: "sistema",
            });
        }

        // Remove squad_ids dos colaboradores que estavam nesta squad
        const { data: colaboradoresNaSquad } = await supabase
            .from("colaboradores")
            .select("id, squad_ids")
            .contains("squad_ids", [id]);

        if (colaboradoresNaSquad && colaboradoresNaSquad.length > 0) {
            await Promise.all(
                colaboradoresNaSquad.map((c) =>
                    supabase
                        .from("colaboradores")
                        .update({ squad_ids: (c.squad_ids ?? []).filter((sid: string) => sid !== id) })
                        .eq("id", c.id)
                )
            );
        }

        const { error } = await supabase.from("squads").delete().eq("id", id);
        if (error) throw new Error(error.message);
    },

    async addMembroToSquad(squadId: string, colaboradorId: string): Promise<void> {
        const { data, error } = await supabase.from("squads").select("membros").eq("id", squadId).single();
        if (error) throw new Error(error.message);
        const membros: string[] = data?.membros ?? [];
        if (!membros.includes(colaboradorId)) {
            await supabase.from("squads").update({ membros: [...membros, colaboradorId] }).eq("id", squadId);
        }
    },

    async removeMembroFromSquad(squadId: string, colaboradorId: string): Promise<void> {
        const { data, error } = await supabase.from("squads").select("membros").eq("id", squadId).single();
        if (error) throw new Error(error.message);
        const membros: string[] = (data?.membros ?? []).filter((id: string) => id !== colaboradorId);
        await supabase.from("squads").update({ membros }).eq("id", squadId);
    },
};
