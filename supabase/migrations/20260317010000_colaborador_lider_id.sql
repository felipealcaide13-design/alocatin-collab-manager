-- Adiciona campo lider_id na tabela colaboradores
-- Referencia outro colaborador como líder direto (cargo acima, mesma área)

ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS lider_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_colaboradores_lider ON public.colaboradores(lider_id);
