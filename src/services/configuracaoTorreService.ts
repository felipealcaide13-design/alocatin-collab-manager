import { supabase } from "@/lib/supabase";
import { BUTorreConfig } from "@/types/configuracaoTorre";

export const configuracaoTorreService = {
  async getByBuId(buId: string): Promise<BUTorreConfig | null> {
    const { data, error } = await supabase
      .from("bu_torre_configs")
      .select("config")
      .eq("bu_id", buId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    if (!data) return null;

    return { ...(data.config as Omit<BUTorreConfig, "bu_id">), bu_id: buId };
  },

  async upsert(config: BUTorreConfig): Promise<BUTorreConfig> {
    const { bu_id, ...configWithoutBuId } = config;

    const { data, error } = await supabase
      .from("bu_torre_configs")
      .upsert(
        { bu_id, config: configWithoutBuId },
        { onConflict: "bu_id" }
      )
      .select("config")
      .single();

    if (error) throw new Error(error.message);

    return { ...(data.config as Omit<BUTorreConfig, "bu_id">), bu_id };
  },

  async migrarCamposFixos(buId: string): Promise<void> {
    const existing = await this.getByBuId(buId);
    if (existing) return;

    const defaultConfig: BUTorreConfig = {
      bu_id: buId,
      descricao_habilitada: false,
      campos_lideranca: [
        { id: crypto.randomUUID(), nome: "Responsável pelo Negócio", senioridade: "C-level", diretoria_id: "", ordem: 0 },
        { id: crypto.randomUUID(), nome: "Head de Tecnologia",       senioridade: "Head",    diretoria_id: "", ordem: 1 },
        { id: crypto.randomUUID(), nome: "Head de Produto",          senioridade: "Head",    diretoria_id: "", ordem: 2 },
        { id: crypto.randomUUID(), nome: "Gerente de Produto",       senioridade: "Gerente", diretoria_id: "", ordem: 3 },
        { id: crypto.randomUUID(), nome: "Gerente de Design",        senioridade: "Gerente", diretoria_id: "", ordem: 4 },
      ],
    };

    await this.upsert(defaultConfig);
  },
};
