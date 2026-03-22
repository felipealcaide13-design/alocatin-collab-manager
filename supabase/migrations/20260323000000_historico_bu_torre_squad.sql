CREATE TABLE IF NOT EXISTS public.historico_bu_torre_squad (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento      text        NOT NULL,
  entidade_tipo    text        NOT NULL CHECK (entidade_tipo IN ('bu', 'torre', 'squad')),
  entidade_id      uuid        NOT NULL,
  entidade_pai_id  uuid,
  snapshot_dados   jsonb       NOT NULL,
  ocorrido_em      timestamptz NOT NULL DEFAULT now(),
  autor_alteracao  text
);

CREATE INDEX IF NOT EXISTS idx_hist_bu_entidade_id   ON public.historico_bu_torre_squad(entidade_id);
CREATE INDEX IF NOT EXISTS idx_hist_bu_ocorrido_em   ON public.historico_bu_torre_squad(ocorrido_em);
CREATE INDEX IF NOT EXISTS idx_hist_bu_entidade_tipo ON public.historico_bu_torre_squad(entidade_tipo);
CREATE INDEX IF NOT EXISTS idx_hist_bu_tipo_data     ON public.historico_bu_torre_squad(entidade_tipo, ocorrido_em);
