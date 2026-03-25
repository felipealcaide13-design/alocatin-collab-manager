# Implementation Plan

- [x] 1. Escrever teste de exploração do bug condition (ANTES da correção)
  - **Property 1: Bug Condition** - Cache não invalidado após save de configuração
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido — a falha confirma que o bug existe
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Este teste codifica o comportamento esperado — ele validará a correção quando passar após a implementação
  - **GOAL**: Demonstrar que `handleSaveTorre` e `handleSaveBU` não chamam `invalidateQueries` após save bem-sucedido
  - **Scoped PBT Approach**: Escopo determinístico — mockar `queryClient` e `configuracaoTorreService.upsert`, renderizar `BUTorreConfigTab`, acionar save e verificar que `invalidateQueries` NÃO é chamado (código original)
  - Criar `src/test/bu-config-refresh-bug-condition.test.tsx`
  - Caso 1 — Torre Save sem invalidação: renderizar com BU selecionada, acionar handleSaveTorre → verificar que `queryClient.invalidateQueries` não é chamado
  - Caso 2 — BU Save sem invalidação: acionar handleSaveBU → verificar que `queryClient.invalidateQueries` não é chamado
  - Executar no código NÃO corrigido
  - **EXPECTED OUTCOME**: Testes FALHAM (isso é correto — prova que o bug existe)
  - Documentar os counterexamples encontrados (ex.: `invalidateQueries` nunca chamado após saves bem-sucedidos)
  - Marcar tarefa como completa quando os testes estiverem escritos, executados e a falha documentada
  - _Requirements: 1.1, 1.2_

- [x] 2. Escrever testes de preservação (ANTES da correção)
  - **Property 2: Preservation** - Comportamento inalterado para saves com erro e edições locais
  - **IMPORTANT**: Seguir metodologia observation-first
  - Criar `src/test/bu-config-refresh-preservation.test.tsx`
  - Observar no código NÃO corrigido: save com erro → `invalidateQueries` não é chamado, toast de erro é exibido
  - Observar no código NÃO corrigido: edição local de switch sem save → `invalidateQueries` não é chamado
  - Observar no código NÃO corrigido: save de Torre → queries de BU não são afetadas
  - Caso 1 — Erro no save de Torre: mockar upsert para lançar erro → verificar que `invalidateQueries` NÃO é chamado e toast de erro é exibido
  - Caso 2 — Erro no save de BU: idem para BU
  - Caso 3 — Edição local sem save: alterar `torreConfig` via switch → verificar que `invalidateQueries` não é chamado
  - Caso 4 — Isolamento Torre/BU: save de Torre → verificar que apenas `["configuracao_torre", buId]` seria invalidado, não `["configuracao_bu"]`
  - Executar no código NÃO corrigido
  - **EXPECTED OUTCOME**: Testes PASSAM (confirma o baseline a preservar)
  - Marcar tarefa como completa quando os testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.4_

- [x] 3. Corrigir invalidação de cache após save de configuração

  - [x] 3.1 Adicionar `useQueryClient` e invalidações em `BUTorreConfigTab`
    - Importar `useQueryClient` de `@tanstack/react-query` em `src/components/business-units/BUTorreConfigTab.tsx`
    - Instanciar `const queryClient = useQueryClient()` no corpo do componente
    - Em `handleSaveTorre`: após `await configuracaoTorreService.upsert(torreConfig)` com sucesso, chamar `queryClient.invalidateQueries({ queryKey: ["configuracao_torre", torreConfig.bu_id] })`
    - Em `handleSaveBU`: após `await configuracaoBUService.upsert(buConfig)` com sucesso, chamar `queryClient.invalidateQueries({ queryKey: ["configuracao_bu"] })`
    - Não modificar os blocos `catch` — comportamento de erro deve permanecer idêntico
    - _Bug_Condition: isBugCondition(event) onde saveResult.success = true AND queryClient NÃO invalidou queries_
    - _Expected_Behavior: após save bem-sucedido, `invalidateQueries` é chamado com a queryKey correta_
    - _Preservation: saves com erro continuam exibindo toast sem chamar invalidateQueries; saves de Torre não afetam cache de BU e vice-versa_
    - _Requirements: 2.1, 2.2, 3.1, 3.4_

  - [x] 3.2 Migrar busca de configuração em `TorreForm` para `useQuery`
    - Em `src/components/torres/TorreForm.tsx`, substituir o `useEffect` que chama `configuracaoTorreService.getByBuId(watchedBuId)` por `useQuery` com `queryKey: ["configuracao_torre", watchedBuId]` e `enabled: !!watchedBuId && watchedBuId !== "none"`
    - Remover o estado `configLoading` e `buConfig` gerenciados manualmente — usar `data` e `isLoading` do `useQuery`
    - Garantir que quando o cache for invalidado, o formulário recarregue automaticamente na próxima abertura
    - _Requirements: 2.1, 2.3_

  - [x] 3.3 Migrar busca de configuração em `BusinessUnitForm` para `useQuery`
    - Em `src/components/business-units/BusinessUnitForm.tsx`, substituir o `useEffect + loadedRef` que chama `configuracaoBUService.get()` por `useQuery` com `queryKey: ["configuracao_bu"]` e `enabled: open`
    - Remover `loadedRef`, `configLoaded` e o `useEffect` de carregamento manual
    - Garantir que quando o cache for invalidado, o formulário recarregue automaticamente na próxima abertura
    - _Requirements: 2.2, 2.3_

  - [x] 3.4 Verificar que o teste de bug condition agora passa
    - **Property 1: Expected Behavior** - Cache invalidado após save bem-sucedido
    - **IMPORTANT**: Re-executar o MESMO teste da tarefa 1 — NÃO escrever novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - **EXPECTED OUTCOME**: Testes PASSAM (confirma que o bug foi corrigido)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Verificar que os testes de preservação continuam passando
    - **Property 2: Preservation** - Comportamento inalterado para saves com erro e edições locais
    - **IMPORTANT**: Re-executar os MESMOS testes da tarefa 2 — NÃO escrever novos testes
    - **EXPECTED OUTCOME**: Testes PASSAM (confirma ausência de regressões)
    - Confirmar que todos os testes passam após a correção
    - _Requirements: 3.1, 3.4_

- [x] 4. Checkpoint — Garantir que todos os testes passam
  - Executar toda a suíte de testes e confirmar que não há falhas
  - Verificar manualmente o fluxo: salvar configuração de Torre → abrir TorreForm para a mesma BU → confirmar que os campos refletem a configuração recém-salva
  - Verificar manualmente o fluxo: salvar configuração de BU → abrir BusinessUnitForm → confirmar que os campos refletem a configuração recém-salva
  - Perguntar ao usuário se houver dúvidas
