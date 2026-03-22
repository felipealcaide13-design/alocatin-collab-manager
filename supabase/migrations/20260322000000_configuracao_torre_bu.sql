-- Cria tabela de configuração de Torre por BU
-- Cada BU pode ter sua própria lista de campos de liderança configuráveis

CREATE TABLE public.bu_torre_configs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bu_id       UUID        NOT NULL UNIQUE REFERENCES public.business_units(id) ON DELETE CASCADE,
  config      JSONB       NOT NULL DEFAULT '{"campos_lideranca": [], "descricao_habilitada": false}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona coluna liderancas na tabela torres para substituir os campos fixos hardcoded
-- Estrutura: { [campo_id: string]: string | null } onde a chave é o id do CampoLiderancaConfig
ALTER TABLE public.torres
  ADD COLUMN IF NOT EXISTS liderancas JSONB NOT NULL DEFAULT '{}';
