-- ============================================================
-- SCHEMA DEFINITIVO — Alocatin
-- Drop completo + recriação limpa
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 0. LIMPEZA TOTAL (ordem inversa de dependência)
-- ============================================================
DROP TABLE IF EXISTS public.alocacoes          CASCADE;
DROP TABLE IF EXISTS public.colaborador_areas  CASCADE;
DROP TABLE IF EXISTS public.squads             CASCADE;
DROP TABLE IF EXISTS public.torres             CASCADE;
DROP TABLE IF EXISTS public.especialidades     CASCADE;
DROP TABLE IF EXISTS public.areas              CASCADE;
DROP TABLE IF EXISTS public.diretorias         CASCADE;
DROP TABLE IF EXISTS public.contratos          CASCADE;
DROP TABLE IF EXISTS public.colaboradores      CASCADE;

DROP TYPE IF EXISTS public.senioridade_enum CASCADE;
DROP TYPE IF EXISTS public.status_enum      CASCADE;
DROP TYPE IF EXISTS public.pilar_enum       CASCADE;
DROP TYPE IF EXISTS public.scope_enum       CASCADE;

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- Senioridades alinhadas com o frontend (src/types/colaborador.ts)
CREATE TYPE public.senioridade_enum AS ENUM (
  'C-level',
  'Diretor(a)',
  'Head',
  'Gerente',
  'Coordenador(a)',
  'Staf I',
  'Staf II',
  'Analista senior',
  'Analista pleno',
  'Analista junior'
);

CREATE TYPE public.status_enum AS ENUM (
  'Ativo',
  'Desligado'
);

-- Escopo de alocação para a tabela alocacoes
CREATE TYPE public.scope_enum AS ENUM (
  'especialidade',  -- IC: alocado em L3
  'area',           -- Coordenador/Gerente/Diretor: alocado em L2
  'diretoria'       -- Diretor: alocado em L1
);

-- ============================================================
-- 2. FUNÇÃO UTILITÁRIA (updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. HIERARQUIA ORGANIZACIONAL
-- ============================================================

-- L1: Diretorias
CREATE TABLE public.diretorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_diretorias_updated_at
  BEFORE UPDATE ON public.diretorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- L2: Áreas
CREATE TABLE public.areas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT NOT NULL,
  diretoria_id        UUID REFERENCES public.diretorias(id) ON DELETE SET NULL,
  lideres             UUID[] NOT NULL DEFAULT '{}',
  subareas_possiveis  TEXT[] NOT NULL DEFAULT '{}',  -- legado, não usado na UI
  descricao           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_areas_diretoria_id ON public.areas(diretoria_id);

CREATE TRIGGER trg_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- L3: Especialidades
CREATE TABLE public.especialidades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  area_id     UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_especialidades_area_id ON public.especialidades(area_id);

CREATE TRIGGER trg_especialidades_updated_at
  BEFORE UPDATE ON public.especialidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. CONTRATOS
-- ============================================================
CREATE TABLE public.contratos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  cliente     TEXT NOT NULL,
  valor_total DECIMAL(12,2),
  data_inicio DATE NOT NULL,
  data_fim    DATE,
  status      TEXT NOT NULL DEFAULT 'Ativo'
                CHECK (status IN ('Ativo', 'Encerrado', 'Pausado')),
  descricao   TEXT,
  torres      UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_status  ON public.contratos(status);
CREATE INDEX idx_contratos_cliente ON public.contratos(cliente);

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. COLABORADORES
-- ============================================================
CREATE TABLE public.colaboradores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo    TEXT NOT NULL,
  email            TEXT UNIQUE,           -- opcional
  documento        TEXT UNIQUE,           -- CPF, opcional
  area             TEXT NOT NULL,         -- nome da área (texto livre, compatibilidade UI)
  subarea          TEXT,                  -- legado
  especialidade_id UUID REFERENCES public.especialidades(id) ON DELETE SET NULL,
  senioridade      public.senioridade_enum NOT NULL,
  status           public.status_enum NOT NULL DEFAULT 'Ativo',
  data_admissao    TEXT NOT NULL,
  time             TEXT,                  -- nome da squad (texto, compatibilidade UI)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_colaboradores_senioridade    ON public.colaboradores(senioridade);
CREATE INDEX idx_colaboradores_status         ON public.colaboradores(status);
CREATE INDEX idx_colaboradores_especialidade  ON public.colaboradores(especialidade_id);

CREATE TRIGGER trg_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. TORRES E SQUADS
-- ============================================================
CREATE TABLE public.torres (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 TEXT NOT NULL,
  responsavel_negocio  UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  head_tecnologia      UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  head_produto         UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  gerente_produto      UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  gerente_design       UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  descricao            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_torres_nome ON public.torres(nome);

CREATE TRIGGER trg_torres_updated_at
  BEFORE UPDATE ON public.torres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.squads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  torre_id    UUID NOT NULL REFERENCES public.torres(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  lider       UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  membros     UUID[] NOT NULL DEFAULT '{}',
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_squads_torre    ON public.squads(torre_id);
CREATE INDEX idx_squads_contrato ON public.squads(contrato_id);

CREATE TRIGGER trg_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. ALOCAÇÕES (cardinalidade variável por senioridade)
-- ============================================================
-- Regras:
--   IC (Analista*/Staf*): scope='especialidade', exatamente 1 linha
--   Coordenador(a)/Gerente/Head: scope='area', 1..N linhas
--   Diretor(a): scope IN ('area','diretoria'), 1..N linhas
--   C-level: sem linhas (escopo global implícito)

CREATE TABLE public.alocacoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id   UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  scope            public.scope_enum NOT NULL,

  -- Exatamente um FK preenchido conforme o scope
  especialidade_id UUID REFERENCES public.especialidades(id) ON DELETE CASCADE,
  area_id          UUID REFERENCES public.areas(id)          ON DELETE CASCADE,
  diretoria_id     UUID REFERENCES public.diretorias(id)     ON DELETE CASCADE,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unicidade por unidade
  UNIQUE (colaborador_id, especialidade_id),
  UNIQUE (colaborador_id, area_id),
  UNIQUE (colaborador_id, diretoria_id),

  -- Integridade: FK correto para cada scope
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

-- ============================================================
-- 8. TRIGGER DE VALIDAÇÃO DE ALOCAÇÃO
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_alocacao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_senioridade  public.senioridade_enum;
  v_count        INT;
BEGIN
  SELECT senioridade INTO v_senioridade
  FROM public.colaboradores
  WHERE id = NEW.colaborador_id;

  -- C-level: escopo global, sem alocações específicas
  IF v_senioridade = 'C-level' THEN
    RAISE EXCEPTION 'C-level tem escopo global e não deve ter alocações específicas.';
  END IF;

  -- ICs: apenas especialidade, máximo 1
  IF v_senioridade IN ('Analista junior', 'Analista pleno', 'Analista senior', 'Staf I', 'Staf II') THEN
    IF NEW.scope <> 'especialidade' THEN
      RAISE EXCEPTION
        'Colaboradores IC (%) só podem ser alocados em uma Especialidade (L3). Scope inválido: %.',
        v_senioridade, NEW.scope;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM public.alocacoes
    WHERE colaborador_id = NEW.colaborador_id
      AND id IS DISTINCT FROM NEW.id;

    IF v_count >= 1 THEN
      RAISE EXCEPTION
        'Colaboradores IC só podem ter exatamente 1 alocação. Remova a existente antes de inserir.';
    END IF;
  END IF;

  -- Coordenador(a) / Gerente / Head: apenas área
  IF v_senioridade IN ('Coordenador(a)', 'Gerente', 'Head') THEN
    IF NEW.scope <> 'area' THEN
      RAISE EXCEPTION
        '% só pode ser alocado em Áreas (L2). Scope inválido: %.',
        v_senioridade, NEW.scope;
    END IF;
  END IF;

  -- Diretor(a): área ou diretoria, nunca especialidade
  IF v_senioridade = 'Diretor(a)' THEN
    IF NEW.scope = 'especialidade' THEN
      RAISE EXCEPTION
        'Diretor(a) não pode ser alocado diretamente em uma Especialidade (L3).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_alocacao
  BEFORE INSERT OR UPDATE ON public.alocacoes
  FOR EACH ROW EXECUTE FUNCTION public.validate_alocacao();

-- ============================================================
-- 9. FUNÇÃO: get_subordinados(gestor_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_subordinados(p_gestor_id UUID)
RETURNS TABLE (
  colaborador_id  UUID,
  nome_completo   TEXT,
  senioridade     public.senioridade_enum,
  via_scope       TEXT,
  via_id          UUID,
  via_nome        TEXT
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_senioridade public.senioridade_enum;
BEGIN
  SELECT c.senioridade INTO v_senioridade
  FROM public.colaboradores c WHERE c.id = p_gestor_id;

  IF v_senioridade IS NULL THEN
    RAISE EXCEPTION 'Colaborador % não encontrado.', p_gestor_id;
  END IF;

  -- C-level: todos
  IF v_senioridade = 'C-level' THEN
    RETURN QUERY
      SELECT c.id, c.nome_completo, c.senioridade,
             'global'::TEXT, NULL::UUID, 'Empresa'::TEXT
      FROM public.colaboradores c
      WHERE c.id <> p_gestor_id;
    RETURN;
  END IF;

  -- Coordenador(a) / Gerente / Head: ICs nas especialidades das suas áreas
  IF v_senioridade IN ('Coordenador(a)', 'Gerente', 'Head') THEN
    RETURN QUERY
      SELECT DISTINCT c.id, c.nome_completo, c.senioridade,
             'especialidade'::TEXT, e.id, e.nome
      FROM public.alocacoes  g_al
      JOIN public.especialidades e  ON e.area_id = g_al.area_id
      JOIN public.alocacoes  ic_al  ON ic_al.especialidade_id = e.id
                                    AND ic_al.scope = 'especialidade'
      JOIN public.colaboradores c   ON c.id = ic_al.colaborador_id
      WHERE g_al.colaborador_id = p_gestor_id
        AND g_al.scope = 'area'
        AND c.id <> p_gestor_id;
    RETURN;
  END IF;

  -- Diretor(a): tudo abaixo das suas áreas e/ou diretorias
  IF v_senioridade = 'Diretor(a)' THEN
    RETURN QUERY
      -- Via scope='area': ICs das especialidades + gestores da área
      SELECT DISTINCT c.id, c.nome_completo, c.senioridade,
             al.scope::TEXT,
             CASE al.scope
               WHEN 'especialidade' THEN e.id
               WHEN 'area'          THEN a.id
             END,
             CASE al.scope
               WHEN 'especialidade' THEN e.nome
               WHEN 'area'          THEN a.nome
             END
      FROM public.alocacoes dir_al
      JOIN public.areas a             ON a.id = dir_al.area_id
      LEFT JOIN public.especialidades e ON e.area_id = a.id
      JOIN public.alocacoes al        ON (
            (al.especialidade_id = e.id  AND al.scope = 'especialidade')
         OR (al.area_id          = a.id  AND al.scope = 'area')
      )
      JOIN public.colaboradores c     ON c.id = al.colaborador_id
      WHERE dir_al.colaborador_id = p_gestor_id
        AND dir_al.scope = 'area'
        AND c.id <> p_gestor_id

      UNION

      -- Via scope='diretoria': tudo dentro da diretoria
      SELECT DISTINCT c.id, c.nome_completo, c.senioridade,
             al.scope::TEXT,
             CASE al.scope
               WHEN 'especialidade' THEN e2.id
               WHEN 'area'          THEN a2.id
               WHEN 'diretoria'     THEN d.id
             END,
             CASE al.scope
               WHEN 'especialidade' THEN e2.nome
               WHEN 'area'          THEN a2.nome
               WHEN 'diretoria'     THEN d.nome
             END
      FROM public.alocacoes dir_al2
      JOIN public.diretorias d          ON d.id = dir_al2.diretoria_id
      JOIN public.areas a2              ON a2.diretoria_id = d.id
      LEFT JOIN public.especialidades e2 ON e2.area_id = a2.id
      JOIN public.alocacoes al          ON (
            (al.especialidade_id = e2.id AND al.scope = 'especialidade')
         OR (al.area_id          = a2.id AND al.scope = 'area')
         OR (al.diretoria_id     = d.id  AND al.scope = 'diretoria')
      )
      JOIN public.colaboradores c       ON c.id = al.colaborador_id
      WHERE dir_al2.colaborador_id = p_gestor_id
        AND dir_al2.scope = 'diretoria'
        AND c.id <> p_gestor_id;
    RETURN;
  END IF;

  -- ICs não têm subordinados
  RETURN;
END;
$$;

-- ============================================================
-- 10. VIEW: alocacoes_expandidas
-- ============================================================
CREATE OR REPLACE VIEW public.alocacoes_expandidas AS
SELECT
  al.id                                             AS alocacao_id,
  al.colaborador_id,
  c.nome_completo,
  c.senioridade,
  al.scope,
  e.id                                              AS especialidade_id,
  e.nome                                            AS especialidade_nome,
  COALESCE(a_dir.id,   a_via_esp.id)                AS area_id,
  COALESCE(a_dir.nome, a_via_esp.nome)              AS area_nome,
  COALESCE(d_dir.id,   d_via_area.id, d_via_esp.id) AS diretoria_id,
  COALESCE(d_dir.nome, d_via_area.nome, d_via_esp.nome) AS diretoria_nome
FROM public.alocacoes al
JOIN  public.colaboradores  c         ON c.id  = al.colaborador_id
LEFT JOIN public.especialidades e     ON e.id  = al.especialidade_id
LEFT JOIN public.areas  a_via_esp     ON a_via_esp.id = e.area_id
LEFT JOIN public.diretorias d_via_esp ON d_via_esp.id = a_via_esp.diretoria_id
LEFT JOIN public.areas  a_dir         ON a_dir.id = al.area_id
LEFT JOIN public.diretorias d_via_area ON d_via_area.id = a_dir.diretoria_id
LEFT JOIN public.diretorias d_dir     ON d_dir.id = al.diretoria_id;

-- ============================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.diretorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torres        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alocacoes     ENABLE ROW LEVEL SECURITY;

-- Políticas abertas (ajustar quando auth for implementado)
CREATE POLICY "public_all" ON public.diretorias    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.areas         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.especialidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.colaboradores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.contratos     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.torres        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.squads        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON public.alocacoes     FOR ALL USING (true) WITH CHECK (true);
