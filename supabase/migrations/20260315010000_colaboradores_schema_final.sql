-- ============================================================
-- COLABORADORES — Schema Final (limpo, sem legado)
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- Drop e recriação limpa da tabela colaboradores
-- (dados de teste podem ser perdidos — confirmado pelo usuário)

DROP TABLE IF EXISTS public.alocacoes    CASCADE;
DROP TABLE IF EXISTS public.colaboradores CASCADE;

-- Recria colaboradores com schema correto
CREATE TABLE public.colaboradores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo    TEXT NOT NULL,
  email            TEXT UNIQUE,                    -- opcional
  documento        TEXT UNIQUE,                    -- CPF, opcional
  diretoria_id     UUID REFERENCES public.diretorias(id) ON DELETE SET NULL,
  area_ids         UUID[] NOT NULL DEFAULT '{}',   -- FK[] → areas.id
  especialidade_id UUID REFERENCES public.especialidades(id) ON DELETE SET NULL,
  squad_ids        UUID[] NOT NULL DEFAULT '{}',   -- FK[] → squads.id
  senioridade      public.senioridade_enum NOT NULL,
  status           public.status_enum NOT NULL DEFAULT 'Ativo',
  data_admissao    TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_colaboradores_diretoria     ON public.colaboradores(diretoria_id);
CREATE INDEX idx_colaboradores_especialidade ON public.colaboradores(especialidade_id);
CREATE INDEX idx_colaboradores_senioridade   ON public.colaboradores(senioridade);
CREATE INDEX idx_colaboradores_status        ON public.colaboradores(status);

CREATE TRIGGER trg_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recria alocacoes (dependia de colaboradores)
CREATE TABLE public.alocacoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id   UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  scope            public.scope_enum NOT NULL,
  especialidade_id UUID REFERENCES public.especialidades(id) ON DELETE CASCADE,
  area_id          UUID REFERENCES public.areas(id)          ON DELETE CASCADE,
  diretoria_id     UUID REFERENCES public.diretorias(id)     ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (colaborador_id, especialidade_id),
  UNIQUE (colaborador_id, area_id),
  UNIQUE (colaborador_id, diretoria_id),

  CONSTRAINT chk_scope_especialidade CHECK (
    scope <> 'especialidade' OR (
      especialidade_id IS NOT NULL AND area_id IS NULL AND diretoria_id IS NULL
    )
  ),
  CONSTRAINT chk_scope_area CHECK (
    scope <> 'area' OR (
      area_id IS NOT NULL AND especialidade_id IS NULL AND diretoria_id IS NULL
    )
  ),
  CONSTRAINT chk_scope_diretoria CHECK (
    scope <> 'diretoria' OR (
      diretoria_id IS NOT NULL AND especialidade_id IS NULL AND area_id IS NULL
    )
  )
);

CREATE INDEX idx_alocacoes_colaborador   ON public.alocacoes(colaborador_id);
CREATE INDEX idx_alocacoes_especialidade ON public.alocacoes(especialidade_id) WHERE especialidade_id IS NOT NULL;
CREATE INDEX idx_alocacoes_area          ON public.alocacoes(area_id)          WHERE area_id IS NOT NULL;
CREATE INDEX idx_alocacoes_diretoria     ON public.alocacoes(diretoria_id)     WHERE diretoria_id IS NOT NULL;

-- Recria trigger de validação
CREATE OR REPLACE FUNCTION public.validate_alocacao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_senioridade  public.senioridade_enum;
  v_count        INT;
BEGIN
  SELECT senioridade INTO v_senioridade
  FROM public.colaboradores WHERE id = NEW.colaborador_id;

  IF v_senioridade = 'C-level' THEN
    RAISE EXCEPTION 'C-level tem escopo global e não deve ter alocações específicas.';
  END IF;

  IF v_senioridade IN ('Analista junior', 'Analista pleno', 'Analista senior', 'Staf I', 'Staf II') THEN
    IF NEW.scope <> 'especialidade' THEN
      RAISE EXCEPTION 'ICs só podem ser alocados em Especialidade. Scope inválido: %.', NEW.scope;
    END IF;
    SELECT COUNT(*) INTO v_count FROM public.alocacoes
    WHERE colaborador_id = NEW.colaborador_id AND id IS DISTINCT FROM NEW.id;
    IF v_count >= 1 THEN
      RAISE EXCEPTION 'ICs só podem ter exatamente 1 alocação.';
    END IF;
  END IF;

  IF v_senioridade IN ('Coordenador(a)', 'Gerente', 'Head') THEN
    IF NEW.scope <> 'area' THEN
      RAISE EXCEPTION '% só pode ser alocado em Áreas. Scope inválido: %.', v_senioridade, NEW.scope;
    END IF;
  END IF;

  IF v_senioridade = 'Diretor(a)' THEN
    IF NEW.scope = 'especialidade' THEN
      RAISE EXCEPTION 'Diretor(a) não pode ser alocado em Especialidade.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_alocacao
  BEFORE INSERT OR UPDATE ON public.alocacoes
  FOR EACH ROW EXECUTE FUNCTION public.validate_alocacao();

-- RLS
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alocacoes     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON public.colaboradores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.alocacoes     FOR ALL USING (true) WITH CHECK (true);

-- Recria torres (referenciava colaboradores via UUID)
-- Torres já existem, apenas recria as FKs que foram perdidas no CASCADE
ALTER TABLE public.torres
  DROP COLUMN IF EXISTS responsavel_negocio,
  DROP COLUMN IF EXISTS head_tecnologia,
  DROP COLUMN IF EXISTS head_produto,
  DROP COLUMN IF EXISTS gerente_produto,
  DROP COLUMN IF EXISTS gerente_design;

ALTER TABLE public.torres
  ADD COLUMN responsavel_negocio UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  ADD COLUMN head_tecnologia      UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  ADD COLUMN head_produto         UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  ADD COLUMN gerente_produto      UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  ADD COLUMN gerente_design       UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL;
