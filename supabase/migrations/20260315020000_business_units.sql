-- ============================================================
-- Migration: Business Units
-- Cria tabela business_units e vincula torres via bu_id
-- Estratégia segura: nullable primeiro → migrar dados → NOT NULL
-- ============================================================

-- 1. Tabela business_units
CREATE TABLE IF NOT EXISTS public.business_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_business_units_updated_at
  BEFORE UPDATE ON public.business_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON public.business_units FOR ALL USING (true) WITH CHECK (true);

-- 2. Adicionar bu_id em torres como NULLABLE (para não quebrar dados existentes)
ALTER TABLE public.torres
  ADD COLUMN IF NOT EXISTS bu_id UUID
    REFERENCES public.business_units(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_torres_bu_id ON public.torres(bu_id);

-- ============================================================
-- PASSO MANUAL NECESSÁRIO antes de aplicar o NOT NULL abaixo:
--
-- Execute no SQL Editor do Supabase:
--
--   INSERT INTO public.business_units (nome, descricao)
--   VALUES ('BU Padrão', 'Migração inicial — ajuste conforme necessário')
--   RETURNING id;
--
--   -- Use o UUID retornado:
--   UPDATE public.torres SET bu_id = '<uuid-retornado>' WHERE bu_id IS NULL;
--
-- Depois descomente e execute o ALTER abaixo:
-- ============================================================

-- ALTER TABLE public.torres ALTER COLUMN bu_id SET NOT NULL;

-- ============================================================
-- 3. Função RPC: árvore completa BU → Torres → Squads
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_arvore_bu()
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',       bu.id,
      'nome',     bu.nome,
      'descricao', bu.descricao,
      'torres',   COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id',       t.id,
              'nome',     t.nome,
              'descricao', t.descricao,
              'squads',   COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id',      s.id,
                      'nome',    s.nome,
                      'lider',   s.lider,
                      'membros', s.membros
                    ) ORDER BY s.nome
                  )
                  FROM public.squads s
                  WHERE s.torre_id = t.id
                ),
                '[]'::jsonb
              )
            ) ORDER BY t.nome
          )
          FROM public.torres t
          WHERE t.bu_id = bu.id
        ),
        '[]'::jsonb
      )
    ) ORDER BY bu.nome
  )
  FROM public.business_units bu;
$$;
