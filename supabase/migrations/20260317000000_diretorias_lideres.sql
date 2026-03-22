-- Adiciona coluna lideres na tabela diretorias
ALTER TABLE diretorias ADD COLUMN IF NOT EXISTS lideres text[] NOT NULL DEFAULT '{}';
