-- Adiciona torre_ids (array) e bu_id à tabela colaboradores
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS torre_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bu_id UUID REFERENCES public.business_units(id) ON DELETE SET NULL;
