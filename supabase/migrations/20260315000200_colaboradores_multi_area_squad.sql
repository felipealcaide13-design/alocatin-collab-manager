-- Migration: suporte a múltiplas áreas e squads por colaborador
-- Rodar no SQL Editor do Supabase

-- 1. Adiciona diretoria_id ao colaborador
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS diretoria_id UUID REFERENCES public.diretorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_colaboradores_diretoria_id
  ON public.colaboradores(diretoria_id);

-- 2. Troca area_id (1:1) por area_ids (array de UUIDs)
--    e time (texto) por squad_ids (array de UUIDs → squads.id)
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS area_ids  UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS squad_ids UUID[] NOT NULL DEFAULT '{}';

-- Migra dados existentes (se houver)
UPDATE public.colaboradores
  SET area_ids = ARRAY[area_id]
  WHERE area_id IS NOT NULL;

-- Remove colunas antigas
ALTER TABLE public.colaboradores
  DROP COLUMN IF EXISTS area_id,
  DROP COLUMN IF EXISTS time;
