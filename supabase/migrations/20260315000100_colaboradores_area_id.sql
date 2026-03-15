-- Migration: substitui coluna area (TEXT) por area_id (UUID FK → areas)
-- Rodar no SQL Editor do Supabase

-- 1. Adiciona a nova coluna (nullable temporariamente para não quebrar registros existentes)
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_colaboradores_area_id
  ON public.colaboradores(area_id);

-- 2. Remove a coluna legada
ALTER TABLE public.colaboradores
  DROP COLUMN IF EXISTS area;

-- 3. Remove a coluna subarea (legado, não usada na UI)
ALTER TABLE public.colaboradores
  DROP COLUMN IF EXISTS subarea;
