-- 1. CRIAR TABELAS INDEPENDENTES
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  subareas_possiveis TEXT[] DEFAULT '{}',
  lideres UUID[] DEFAULT '{}',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criando a tabela de colaboradores que estava faltando no seu schema
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  valor_total DECIMAL(12,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Encerrado', 'Pausado')),
  descricao TEXT,
  torres UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. CRIAR TABELAS DE RELAÇÃO (DEPENDENTES)
CREATE TABLE IF NOT EXISTS public.colaborador_areas (
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  PRIMARY KEY (colaborador_id, area_id)
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_areas_nome ON public.areas(nome);
CREATE INDEX IF NOT EXISTS idx_colaborador_areas_colab ON public.colaborador_areas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos(status);

-- 4. RLS (SEGURANÇA)
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON public.areas FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.colaboradores FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.contratos FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.colaborador_areas FOR ALL USING (true);

-- 5. TRIGGERS
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();