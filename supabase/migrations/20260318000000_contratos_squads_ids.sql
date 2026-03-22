-- Adiciona coluna squads_ids na tabela contratos
-- Permite vincular squads específicas a um contrato.
-- Quando vazio/null, todas as squads das torres vinculadas pertencem ao contrato.
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS squads_ids UUID[] NOT NULL DEFAULT '{}';
