-- Cria tabela de histórico de alterações de colaboradores
-- Registra cada mudança nos campos rastreáveis: senioridade, diretoria_id, status, bu_id, torre_ids, squad_ids

CREATE TABLE public.historico_alteracoes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id  uuid        NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  campo           text        NOT NULL,
  valor_anterior  text,
  novo_valor      text,
  alterado_em     timestamptz NOT NULL DEFAULT now(),
  autor_alteracao text
);

CREATE INDEX idx_historico_colaborador_id ON public.historico_alteracoes(colaborador_id);
CREATE INDEX idx_historico_alterado_em    ON public.historico_alteracoes(alterado_em);
