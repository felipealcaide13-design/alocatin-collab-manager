-- ============================================================
-- MIGRAÇÃO: Modelos Financeiros de Contrato (Aberto / Fechado)
-- ============================================================

-- 1. ENUM contract_type
DO $$ BEGIN
  CREATE TYPE public.contract_type_enum AS ENUM ('Aberto', 'Fechado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Adicionar coluna contract_type na tabela contratos
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS contract_type public.contract_type_enum NOT NULL DEFAULT 'Fechado';

-- 3. Check Constraint: Fechado exige data_fim
ALTER TABLE public.contratos
  DROP CONSTRAINT IF EXISTS chk_fechado_requires_data_fim;

ALTER TABLE public.contratos
  ADD CONSTRAINT chk_fechado_requires_data_fim
    CHECK (
      contract_type <> 'Fechado' OR data_fim IS NOT NULL
    );

-- 4. Renomear valor_total → valor para semântica neutra
--    (valor = mensal se Aberto, total do período se Fechado)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'contratos'
      AND column_name  = 'valor_total'
  ) THEN
    ALTER TABLE public.contratos RENAME COLUMN valor_total TO valor;
  END IF;
END $$;

-- 5. Tabela contract_costs (custos por contrato)
--    Para Aberto: valores mensais. Para Fechado: valores totais do período.
CREATE TABLE IF NOT EXISTS public.contract_costs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id  UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  categoria    TEXT NOT NULL,          -- Ex: 'Pessoas', 'Infra', 'Licenças', 'Outros'
  descricao    TEXT,
  valor        DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_costs_contrato ON public.contract_costs(contrato_id);

CREATE TRIGGER trg_contract_costs_updated_at
  BEFORE UPDATE ON public.contract_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.contract_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON public.contract_costs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. VIEW: v_dashboard_receita_mensal
--    Unifica Abertos (valor mensal direto) + Fechados (média mensal)
--    para exibição em gráfico de faturamento por mês.
-- ============================================================
CREATE OR REPLACE VIEW public.v_dashboard_receita_mensal AS
WITH contratos_ativos AS (
  SELECT
    id,
    nome,
    cliente,
    contract_type,
    valor,
    data_inicio,
    data_fim,
    status
  FROM public.contratos
  WHERE status = 'Ativo'
),
custos_por_contrato AS (
  SELECT
    contrato_id,
    SUM(valor) AS total_custos
  FROM public.contract_costs
  GROUP BY contrato_id
),
base AS (
  SELECT
    c.id,
    c.nome,
    c.cliente,
    c.contract_type,
    c.status,
    c.data_inicio,
    c.data_fim,

    -- Receita mensal normalizada
    CASE
      WHEN c.contract_type = 'Aberto'  THEN c.valor
      WHEN c.contract_type = 'Fechado' THEN
        CASE
          WHEN c.data_fim IS NOT NULL AND c.data_fim > c.data_inicio THEN
            ROUND(
              c.valor /
              GREATEST(
                1,
                (EXTRACT(YEAR FROM c.data_fim)  - EXTRACT(YEAR FROM c.data_inicio)) * 12 +
                (EXTRACT(MONTH FROM c.data_fim) - EXTRACT(MONTH FROM c.data_inicio))
              ),
              2
            )
          ELSE c.valor
        END
    END AS receita_mensal,

    -- Receita anual prevista
    CASE
      WHEN c.contract_type = 'Aberto'  THEN c.valor * 12
      WHEN c.contract_type = 'Fechado' THEN c.valor
    END AS receita_anual_prevista,

    -- Custos normalizados para mensal
    CASE
      WHEN c.contract_type = 'Aberto'  THEN COALESCE(cc.total_custos, 0)
      WHEN c.contract_type = 'Fechado' THEN
        CASE
          WHEN c.data_fim IS NOT NULL AND c.data_fim > c.data_inicio THEN
            ROUND(
              COALESCE(cc.total_custos, 0) /
              GREATEST(
                1,
                (EXTRACT(YEAR FROM c.data_fim)  - EXTRACT(YEAR FROM c.data_inicio)) * 12 +
                (EXTRACT(MONTH FROM c.data_fim) - EXTRACT(MONTH FROM c.data_inicio))
              ),
              2
            )
          ELSE COALESCE(cc.total_custos, 0)
        END
    END AS custo_mensal,

    COALESCE(cc.total_custos, 0) AS total_custos_periodo

  FROM contratos_ativos c
  LEFT JOIN custos_por_contrato cc ON cc.contrato_id = c.id
)
SELECT
  id,
  nome,
  cliente,
  contract_type,
  status,
  data_inicio,
  data_fim,
  receita_mensal,
  receita_anual_prevista,
  custo_mensal,
  total_custos_periodo,
  ROUND(receita_mensal - custo_mensal, 2)                                    AS margem_mensal,
  CASE
    WHEN receita_mensal > 0
    THEN ROUND(((receita_mensal - custo_mensal) / receita_mensal) * 100, 2)
    ELSE 0
  END                                                                         AS margem_percentual_mensal
FROM base;

-- ============================================================
-- 7. VIEW: v_faturamento_consolidado
--    Linha única com totais para o dashboard principal
-- ============================================================
CREATE OR REPLACE VIEW public.v_faturamento_consolidado AS
SELECT
  COUNT(*)                          AS total_contratos_ativos,
  SUM(receita_mensal)               AS receita_mensal_total,
  SUM(receita_anual_prevista)       AS receita_anual_prevista_total,
  SUM(custo_mensal)                 AS custo_mensal_total,
  SUM(margem_mensal)                AS margem_mensal_total,
  CASE
    WHEN SUM(receita_mensal) > 0
    THEN ROUND((SUM(margem_mensal) / SUM(receita_mensal)) * 100, 2)
    ELSE 0
  END                               AS margem_percentual_media
FROM public.v_dashboard_receita_mensal;
