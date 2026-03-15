-- Migration: Hierarquia Organizacional
-- Adiciona tabelas diretorias e especialidades, e colunas FK em areas e colaboradores
-- Não-destrutiva: usa IF NOT EXISTS e colunas nullable

-- ============================================================
-- 1. Tabela diretorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diretorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_diretorias_updated_at
  BEFORE UPDATE ON public.diretorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.diretorias ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'diretorias' AND policyname = 'Allow read diretorias'
  ) THEN
    CREATE POLICY "Allow read diretorias"
      ON public.diretorias FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'diretorias' AND policyname = 'Allow insert diretorias'
  ) THEN
    CREATE POLICY "Allow insert diretorias"
      ON public.diretorias FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'diretorias' AND policyname = 'Allow update diretorias'
  ) THEN
    CREATE POLICY "Allow update diretorias"
      ON public.diretorias FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'diretorias' AND policyname = 'Allow delete diretorias'
  ) THEN
    CREATE POLICY "Allow delete diretorias"
      ON public.diretorias FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================
-- 2. Coluna diretoria_id em areas (nullable, FK → diretorias)
-- ============================================================
ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS diretoria_id UUID
    REFERENCES public.diretorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_areas_diretoria_id
  ON public.areas(diretoria_id);

-- ============================================================
-- 3. Tabela especialidades
-- ============================================================
CREATE TABLE IF NOT EXISTS public.especialidades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  area_id     UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_especialidades_area_id
  ON public.especialidades(area_id);

CREATE TRIGGER update_especialidades_updated_at
  BEFORE UPDATE ON public.especialidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'especialidades' AND policyname = 'Allow read especialidades'
  ) THEN
    CREATE POLICY "Allow read especialidades"
      ON public.especialidades FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'especialidades' AND policyname = 'Allow insert especialidades'
  ) THEN
    CREATE POLICY "Allow insert especialidades"
      ON public.especialidades FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'especialidades' AND policyname = 'Allow update especialidades'
  ) THEN
    CREATE POLICY "Allow update especialidades"
      ON public.especialidades FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'especialidades' AND policyname = 'Allow delete especialidades'
  ) THEN
    CREATE POLICY "Allow delete especialidades"
      ON public.especialidades FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================
-- 4. Coluna especialidade_id em colaboradores (nullable, FK → especialidades)
-- ============================================================
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS especialidade_id UUID
    REFERENCES public.especialidades(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_colaboradores_esp_id
  ON public.colaboradores(especialidade_id);
