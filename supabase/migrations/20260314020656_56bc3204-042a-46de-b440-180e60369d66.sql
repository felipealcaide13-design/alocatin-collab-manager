-- Tabela Áreas (sem campo pilar - área É o pilar no sistema)
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  subareas_possiveis TEXT[] DEFAULT '{}',
  lideres UUID[] DEFAULT '{}',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_areas_nome ON public.areas(nome);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Allow public insert areas" ON public.areas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update areas" ON public.areas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete areas" ON public.areas FOR DELETE USING (true);

CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de relação Colaborador <-> Area (many-to-many)
CREATE TABLE IF NOT EXISTS public.colaborador_areas (
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  PRIMARY KEY (colaborador_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_colaborador_areas_colab ON public.colaborador_areas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_areas_area ON public.colaborador_areas(area_id);

ALTER TABLE public.colaborador_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read colaborador_areas" ON public.colaborador_areas FOR SELECT USING (true);
CREATE POLICY "Allow public insert colaborador_areas" ON public.colaborador_areas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update colaborador_areas" ON public.colaborador_areas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete colaborador_areas" ON public.colaborador_areas FOR DELETE USING (true);

-- Tabela Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  valor_total DECIMAL(12,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'Ativo',
  descricao TEXT,
  torres UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT contratos_status_check CHECK (status IN ('Ativo', 'Encerrado', 'Pausado'))
);

CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos(cliente);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read contratos" ON public.contratos FOR SELECT USING (true);
CREATE POLICY "Allow public insert contratos" ON public.contratos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update contratos" ON public.contratos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete contratos" ON public.contratos FOR DELETE USING (true);

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Remover coluna 'pilar' da tabela colaboradores (pilar = area agora)
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS pilar;