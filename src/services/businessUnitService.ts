import { supabase } from "@/lib/supabase";
import { BusinessUnit, BusinessUnitInput } from "@/types/businessUnit";
import { historicoBUService, diffLiderancas } from "@/services/historicoBUService";
import { torreService } from "@/services/torreService";

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

    await historicoBUService.registrarEvento({
      tipo_evento: "bu_criada",
      entidade_tipo: "bu",
      entidade_id: data.id,
      entidade_pai_id: null,
      snapshot_dados: { nome: data.nome, descricao: data.descricao, liderancas: data.liderancas },
      autor_alteracao: "sistema",
    }).catch(console.error);

    return data;
  },

  async update(id: string, input: Partial<BusinessUnitInput>): Promise<BusinessUnit> {
    const anterior = await this.getById(id);

    const { data, error } = await supabase
      .from("business_units")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const eventos: Omit<import("@/types/historicoBU").EventoBUTorreSquad, "id" | "ocorrido_em">[] = [];

    eventos.push({
      tipo_evento: "bu_alterada",
      entidade_tipo: "bu",
      entidade_id: id,
      entidade_pai_id: null,
      snapshot_dados: {
        antes: { nome: anterior?.nome, descricao: anterior?.descricao },
        depois: { nome: data.nome, descricao: data.descricao },
      },
      autor_alteracao: "sistema",
    });

    if (anterior && input.liderancas !== undefined) {
      const ant = (anterior.liderancas as Record<string, string | null>) ?? {};
      const nov = (data.liderancas as Record<string, string | null>) ?? {};
      eventos.push(...diffLiderancas(id, "bu", ant, nov));
    }

    await historicoBUService.registrarEventos(eventos).catch(console.error);

    return data;
  },

  async remove(id: string): Promise<void> {
    const anterior = await this.getById(id);

    if (anterior) {
      await historicoBUService.registrarEvento({
        tipo_evento: "bu_deletada",
        entidade_tipo: "bu",
        entidade_id: id,
        entidade_pai_id: null,
        snapshot_dados: anterior as unknown as Record<string, unknown>,
        autor_alteracao: "sistema",
      });
    }

    // Deletar todas as torres desta BU em cascata (cada removeTorre cuida das squads e colaboradores)
    const { data: torresDaBU } = await supabase
      .from("torres")
      .select("id")
      .eq("bu_id", id);

    if (torresDaBU && torresDaBU.length > 0) {
      for (const torre of torresDaBU) {
        await torreService.removeTorre(torre.id);
      }
    }

    // Limpar bu_id dos colaboradores que estavam nesta BU
    const { data: colaboradoresDaBU } = await supabase
      .from("colaboradores")
      .select("id")
      .eq("bu_id", id);

    if (colaboradoresDaBU && colaboradoresDaBU.length > 0) {
      await supabase
        .from("colaboradores")
        .update({ bu_id: null })
        .eq("bu_id", id);
    }

    const { error } = await supabase
      .from("business_units")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getArvore(): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_arvore_bu");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
