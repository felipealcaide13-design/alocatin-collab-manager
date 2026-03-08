-- Tabela Colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nomeCompleto" TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  documento TEXT UNIQUE NOT NULL,
  cargo TEXT NOT NULL,
  pilar TEXT NOT NULL,
  area TEXT NOT NULL,
  subarea TEXT,
  senioridade TEXT NOT NULL,
  status TEXT NOT NULL,
  "dataAdmissao" TEXT NOT NULL,
  time TEXT
);

-- Tabela Áreas (nova)
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  pilar TEXT CHECK (pilar IN ('Engenharia','Produto','Financeiro','RH','Marketing')) NOT NULL,
  subareas_possiveis TEXT[], -- ex: ['QA','Tech Writer']
  lideres UUID[], -- foreign key para colaboradores.ids
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Relação Colaborador ↔ Área (many-to-many)
CREATE TABLE IF NOT EXISTS colaborador_areas (
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  PRIMARY KEY (colaborador_id, area_id)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_areas_pilar ON areas(pilar);
CREATE INDEX IF NOT EXISTS idx_colaborador_areas ON colaborador_areas(colaborador_id);

-- RLS Policies (básicas)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_colaboradores" ON colaboradores FOR ALL USING (true);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_areas" ON areas FOR ALL USING (true);

ALTER TABLE colaborador_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_relations" ON colaborador_areas FOR ALL USING (true);

-- Tabela Contratos (Gestão de Projetos Contratuais)
CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  valor_total DECIMAL(12,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT CHECK (status IN ('Ativo','Encerrado','Pausado')) DEFAULT 'Ativo',
  descricao TEXT,
  torres UUID[], -- futuro
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance Contratos
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(cliente);

-- RLS Policies Contratos
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_contratos" ON contratos FOR ALL USING (true);
