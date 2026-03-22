-- Configuração global do formulário de cadastro de Business Unit
-- Uma única linha armazena a config (singleton via id fixo)
CREATE TABLE public.bu_form_config (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  config     JSONB       NOT NULL DEFAULT '{"descricao_habilitada": false, "campos_lideranca": []}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona coluna liderancas na tabela business_units para campos de liderança configuráveis
ALTER TABLE public.business_units
  ADD COLUMN IF NOT EXISTS liderancas JSONB NOT NULL DEFAULT '{}';
