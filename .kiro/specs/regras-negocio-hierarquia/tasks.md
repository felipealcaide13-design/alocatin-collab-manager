# Implementation Plan: Regras de Negócio de Hierarquia

## Overview

Implementação incremental das regras de negócio de hierarquia organizacional: migração SQL, tipos TypeScript, serviço de alocações e testes de propriedade.

## Tasks

- [x] 1. Criar migração SQL com schema revisado e funções corrigidas
  - Criar arquivo `supabase/migrations/YYYYMMDD_regras_negocio_hierarquia.sql`
  - Alterar `areas.diretoria_id` para NOT NULL (verificar dados existentes antes)
  - Recriar trigger `validate_alocacao` com regras completas incluindo Staf I/II aceitando `area`/`diretoria` (não `especialidade`)
  - Recriar função `get_subordinados` com lógica corrigida para todos os níveis de senioridade
  - Criar nova função `get_caminho_colaborador` retornando caminho + gestor imediato
  - Recriar view `alocacoes_expandidas` com JOINs transitivos corretos para todos os scopes
  - _Requirements: 1.2, 2.1–2.12, 3.1–3.6, 4.1–4.7, 5.1–5.5, 6.1–6.9_

- [x] 2. Criar tipos TypeScript para alocações
  - [x] 2.1 Criar arquivo `src/types/alocacao.ts` com interfaces e tipos
    - Definir interface `AlocacaoExpandida` com todos os campos da view
    - Definir interface `CaminhoHierarquico` com campos `caminho`, `gestor_id`, `gestor_nome`, `gestor_senioridade`
    - Definir interface `ColaboradorComAlocacoes` estendendo `Colaborador`
    - Definir tipo `AlocacaoInput` para inserção
    - Definir tipo `SubordinadoRow` para retorno da RPC
    - _Requirements: 5.1, 4.7, 7.1_

  - [ ]* 2.2 Escrever property test para round-trip de ColaboradorComAlocacoes (Property 14)
    - **Property 14: Round-trip de serialização de ColaboradorComAlocacoes**
    - **Validates: Requirements 7.2**

- [x] 3. Atualizar tipos Supabase gerados
  - [x] 3.1 Atualizar `src/integrations/supabase/types.ts` com novos tipos
    - Adicionar tipo de retorno para RPC `get_caminho_colaborador`
    - Adicionar tipo de retorno para RPC `get_subordinados`
    - Adicionar tipo para view `alocacoes_expandidas`
    - _Requirements: 4.7, 3.1, 5.1_

- [x] 4. Criar serviço `alocacaoService`
  - [x] 4.1 Criar arquivo `src/services/alocacaoService.ts` com métodos base
    - Implementar `getByColaborador(colaboradorId)` consultando view `alocacoes_expandidas`
    - Implementar `alocar(input)` inserindo na tabela `alocacoes` (trigger valida no banco)
    - Implementar `desalocar(alocacaoId)` removendo alocação
    - _Requirements: 5.1–5.5, 2.1–2.12, 6.1–6.9_

  - [x] 4.2 Adicionar métodos RPC ao serviço
    - Implementar `getCaminho(colaboradorId)` chamando RPC `get_caminho_colaborador`
    - Implementar `getSubordinados(gestorId)` chamando RPC `get_subordinados`
    - Implementar `getColaboradorComAlocacoes(colaboradorId)` montando `ColaboradorComAlocacoes`
    - _Requirements: 4.1–4.7, 3.2–3.5, 7.1–7.4_

  - [ ]* 4.3 Escrever property test para scope válido por grupo de senioridade (Property 4)
    - **Property 4: Scope válido por grupo de senioridade**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10**

  - [ ]* 4.4 Escrever property test para C-level sem alocações (Property 3)
    - **Property 3: C-level não pode ter alocações**
    - **Validates: Requirements 2.1**

  - [ ]* 4.5 Escrever property test para IC com exatamente 1 alocação (Property 5)
    - **Property 5: IC Analista tem exatamente 1 alocação**
    - **Validates: Requirements 2.11**

- [x] 5. Checkpoint — Garantir que os tipos compilam e o serviço está integrado
  - Garantir que todos os tipos estão corretos e o serviço importa sem erros, perguntar ao usuário se houver dúvidas.

- [x] 6. Criar testes de propriedade e unitários
  - [x] 6.1 Criar arquivo `src/test/regras-negocio-hierarquia.test.ts` com setup e geradores fast-check
    - Instalar `fast-check` se necessário (`npm install fast-check`)
    - Definir geradores: `arbSenioridade`, `arbScope`, `arbColaboradorIC`, `arbAlocacaoExpandida`, `arbColaboradorComAlocacoes`
    - Configurar mocks do Supabase client para testes unitários
    - _Requirements: 7.1_

  - [x] 6.2 Implementar property tests para estrutura hierárquica (Properties 1 e 2)
    - **Property 1: Área sempre tem Diretoria** — gerar áreas e verificar `diretoria_id` não-nulo
    - **Property 2: Caminho transitivo de Especialidade** — verificar `area_id` e `diretoria_id` corretos na view
    - **Validates: Requirements 1.2, 1.3**

  - [x] 6.3 Implementar property tests para regras de senioridade (Properties 3, 4, 5)
    - **Property 3: C-level não pode ter alocações**
    - **Property 4: Scope válido por grupo de senioridade**
    - **Property 5: IC tem exatamente 1 alocação**
    - **Validates: Requirements 2.1–2.11**

  - [x] 6.4 Implementar property tests para inferência de caminho (Properties 6, 10, 11)
    - **Property 6: Inferência de caminho para IC via view**
    - **Property 10: Estrutura do caminho hierárquico por senioridade**
    - **Property 11: Gestor imediato pertence ao nível superior correto**
    - **Validates: Requirements 2.12, 4.1–4.5, 5.2**

  - [x] 6.5 Implementar property tests para subordinados (Properties 7, 8, 9)
    - **Property 7: Subordinados de C-level são todos os colaboradores**
    - **Property 8: Subordinados corretos por nível de gestão**
    - **Property 9: IC não tem subordinados**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [x] 6.6 Implementar property tests para view e cascata (Properties 12, 13)
    - **Property 12: View expande corretamente por scope**
    - **Property 13: Cascata hierárquica preserva consistência**
    - **Validates: Requirements 5.1–5.4, 6.4–6.6**

  - [x] 6.7 Implementar property tests de round-trip (Properties 14, 15)
    - **Property 14: Round-trip de serialização de ColaboradorComAlocacoes**
    - **Property 15: Round-trip de caminho hierárquico para IDs**
    - **Validates: Requirements 7.2, 7.3, 7.4**

  - [x] 6.8 Implementar testes unitários para casos de borda
    - Testar id inexistente em `get_subordinados` (deve lançar exceção)
    - Testar id inexistente em `get_caminho_colaborador` (deve retornar vazio)
    - Testar alocação duplicada (deve ser rejeitada por UNIQUE constraint)
    - Testar scope nulo e constraints `chk_scope_*`
    - _Requirements: 3.6, 4.6, 6.1–6.3, 6.7–6.9_

- [x] 7. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- O trigger `validate_alocacao` é a principal mudança de comportamento: Staf I/II aceitam `area`/`diretoria`, não `especialidade`
- A migração SQL deve verificar dados existentes antes de aplicar `NOT NULL` em `areas.diretoria_id`
- Property tests usam fast-check com mínimo 100 iterações por propriedade
