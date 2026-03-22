# Plano de Implementação: Histórico de Alterações do Colaborador

## Overview

Implementação incremental do rastreamento de alterações nos campos críticos de colaboradores. O fluxo parte da migration do banco, passa pelo serviço de histórico, interceptação no `colaboradorService.update()` e termina com o componente de exibição integrado ao `ColaboradorDetailPanel` e `ColaboradorDetail`.

## Tasks

- [x] 1. Criar migration da tabela `historico_alteracoes`
  - Criar arquivo `supabase/migrations/20260319000000_historico_alteracoes.sql`
  - Definir tabela com campos: `id` (uuid PK), `colaborador_id` (FK → colaboradores.id ON DELETE CASCADE), `campo` (text NOT NULL), `valor_anterior` (text), `novo_valor` (text), `alterado_em` (timestamptz NOT NULL DEFAULT now()), `autor_alteracao` (text)
  - Criar índice em `colaborador_id` e índice em `alterado_em`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Definir tipos TypeScript para o histórico
  - Criar arquivo `src/types/historico.ts`
  - Exportar `CampoRastreavel`, `CAMPOS_RASTREAVEIS`, `ROTULOS_CAMPOS` e interface `EventoAlteracao`
  - _Requirements: 2.1, 4.6_

  - [ ]* 2.1 Escrever property test para mapeamento de rótulos (Property 5)
    - **Property 5: Mapeamento de campo para rótulo legível**
    - **Validates: Requirements 4.6**
    - Para todo `CampoRastreavel`, `ROTULOS_CAMPOS[campo]` deve retornar string não-vazia diferente do nome técnico
    - `// Feature: historico-alteracoes-colaborador, Property 5: Mapeamento de campo para rótulo legível`

- [x] 3. Implementar `historicoService` com `diffCamposRastreaveis`
  - Criar arquivo `src/services/historicoService.ts`
  - Implementar função pura `diffCamposRastreaveis(anterior, patch)` que compara campos rastreáveis e retorna eventos a registrar, omitindo campos sem mudança
  - Implementar `historicoService.registrar(eventos)` que faz INSERT em `historico_alteracoes` via Supabase
  - Implementar `historicoService.getByColaborador(colaboradorId)` que retorna eventos ordenados por `alterado_em` DESC
  - Serializar `torre_ids` e `squad_ids` como `JSON.stringify` ao comparar e armazenar
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.4, 5.3, 5.4_

  - [ ]* 3.1 Escrever property test para `diffCamposRastreaveis` — omissão quando valor não muda (Property 2)
    - **Property 2: Omissão de registro quando valor não muda**
    - **Validates: Requirements 1.6**
    - Para qualquer patch onde todos os campos rastreáveis têm o mesmo valor atual, `diffCamposRastreaveis` deve retornar array vazio
    - `// Feature: historico-alteracoes-colaborador, Property 2: Omissão de registro quando valor não muda`

  - [ ]* 3.2 Escrever property test para serialização JSON round-trip (Property 7)
    - **Property 7: Serialização JSON de arrays é round-trip**
    - **Validates: Requirements 5.3**
    - Para qualquer array de strings (incluindo vazio), `JSON.parse(JSON.stringify(arr))` deve produzir array equivalente
    - `// Feature: historico-alteracoes-colaborador, Property 7: Serialização JSON de arrays é round-trip`

  - [ ]* 3.3 Escrever unit tests para `historicoService`
    - Testar que `getByColaborador` é função exportada (Req 3.4)
    - Testar que `alterado_em` não é enviado pelo cliente — campo ausente no payload de INSERT (Req 5.4)
    - _Requirements: 3.4, 5.4_

- [x] 4. Estender `colaboradorService.update()` com interceptação de histórico
  - Modificar `src/services/colaboradorService.ts`
  - Antes do UPDATE: chamar `getById(id)` para capturar estado anterior
  - Calcular diff com `diffCamposRastreaveis(anterior, patch)`
  - Se houver eventos, chamar `historicoService.registrar(eventos)` — se falhar, propagar erro e não executar UPDATE
  - Executar UPDATE do colaborador somente após registro bem-sucedido do histórico
  - Usar `autor_alteracao: "sistema"` em todos os eventos
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2_

  - [ ]* 4.1 Escrever property test para registro correto de campos rastreáveis alterados (Property 1)
    - **Property 1: Registro de alteração em campo rastreável**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7**
    - Para qualquer subconjunto não-vazio de campos rastreáveis com valores diferentes, após `update()` deve existir exatamente um `EventoAlteracao` por campo com `valor_anterior`, `novo_valor` e `autor_alteracao = "sistema"` corretos
    - `// Feature: historico-alteracoes-colaborador, Property 1: Registro de alteração em campo rastreável`

  - [ ]* 4.2 Escrever property test para consistência update + histórico (Property 8)
    - **Property 8: Consistência update + histórico**
    - **Validates: Requirements 5.1**
    - Para qualquer update bem-sucedido de campo rastreável, o estado atual do colaborador deve ser consistente com o `novo_valor` do último `EventoAlteracao` registrado para aquele campo
    - `// Feature: historico-alteracoes-colaborador, Property 8: Consistência update + histórico`

  - [ ]* 4.3 Escrever unit tests para interceptação no `colaboradorService`
    - Testar que falha no `historicoService.registrar` impede o UPDATE do colaborador (Req 5.2)
    - _Requirements: 5.2_

- [x] 5. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 6. Criar componente `HistoricoAlteracoes`
  - Criar arquivo `src/components/colaboradores/HistoricoAlteracoes.tsx`
  - Receber props: `colaboradorId`, `torres`, `squads`, `diretorias`, `businessUnits`
  - Usar `useQuery` para buscar eventos via `historicoService.getByColaborador`
  - Exibir skeleton enquanto carrega (Req 4.4)
  - Exibir "Nenhuma alteração registrada ainda." quando lista vazia (Req 3.3)
  - Exibir "Não foi possível carregar o histórico." em caso de erro, sem bloquear o restante do painel (Req 4.5)
  - Para cada evento: exibir rótulo legível do campo (`ROTULOS_CAMPOS`), valor anterior, novo valor e data/hora em pt-BR (ex: "14/03/2026 às 15:30") (Req 4.2)
  - Exibir autor quando diferente de `"sistema"` (Req 4.3)
  - Implementar `resolverValorCampo` internamente: para `torre_ids`/`squad_ids` fazer parse JSON e resolver IDs para nomes separados por vírgula; para `diretoria_id`/`bu_id` resolver ID para nome (Req 4.7, 4.8)
  - _Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 6.1 Escrever property test para formatação de evento (Property 4)
    - **Property 4: Formatação de evento exibe todos os metadados**
    - **Validates: Requirements 4.2**
    - Para qualquer `EventoAlteracao`, a renderização deve exibir rótulo legível, valor anterior, novo valor e data/hora formatada em pt-BR
    - `// Feature: historico-alteracoes-colaborador, Property 4: Formatação de evento exibe todos os metadados`

  - [ ]* 6.2 Escrever property test para resolução de IDs para nomes (Property 6)
    - **Property 6: Resolução de IDs para nomes**
    - **Validates: Requirements 4.7, 4.8**
    - Para qualquer `EventoAlteracao` com campo `torre_ids`, `squad_ids`, `diretoria_id` ou `bu_id`, `resolverValorCampo` deve retornar nomes, nunca IDs brutos quando dados de referência disponíveis
    - `// Feature: historico-alteracoes-colaborador, Property 6: Resolução de IDs para nomes`

  - [ ]* 6.3 Escrever unit tests para `HistoricoAlteracoes`
    - Testar que seção "Histórico de Alterações" é renderizada no painel (Req 4.1)
    - Testar que autor diferente de "sistema" é exibido (Req 4.3)
    - Testar que erro na busca exibe mensagem de fallback sem bloquear painel (Req 4.5)
    - _Requirements: 4.1, 4.3, 4.5_

- [x] 7. Integrar `HistoricoAlteracoes` no `ColaboradorDetailPanel` e `ColaboradorDetail`
  - Modificar `src/components/colaboradores/ColaboradorDetailPanel.tsx`: adicionar seção "Histórico de Alterações" após a seção de contratos, passando `colaboradorId` e as listas de referência já disponíveis nas props
  - Modificar `src/pages/ColaboradorDetail.tsx`: adicionar o componente `HistoricoAlteracoes` após a seção de contratos, usando os dados já carregados pela página
  - _Requirements: 4.1_

  - [ ]* 7.1 Escrever property test para consulta retorna eventos ordenados (Property 3)
    - **Property 3: Consulta retorna eventos ordenados com todos os campos**
    - **Validates: Requirements 3.1, 3.2**
    - Para qualquer colaborador com N eventos, `getByColaborador` deve retornar exatamente N eventos com todos os campos obrigatórios, ordenados por `alterado_em` decrescente
    - `// Feature: historico-alteracoes-colaborador, Property 3: Consulta retorna eventos ordenados com todos os campos`

- [x] 8. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- Os property tests usam `fast-check` com mínimo de 100 iterações por propriedade
- `alterado_em` é sempre gerado pelo PostgreSQL (`DEFAULT now()`), nunca pelo cliente
- Não há retroativo: apenas alterações a partir da implantação são registradas
