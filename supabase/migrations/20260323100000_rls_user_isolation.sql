-- ============================================================
-- Migração: Isolamento de Dados por Usuário (Row Level Security)
-- Data: 2026-03-23
-- ============================================================

-- 1. ADICIONA user_id NAS TABELAS PRINCIPAIS
ALTER TABLE public.diretorias      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.areas           ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.especialidades  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.colaboradores   ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.business_units  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.torres          ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.squads          ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contratos       ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. REMOVE DADOS ÓRFÃOS (sem user_id)
DELETE FROM public.historico_bu_torre_squad
  WHERE entidade_id IN (SELECT id FROM public.squads WHERE user_id IS NULL)
     OR entidade_id IN (SELECT id FROM public.torres WHERE user_id IS NULL)
     OR entidade_id IN (SELECT id FROM public.business_units WHERE user_id IS NULL);
DELETE FROM public.historico_alteracoes WHERE colaborador_id IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
DELETE FROM public.alocacoes WHERE colaborador_id IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
DELETE FROM public.contract_costs WHERE contrato_id IN (SELECT id FROM public.contratos WHERE user_id IS NULL);
UPDATE public.torres SET responsavel_negocio = NULL WHERE responsavel_negocio IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
UPDATE public.torres SET head_tecnologia = NULL WHERE head_tecnologia IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
UPDATE public.torres SET head_produto = NULL WHERE head_produto IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
UPDATE public.torres SET gerente_produto = NULL WHERE gerente_produto IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
UPDATE public.torres SET gerente_design = NULL WHERE gerente_design IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
UPDATE public.colaboradores SET lider_id = NULL WHERE lider_id IN (SELECT id FROM public.colaboradores WHERE user_id IS NULL);
DELETE FROM public.squads WHERE user_id IS NULL;
DELETE FROM public.torres WHERE user_id IS NULL;
DELETE FROM public.bu_torre_configs WHERE bu_id IN (SELECT id FROM public.business_units WHERE user_id IS NULL);
DELETE FROM public.business_units WHERE user_id IS NULL;
DELETE FROM public.colaboradores WHERE user_id IS NULL;
DELETE FROM public.contratos WHERE user_id IS NULL;
DELETE FROM public.especialidades WHERE user_id IS NULL;
DELETE FROM public.areas WHERE user_id IS NULL;
DELETE FROM public.diretorias WHERE user_id IS NULL;

-- 3. TORNA user_id NOT NULL com DEFAULT auth.uid()
ALTER TABLE public.diretorias      ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.areas           ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.especialidades  ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.colaboradores   ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.business_units  ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.torres          ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.squads          ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.contratos       ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. HABILITA RLS EM TODAS AS TABELAS
ALTER TABLE public.diretorias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_units       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torres               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_costs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alocacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bu_torre_configs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_bu_torre_squad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bu_form_config       ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES PARA TABELAS PRINCIPAIS
CREATE POLICY "users_select_diretorias"  ON public.diretorias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_diretorias"  ON public.diretorias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_diretorias"  ON public.diretorias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_diretorias"  ON public.diretorias FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_areas"  ON public.areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_areas"  ON public.areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_areas"  ON public.areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_areas"  ON public.areas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_especialidades"  ON public.especialidades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_especialidades"  ON public.especialidades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_especialidades"  ON public.especialidades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_especialidades"  ON public.especialidades FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_colaboradores"  ON public.colaboradores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_colaboradores"  ON public.colaboradores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_colaboradores"  ON public.colaboradores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_colaboradores"  ON public.colaboradores FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_business_units"  ON public.business_units FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_business_units"  ON public.business_units FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_business_units"  ON public.business_units FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_business_units"  ON public.business_units FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_torres"  ON public.torres FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_torres"  ON public.torres FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_torres"  ON public.torres FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_torres"  ON public.torres FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_squads"  ON public.squads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_squads"  ON public.squads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_squads"  ON public.squads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_squads"  ON public.squads FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_select_contratos"  ON public.contratos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_contratos"  ON public.contratos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_contratos"  ON public.contratos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_contratos"  ON public.contratos FOR DELETE USING (auth.uid() = user_id);

-- 6. POLICIES PARA TABELAS FILHAS (via join)
CREATE POLICY "users_select_contract_costs" ON public.contract_costs FOR SELECT USING (EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = contrato_id AND c.user_id = auth.uid()));
CREATE POLICY "users_insert_contract_costs" ON public.contract_costs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = contrato_id AND c.user_id = auth.uid()));
CREATE POLICY "users_update_contract_costs" ON public.contract_costs FOR UPDATE USING (EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = contrato_id AND c.user_id = auth.uid()));
CREATE POLICY "users_delete_contract_costs" ON public.contract_costs FOR DELETE USING (EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = contrato_id AND c.user_id = auth.uid()));

CREATE POLICY "users_select_alocacoes" ON public.alocacoes FOR SELECT USING (EXISTS (SELECT 1 FROM public.colaboradores col WHERE col.id = colaborador_id AND col.user_id = auth.uid()));
CREATE POLICY "users_insert_alocacoes" ON public.alocacoes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.colaboradores col WHERE col.id = colaborador_id AND col.user_id = auth.uid()));
CREATE POLICY "users_update_alocacoes" ON public.alocacoes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.colaboradores col WHERE col.id = colaborador_id AND col.user_id = auth.uid()));
CREATE POLICY "users_delete_alocacoes" ON public.alocacoes FOR DELETE USING (EXISTS (SELECT 1 FROM public.colaboradores col WHERE col.id = colaborador_id AND col.user_id = auth.uid()));

CREATE POLICY "users_select_bu_torre_configs" ON public.bu_torre_configs FOR SELECT USING (EXISTS (SELECT 1 FROM public.business_units bu WHERE bu.id = bu_id AND bu.user_id = auth.uid()));
CREATE POLICY "users_insert_bu_torre_configs" ON public.bu_torre_configs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.business_units bu WHERE bu.id = bu_id AND bu.user_id = auth.uid()));
CREATE POLICY "users_update_bu_torre_configs" ON public.bu_torre_configs FOR UPDATE USING (EXISTS (SELECT 1 FROM public.business_units bu WHERE bu.id = bu_id AND bu.user_id = auth.uid()));
CREATE POLICY "users_delete_bu_torre_configs" ON public.bu_torre_configs FOR DELETE USING (EXISTS (SELECT 1 FROM public.business_units bu WHERE bu.id = bu_id AND bu.user_id = auth.uid()));

CREATE POLICY "users_select_historico_bu" ON public.historico_bu_torre_squad FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.business_units bu WHERE bu.id = entidade_id AND bu.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.torres t WHERE t.id = entidade_id AND t.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = entidade_id AND s.user_id = auth.uid())
);
CREATE POLICY "users_insert_historico_bu" ON public.historico_bu_torre_squad FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.business_units bu WHERE bu.id = entidade_id AND bu.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.torres t WHERE t.id = entidade_id AND t.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = entidade_id AND s.user_id = auth.uid())
);

CREATE POLICY "users_select_historico_alteracoes" ON public.historico_alteracoes FOR SELECT USING (EXISTS (SELECT 1 FROM public.colaboradores col WHERE col.id = colaborador_id AND col.user_id = auth.uid()));
CREATE POLICY "users_insert_historico_alteracoes" ON public.historico_alteracoes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.colaboradores col WHERE col.id = colaborador_id AND col.user_id = auth.uid()));

-- bu_form_config: configuração global, todos autenticados podem ler
CREATE POLICY "authenticated_select_bu_form_config" ON public.bu_form_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_update_bu_form_config" ON public.bu_form_config FOR UPDATE TO authenticated USING (true);
