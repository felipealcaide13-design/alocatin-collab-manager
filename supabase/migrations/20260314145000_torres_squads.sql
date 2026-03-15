-- Tabela Torres
CREATE TABLE IF NOT EXISTS public.torres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  responsavel_negocio UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  head_tecnologia UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  head_produto UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  gerente_produto UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  gerente_design UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_torres_nome ON public.torres(nome);

ALTER TABLE public.torres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read torres" ON public.torres FOR SELECT USING (true);
CREATE POLICY "Allow public insert torres" ON public.torres FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update torres" ON public.torres FOR UPDATE USING (true);
CREATE POLICY "Allow public delete torres" ON public.torres FOR DELETE USING (true);

CREATE TRIGGER update_torres_updated_at
  BEFORE UPDATE ON public.torres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Tabela Squads
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  torre_id UUID NOT NULL REFERENCES public.torres(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  lider UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  membros UUID[] DEFAULT '{}',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squads_nome ON public.squads(nome);
CREATE INDEX IF NOT EXISTS idx_squads_torre ON public.squads(torre_id);
CREATE INDEX IF NOT EXISTS idx_squads_contrato ON public.squads(contrato_id);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read squads" ON public.squads FOR SELECT USING (true);
CREATE POLICY "Allow public insert squads" ON public.squads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update squads" ON public.squads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete squads" ON public.squads FOR DELETE USING (true);

CREATE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
