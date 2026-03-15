# Plano de Implementação: Hierarquia Organizacional

## Visão Geral

Implementação incremental da hierarquia de 3 níveis (Diretoria → Área → Especialidade) no sistema Alocatin. As tarefas seguem a ordem: banco de dados → tipos → serviços → componentes → páginas → navegação.

## Tasks

- [x] 1. Migration SQL — criar tabelas e alterar tabelas existentes
  - Criar arquivo `supabase/migrations/YYYYMMDD_hierarquia_organizacional.sql`
  - Criar tabela `diretorias` com campos `id`, `nome`, `descricao`, `created_at`, `updated_at`
  - Criar tabela `especialidades` com campos `id`, `nome`, `area_id` (FK → areas), `descricao`, `created_at`, `updated_at`
  - Adicionar coluna `diretoria_id` (UUID nullable, FK → diretorias) na tabela `areas`
  - Adicionar coluna `especialidade_id` (UUID nullable, FK → especialidades) na tabela `colaboradores`
  - Criar índices: `idx_areas_diretoria_id`, `idx_especialidades_area_id`, `idx_colaboradores_esp_id`
  - Habilitar RLS e criar policies permissivas para as novas tabelas
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Tipos TypeScript e atualização do supabase/types.ts
  - [x] 2.1 Criar `src/types/diretoria.ts` com interfaces `Diretoria` e `DiretoriaInput`
    - _Requirements: 1.1_
  - [x] 2.2 Criar `src/types/especialidade.ts` com interfaces `Especialidade` e `EspecialidadeInput`
    - _Requirements: 3.1_
  - [x] 2.3 Atualizar `src/types/area.ts` adicionando campo `diretoria_id?: string | null`
    - _Requirements: 2.1_
  - [x] 2.4 Atualizar `src/types/colaborador.ts` adicionando campo `especialidade_id?: string | null`
    - _Requirements: 4.1_
  - [x] 2.5 Atualizar `src/integrations/supabase/types.ts` adicionando tipos gerados para `diretorias` e `especialidades`, e os novos campos nas tabelas existentes
    - _Requirements: 5.1_

- [x] 3. Implementar `diretoriaService`
  - [x] 3.1 Criar `src/services/diretoriaService.ts` com métodos `getAll`, `getById`, `create`, `update`, `remove`
    - `getAll` deve ordenar por `nome` (A→Z)
    - `remove` deve verificar áreas vinculadas antes de deletar e lançar erro descritivo se houver
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_
  - [ ]* 3.2 Escrever property test para `diretoriaService.getAll` — ordenação alfabética
    - **Property 4: Lista de Diretorias é retornada em ordem alfabética**
    - **Validates: Requirements 1.7**
  - [ ]* 3.3 Escrever property test para `diretoriaService.remove` — bloqueio com áreas vinculadas
    - **Property 3: Exclusão de Diretoria com Áreas vinculadas é bloqueada**
    - **Validates: Requirements 1.5**

- [x] 4. Implementar `especialidadeService`
  - [x] 4.1 Criar `src/services/especialidadeService.ts` com métodos `getAll`, `getByArea`, `create`, `update`, `remove`
    - `getByArea(areaId)` deve filtrar por `area_id` e ordenar por `nome`
    - `remove` deve verificar colaboradores vinculados antes de deletar e lançar erro descritivo se houver
    - _Requirements: 3.1, 3.2, 3.5, 3.7_
  - [ ]* 4.2 Escrever property test para `especialidadeService.getByArea` — isolamento por área
    - **Property 10: getByArea retorna apenas Especialidades da Área solicitada**
    - **Validates: Requirements 3.7, 4.2**
  - [ ]* 4.3 Escrever property test para `especialidadeService.remove` — bloqueio com colaboradores vinculados
    - **Property 9: Exclusão de Especialidade com Colaboradores vinculados é bloqueada**
    - **Validates: Requirements 3.4**

- [x] 5. Estender `areaService` e `colaboradorService`
  - [x] 5.1 Atualizar `src/services/areaService.ts`: adicionar método `getByDiretoria(diretoriaId)` e mapear `diretoria_id` no `getAll`
    - _Requirements: 2.3, 2.6_
  - [x] 5.2 Atualizar `src/services/colaboradorService.ts`: mapear `especialidade_id` em `fromDb` e `toDb`
    - _Requirements: 4.4_
  - [ ]* 5.3 Escrever property test para filtro de Áreas por Diretoria
    - **Property 7: Filtro de Áreas por Diretoria retorna apenas Áreas da Diretoria selecionada**
    - **Validates: Requirements 2.6**
  - [ ]* 5.4 Escrever property test para persistência de `especialidade_id` no Colaborador
    - **Property 12: Persistência de especialidade_id no Colaborador**
    - **Validates: Requirements 4.4**

- [x] 6. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 7. Componentes de Diretoria
  - [x] 7.1 Criar `src/components/diretorias/DiretoriaForm.tsx`
    - Formulário com campos `nome` (obrigatório, mín. 3 chars) e `descricao` (opcional)
    - Validação via `react-hook-form` + `zod`; exibir `<FormMessage />` inline
    - _Requirements: 1.2, 1.3, 1.4_
  - [ ]* 7.2 Escrever property test para validação do schema Zod de Diretoria
    - **Property 2: Nome vazio ou whitespace é rejeitado pelo schema**
    - **Validates: Requirements 1.3**
  - [x] 7.3 Criar `src/components/diretorias/DeleteConfirmDialog.tsx`
    - Reutilizar padrão dos dialogs existentes em `areas` e `colaboradores`
    - _Requirements: 1.5, 1.6_

- [x] 8. Componentes de Especialidade
  - [x] 8.1 Criar `src/components/especialidades/EspecialidadeForm.tsx`
    - Formulário com campos `nome` (obrigatório), `area_id` (select obrigatório) e `descricao` (opcional)
    - Validação via `react-hook-form` + `zod`
    - _Requirements: 3.2, 3.3_
  - [ ]* 8.2 Escrever property test para validação do schema Zod de Especialidade
    - **Property 2: Nome vazio ou whitespace é rejeitado pelo schema (Especialidade)**
    - **Validates: Requirements 3.3**
  - [x] 8.3 Criar `src/components/especialidades/DeleteConfirmDialog.tsx`
    - _Requirements: 3.4, 3.5_

- [x] 9. Atualizar `AreaForm` para incluir seleção de Diretoria
  - Modificar `src/components/areas/AreaForm.tsx`
  - Adicionar query para buscar todas as Diretorias via `diretoriaService.getAll()`
  - Adicionar campo `diretoria_id` (select obrigatório) ao schema Zod e ao formulário
  - Exibir mensagem de validação "Selecione uma Diretoria" quando não selecionado
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 10. Atualizar `ColaboradorForm` para seleção dinâmica de Especialidade
  - Modificar `src/components/colaboradores/ColaboradorForm.tsx`
  - Substituir o select de `subarea` (texto livre) por select de `especialidade_id` carregado via `especialidadeService.getByArea(areaId)`
  - Adicionar `useEffect` que reseta `especialidade_id` para `null` ao trocar o campo `area`
  - Exibir o select de Especialidade apenas quando uma Área estiver selecionada e houver especialidades disponíveis
  - _Requirements: 4.2, 4.3, 4.4_
  - [ ]* 10.1 Escrever unit test para reset de Especialidade ao trocar Área no formulário
    - **Property 11: Troca de Área no formulário de Colaborador limpa a Especialidade selecionada**
    - **Validates: Requirements 4.3**

- [x] 11. Criar `DiretoriaPage`
  - Criar `src/pages/Diretorias.tsx`
  - Listar Diretorias em tabela com colunas: Nome, Descrição, Qtd. de Áreas, Ações
  - Implementar busca por nome (case-insensitive, filtro client-side)
  - Implementar paginação (PAGE_SIZE = 10), seguindo padrão de `Areas.tsx`
  - Integrar `DiretoriaForm` e `DeleteConfirmDialog`
  - Exibir contagem de Áreas associadas a cada Diretoria (query separada ou join)
  - _Requirements: 1.7, 1.8, 6.1, 6.4_
  - [ ]* 11.1 Escrever property test para filtro de busca por nome na DiretoriaPage
    - **Property 5: Filtro de busca por nome é case-insensitive**
    - **Validates: Requirements 1.8**

- [x] 12. Estender `AreasPage` com Diretoria e Especialidades
  - Modificar `src/pages/Areas.tsx`
  - Adicionar coluna "Diretoria" na tabela, exibindo o nome da Diretoria associada (ou "—" se nula)
  - Adicionar coluna "Especialidades" exibindo a contagem de Especialidades por Área
  - Adicionar filtro por Diretoria na barra de filtros (select com todas as Diretorias + opção "Todas")
  - Integrar painel/modal de gerenciamento de Especialidades por Área (usando `EspecialidadeForm` e `DeleteConfirmDialog` de especialidades)
  - _Requirements: 2.5, 2.6, 3.6, 6.2, 6.5_
  - [ ]* 12.1 Escrever property test para contagem de Especialidades por Área
    - **Property 14: Contagem de filhos por entidade pai é consistente**
    - **Validates: Requirements 6.5**

- [x] 13. Estender `ColaboradoresPage` com Especialidade
  - Modificar `src/pages/Colaboradores.tsx`
  - Atualizar coluna "Subárea" para exibir o nome da Especialidade (via join ou lookup por `especialidade_id`); exibir "—" quando nulo
  - Adicionar filtro por Especialidade na barra de filtros
  - Atualizar o filtro de Área para usar as Áreas cadastradas no banco (em vez do array estático `AREAS`)
  - _Requirements: 4.5, 4.6, 4.7, 6.3_
  - [ ]* 13.1 Escrever property test para filtro de Colaboradores por Área
    - **Property 13: Filtro de Colaboradores por Área retorna apenas Colaboradores da Área selecionada**
    - **Validates: Requirements 4.6**

- [x] 14. Navegação — adicionar Diretorias ao menu e rota
  - Modificar `src/components/AppLayout.tsx`: adicionar item "Diretorias" com ícone adequado (ex: `Network` ou `GitBranch` do lucide-react) apontando para `/diretorias`
  - Modificar `src/App.tsx`: importar `Diretorias` e adicionar `<Route path="/diretorias" element={<Diretorias />} />`
  - _Requirements: 6.1_

- [x] 15. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Instalar `fast-check` antes de escrever os property tests: `npm install --save-dev fast-check`
- Cada task referencia os requisitos específicos para rastreabilidade
- A migration deve ser aplicada no Supabase antes de executar qualquer código que dependa das novas colunas/tabelas
- O campo `subarea` (texto livre) é mantido na tabela `colaboradores` por compatibilidade com dados existentes, mas a UI passa a usar `especialidade_id`
