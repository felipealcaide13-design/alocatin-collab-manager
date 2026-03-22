# Plano de Implementação: Histórico de BUs, Torres e Squads

## Overview

Implementação incremental do rastreamento de eventos em Business Units, Torres e Squads. O fluxo parte da migration do banco, passa pelos tipos TypeScript e pelo novo `historicoBUService`, depois instrumenta os serviços existentes (`businessUnitService`, `torreService`, `configuracaoTorreService`, `configuracaoBUService`) e termina com o componente `BUHistoricoTab` integrado à página `BusinessUnits`.

## Tasks

- [ ] 1. Criar migration da tabela `historico_bu_torre_squad`
  - Criar arquivo `supabase/migrations/20260323000000_historico_bu_torre_squad.sql`
  - Definir tabela com campos: `id` (uuid PK DEFAULT gen_random_uuid()), `tipo_evento` (text NOT NULL), `entidade_tipo` (text NOT NULL CHECK IN ('bu','torre','squad')), `entidade_id` (uuid NOT NULL), `entidade_pai_id` (uuid nullable), `snapshot_dados` (jsonb NOT NULL), `ocorrido_em` (timestamptz NOT NULL DEFAULT now()), `autor_alteracao` (text nullable)
  - Criar 4 índices: `entidade_id`, `ocorrido_em`, `entidade_tipo`, composto (`entidade_tipo`, `ocorrido_em`)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.3_

- [ ] 2. Definir tipos TypeScript para o histórico
  - Criar arquivo `src/types/historicoBU.ts`
  - Exportar: `TipoEventoBU`, `EntidadeTipo`, `EventoBUTorreSquad`, `SnapshotLideranca`, `SnapshotCampoLideranca`, `OrganigramaSnapshot`, `OrganigramaBU`, `OrganigramaTorre`, `OrganigramaSquad`
  - _Requirements: 6.1, 7.1_

- [ ] 3. Atualizar tipos Supabase
  - Modificar `src/integrations/supabase/types.ts`
  - Adicionar tabela `historico_bu_torre_squad` com Row, Insert e Update tipados, refletindo todos os campos da migration
  - _Requirements: 6.1_

- [ ] 4. Implementar `historicoBUService` com funções puras de diff
  - Criar arquivo `src/services/historicoBUService.ts`
  - Implementar função pura exportada `diffLiderancas(entidadeId, entidadeTipo, anterior, novo)` que compara dois `LiderancaMap` e retorna array de eventos (`lideranca_atribuida`, `lideranca_alterada`, `lideranca_removida`)
  - Implementar função pura exportada `diffCamposLideranca(entidadeId, entidadeTipo, anterior, novo)` que compara listas de `CampoLiderancaConfig` por `id` e retorna eventos (`campo_lideranca_criado`, `campo_lideranca_alterado`, `campo_lideranca_removido`)
  - Implementar `historicoBUService.registrarEvento(evento)` que faz INSERT em `historico_bu_torre_squad` sem enviar `ocorrido_em` (gerado pelo banco)
  - Implementar `historicoBUService.getEventosByPeriodo(dataInicio, dataFim)` com filtro de datas e ordem decrescente por `ocorrido_em`
  - Implementar `historicoBUService.getEventosByEntidade(entidadeId)` com filtro por `entidade_id` e ordem decrescente
  - Implementar `historicoBUService.getOrganigramaSnapshot(dataReferencia)` que processa todos os eventos em ordem cronológica até a data e reconstrói o organograma
  - _Requirements: 5.6, 4.4, 7.1, 7.2, 7.3, 7.4, 7.5, 9.3_

  - [ ]* 4.1 Escrever property test para `diffLiderancas` — evento correto por cargo modificado (Property 5)
    - **Property 5: Diff de lideranças gera evento correto por cargo modificado**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
    - Para qualquer par de `LiderancaMap` anterior/novo, `diffLiderancas` deve retornar exatamente um evento por cargo cujo colaborador mudou, com `tipo_evento` correto e `snapshot_dados` contendo cargo e IDs corretos
    - `// Feature: historico-bu-torre-squad, Property 5: Diff de lideranças gera evento correto por cargo modificado`

  - [ ]* 4.2 Escrever property test para `diffCamposLideranca` — K eventos para K mudanças (Property 4)
    - **Property 4: Diff de campos de liderança gera exatamente um evento por campo modificado**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Para qualquer par de listas de campos com K diferenças, `diffCamposLideranca` deve retornar exatamente K eventos com `tipo_evento` correto
    - `// Feature: historico-bu-torre-squad, Property 4: Diff de campos de liderança gera exatamente um evento por campo modificado`

  - [ ]* 4.3 Escrever property test para `getEventosByPeriodo` — apenas eventos no intervalo (Property 6)
    - **Property 6: getEventosByPeriodo retorna apenas eventos dentro do intervalo**
    - **Validates: Requirements 7.3**
    - Para qualquer conjunto de eventos e intervalo `[dataInicio, dataFim]`, a função deve retornar exatamente os eventos cujo `ocorrido_em` está dentro do intervalo, ordenados por `ocorrido_em` decrescente
    - `// Feature: historico-bu-torre-squad, Property 6: getEventosByPeriodo retorna apenas eventos dentro do intervalo`

  - [ ]* 4.4 Escrever property test para `getEventosByEntidade` — apenas eventos da entidade (Property 7)
    - **Property 7: getEventosByEntidade retorna apenas eventos da entidade solicitada**
    - **Validates: Requirements 7.4**
    - Para qualquer conjunto de eventos de múltiplas entidades e qualquer `entidadeId`, a função deve retornar exatamente os eventos cujo `entidade_id` é igual ao solicitado, ordenados por `ocorrido_em` decrescente
    - `// Feature: historico-bu-torre-squad, Property 7: getEventosByEntidade retorna apenas eventos da entidade solicitada`

  - [ ]* 4.5 Escrever unit tests para `historicoBUService`
    - Testar que `ocorrido_em` não é enviado pelo cliente no payload de INSERT (Req 9.3)
    - Testar que `getOrganigramaSnapshot` retorna snapshot vazio quando não há eventos até a `dataReferencia` (Req 7.5)
    - _Requirements: 9.3, 7.5_

- [ ] 5. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [ ] 6. Instrumentar `businessUnitService`
  - Modificar `src/services/businessUnitService.ts`
  - `create`: após INSERT bem-sucedido, chamar `historicoBUService.registrarEvento({ tipo_evento: "bu_criada", entidade_tipo: "bu", entidade_id: data.id, entidade_pai_id: null, snapshot_dados: { nome, descricao, liderancas }, autor_alteracao: "sistema" })`
  - `update`: antes do UPDATE, chamar `getById(id)` para capturar estado anterior; após UPDATE, chamar `registrarEvento("bu_alterada")` com `snapshot_dados: { antes: {...}, depois: {...} }`; se `liderancas` mudou, chamar `diffLiderancas` e registrar um evento por cargo modificado
  - `remove`: chamar `getById(id)` para capturar snapshot completo; chamar `registrarEvento("bu_deletada")` com snapshot; somente então executar DELETE
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 9.1, 9.2, 9.4, 9.5_

  - [ ]* 6.1 Escrever property test para criação de BU registra evento correto (Property 1 — BU)
    - **Property 1: Criação de entidade registra evento correto**
    - **Validates: Requirements 1.1, 6.6**
    - Para qualquer BU criada, deve existir exatamente um evento `bu_criada` com `entidade_id` correto, `entidade_tipo = "bu"`, `snapshot_dados` contendo `nome` e `descricao`, e `autor_alteracao = "sistema"`
    - `// Feature: historico-bu-torre-squad, Property 1: Criação de entidade registra evento correto`

  - [ ]* 6.2 Escrever property test para update de BU registra diff correto (Property 2 — BU)
    - **Property 2: Update de entidade registra evento com diff antes/depois**
    - **Validates: Requirements 1.2**
    - Para qualquer patch de BU com campos alterados, o evento `bu_alterada` deve ter `snapshot_dados.antes` com valores anteriores e `snapshot_dados.depois` com novos valores
    - `// Feature: historico-bu-torre-squad, Property 2: Update de entidade registra evento com diff antes/depois`

  - [ ]* 6.3 Escrever property test para deleção de BU registra snapshot antes do DELETE (Property 3 — BU)
    - **Property 3: Deleção registra evento com snapshot completo antes do DELETE**
    - **Validates: Requirements 1.3, 9.4, 9.5**
    - Para qualquer BU deletada, o evento `bu_deletada` deve ser gravado antes do DELETE e `snapshot_dados` deve conter o estado completo da BU
    - `// Feature: historico-bu-torre-squad, Property 3: Deleção registra evento com snapshot completo antes do DELETE`

- [ ] 7. Instrumentar `torreService`
  - Modificar `src/services/torreService.ts`
  - `createTorre`: após INSERT, registrar `torre_criada` com `entidade_pai_id = bu_id` e `snapshot_dados: { nome, descricao, bu_id, liderancas }`
  - `updateTorre`: buscar estado anterior via `getTorreById`, executar UPDATE, registrar `torre_alterada` com diff antes/depois; se `liderancas` mudou, chamar `diffLiderancas` e registrar eventos por cargo
  - `removeTorre`: buscar estado anterior, registrar `torre_deletada` com snapshot completo, executar DELETE
  - `createSquad`: após INSERT, registrar `squad_criado` com `entidade_pai_id = torre_id` e `snapshot_dados: { nome, descricao, torre_id, contrato_id, lider, membros }`
  - `updateSquad`: buscar estado anterior via SELECT por id, executar UPDATE, registrar `squad_alterado` com diff antes/depois; se campo `lider` mudou, chamar `diffLiderancas` com mapa `{ lider: anterior }` vs `{ lider: novo }` e registrar evento de liderança
  - `removeSquad`: buscar estado anterior, registrar `squad_deletado` com snapshot completo, executar DELETE
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 5.4, 5.5, 9.1, 9.2, 9.4, 9.5_

  - [ ]* 7.1 Escrever property test para criação de Torre e Squad registra evento correto (Property 1 — Torre/Squad)
    - **Property 1: Criação de entidade registra evento correto**
    - **Validates: Requirements 2.1, 3.1, 6.6**
    - Para qualquer Torre ou Squad criado, deve existir exatamente um evento com `tipo_evento` correto, `entidade_pai_id` correto e `snapshot_dados` contendo os campos da entidade
    - `// Feature: historico-bu-torre-squad, Property 1: Criação de entidade registra evento correto`

  - [ ]* 7.2 Escrever property test para deleção de Torre e Squad registra snapshot antes do DELETE (Property 3 — Torre/Squad)
    - **Property 3: Deleção registra evento com snapshot completo antes do DELETE**
    - **Validates: Requirements 2.3, 3.3, 9.4, 9.5**
    - Para qualquer Torre ou Squad deletado, o evento de deleção deve ser gravado antes do DELETE e `snapshot_dados` deve conter o estado completo
    - `// Feature: historico-bu-torre-squad, Property 3: Deleção registra evento com snapshot completo antes do DELETE`

- [ ] 8. Instrumentar `configuracaoTorreService` e `configuracaoBUService`
  - Modificar `src/services/configuracaoTorreService.ts`: no método `upsert`, buscar config anterior via `getByBuId` antes do upsert; após upsert, chamar `diffCamposLideranca(buId, "torre", anterior?.campos_lideranca ?? [], novo.campos_lideranca)` e registrar cada evento retornado com `entidade_id = buId`
  - Modificar `src/services/configuracaoBUService.ts`: no método `upsert`, buscar config anterior via `get` antes do upsert; após upsert, chamar `diffCamposLideranca("global", "bu", anterior.campos_lideranca, novo.campos_lideranca)` e registrar cada evento retornado
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 8.1 Escrever unit tests para instrumentação dos serviços de configuração
    - Testar que falha no `registrarEvento` antes do delete impede o DELETE (Req 9.2, 9.5)
    - Testar que `diffCamposLideranca` é chamado com as listas anterior e nova corretas
    - _Requirements: 9.2, 9.5, 4.4_

- [ ] 9. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [ ] 10. Criar componente `BUHistoricoTab`
  - Criar arquivo `src/components/business-units/BUHistoricoTab.tsx`
  - Estado interno: `filtroTipo: "todos" | "bu" | "torre" | "squad"`, `dataInicio: Date | null`, `dataFim: Date | null` (padrão: últimos 90 dias)
  - Usar `useQuery` com `historicoBUService.getEventosByPeriodo` para buscar eventos
  - Aplicar filtro de `filtroTipo` no cliente sobre os eventos retornados
  - Agrupar eventos por dia (chave: `ocorrido_em.toDateString()`), renderizar grupos em ordem decrescente
  - Para cada evento: exibir tipo em linguagem natural (ex: "BU criada", "Torre alterada", "Liderança atribuída"), badge colorido por `entidade_tipo` (bu=azul, torre=verde, squad=laranja), horário formatado em pt-BR (ex: "14/03/2026 às 15:30"), dados relevantes do `snapshot_dados`
  - Exibir autor quando `autor_alteracao` for diferente de `"sistema"`
  - Exibir skeleton durante carregamento (Req 8.7)
  - Exibir "Nenhum evento registrado ainda." quando lista vazia (Req 8.8)
  - Exibir "Não foi possível carregar o histórico." em caso de erro sem bloquear demais abas (Req 8.9)
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ]* 10.1 Escrever property test para agrupamento por data preserva todos os eventos em ordem (Property 8)
    - **Property 8: Agrupamento por data preserva todos os eventos em ordem decrescente**
    - **Validates: Requirements 8.2**
    - Para qualquer lista de eventos com datas variadas, o agrupamento por dia deve preservar todos os eventos sem perda, com grupos e eventos dentro de cada grupo em ordem decrescente
    - `// Feature: historico-bu-torre-squad, Property 8: Agrupamento por data preserva todos os eventos em ordem decrescente`

  - [ ]* 10.2 Escrever property test para filtros combinados retornam subconjunto correto (Property 9)
    - **Property 9: Filtros de tipo e data retornam subconjunto correto**
    - **Validates: Requirements 8.5, 8.6**
    - Para qualquer lista de eventos e qualquer combinação de `filtroTipo` e intervalo de datas, os eventos exibidos devem ser exatamente o subconjunto que satisfaz ambos os critérios simultaneamente
    - `// Feature: historico-bu-torre-squad, Property 9: Filtros combinados retornam subconjunto correto`

  - [ ]* 10.3 Escrever property test para renderização exibe todos os metadados do evento (Property 10)
    - **Property 10: Renderização de evento exibe todos os metadados esperados**
    - **Validates: Requirements 8.3, 8.4, 8.10**
    - Para qualquer `EventoBUTorreSquad`, a renderização deve exibir tipo em linguagem natural, badge colorido por `entidade_tipo`, horário formatado em pt-BR e dados do `snapshot_dados`; quando `autor_alteracao` diferente de `"sistema"`, o nome deve ser exibido
    - `// Feature: historico-bu-torre-squad, Property 10: Renderização de evento exibe todos os metadados esperados`

  - [ ]* 10.4 Escrever unit tests para `BUHistoricoTab`
    - Testar que estado vazio exibe "Nenhum evento registrado ainda." (Req 8.8)
    - Testar que estado de erro exibe "Não foi possível carregar o histórico." (Req 8.9)
    - _Requirements: 8.8, 8.9_

- [ ] 11. Integrar `BUHistoricoTab` na página `BusinessUnits`
  - Modificar `src/pages/BusinessUnits.tsx`
  - Adicionar import de `BUHistoricoTab`
  - Adicionar `TabsTrigger value="historico"` com ícone `History` na `TabsList`, ao lado das abas existentes
  - Adicionar `TabsContent value="historico"` com `<BUHistoricoTab />`
  - _Requirements: 8.1_

  - [ ]* 11.1 Escrever unit test para aba "Histórico" existe na página BusinessUnits
    - Testar que o `TabsTrigger` com texto "Histórico" é renderizado na página (Req 8.1)
    - _Requirements: 8.1_

- [ ] 12. Criar arquivo de testes `src/test/historico-bu-torre-squad.test.ts`
  - Criar arquivo consolidando todos os testes unitários e de propriedade das tasks anteriores
  - Usar `fast-check` com mínimo de 100 iterações por propriedade
  - Cada property test deve ter o comentário `// Feature: historico-bu-torre-squad, Property N: <texto>`
  - Cobrir as 10 propriedades definidas no design e os casos unitários listados na estratégia de testes
  - _Requirements: 1.1, 2.1, 3.1, 4.4, 5.6, 6.1, 7.3, 7.4, 7.5, 8.2, 8.5, 8.6, 8.8, 8.9, 9.3_

- [ ] 13. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- Os property tests usam `fast-check` com mínimo de 100 iterações por propriedade
- `ocorrido_em` é sempre gerado pelo PostgreSQL (`DEFAULT now()`), nunca pelo cliente
- Não há retroativo: apenas eventos a partir da implantação são registrados
- Falha no `registrarEvento` antes do DELETE impede o DELETE (consistência garantida); falha após INSERT/UPDATE propaga erro mas não reverte a operação principal
