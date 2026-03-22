import { supabase } from "@/lib/supabase";
import { BUFormConfig } from "@/types/configuracaoTorre";

const DEFAULT_CONFIG: BUFormConfig = {
  descricao_habilitada: false,
  campos_lideranca: [],
};

export const configuracaoBUService = {
  async get(): Promise<BUFormConfig> {
    const { data, error } = await supabase
      .from("bu_form_config")
      .select("config")
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return { ...DEFAULT_CONFIG };

    return data.config as BUFormConfig;
  },

  async upsert(config: BUFormConfig): Promise<BUFormConfig> {
    // Fetch existing row id (singleton)
    const { data: existing } = await supabase
      .from("bu_form_config")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("bu_form_config")
        .update({ config, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("config")
        .single();
      if (error) throw new Error(error.message);
      return data.config as BUFormConfig;
    } else {
      const { data, error } = await supabase
        .from("bu_form_config")
        .insert({ config })
        .select("config")
        .single();
      if (error) throw new Error(error.message);
      return data.config as BUFormConfig;
    }
  },
};
