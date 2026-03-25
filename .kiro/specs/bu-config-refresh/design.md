# bu-config-refresh Bugfix Design

## Overview

Após salvar uma configuração na `BUTorreConfigTab` (aba Torre ou aba BU), o sistema persiste os dados no Supabase mas não invalida as queries do React Query. Como resultado, `TorreForm` e `BusinessUnitForm` continuam lendo dados em cache desatualizados até o próximo reload manual da página.

A correção consiste em chamar `queryClient.invalidateQueries` com as query keys corretas dentro dos handlers `handleSaveTorre` e `handleSaveBU`, imediatamente após o `upsert` bem-sucedido. O componente `BUTorreConfigTab` precisará receber `queryClient` via hook `useQueryClient`.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug — um save bem-sucedido de configuração (Torre ou BU) sem invalidação subsequente do cache React Query
- **Property (P)**: O comportamento correto esperado — após save bem-sucedido, as queries de configuração devem ser invalidadas para que os formulários dependentes reflitam os dados recém-salvos
- **Preservation**: O comportamento existente que não deve ser alterado pela correção — saves com erro, edições locais sem save, troca de BU selecionada, e isolamento entre cache de Torre e BU
- **handleSaveTorre**: Função em `BUTorreConfigTab` que persiste a configuração de Torre via `configuracaoTorreService.upsert`
- **handleSaveBU**: Função em `BUTorreConfigTab` que persiste a configuração de BU via `configuracaoBUService.upsert`
- **queryKey configuracao_torre**: Chave React Query usada por `TorreForm` para buscar configuração de torre por BU — atualmente `TorreForm` chama `configuracaoTorreService.getByBuId` diretamente via `useEffect`, sem React Query; a correção deve garantir que o dado seja recarregado na próxima abertura do formulário
- **queryKey configuracao_bu**: Chave React Query usada por `BusinessUnitForm` para buscar configuração de BU — atualmente `BusinessUnitForm` também chama `configuracaoBUService.get` diretamente via `useEffect`; idem

## Bug Details

### Bug Condition

O bug se manifesta quando o usuário clica em "Salvar Configuração" em qualquer uma das abas da `BUTorreConfigTab` e o `upsert` retorna com sucesso. As funções `handleSaveTorre` e `handleSaveBU` não chamam `queryClient.invalidateQueries` após o save, portanto o cache React Query permanece com os dados anteriores.

**Formal Specification:**
```
FUNCTION isBugCondition(event)
  INPUT: event de tipo SaveEvent { tipo: "torre" | "bu", buId?: string }
  OUTPUT: boolean

  saveResult := await upsert(event)
  RETURN saveResult.success = true
         AND queryClient NÃO invalidou queries relacionadas a event.tipo
END FUNCTION
```

### Examples

- Usuário habilita campo "Descrição" na aba Torre para BU "Financeiro" e salva → abre formulário de Nova Torre com BU "Financeiro" → campo Descrição não aparece (cache antigo ainda tem `descricao_habilitada: false`)
- Usuário adiciona campo de liderança "Head de Dados" na aba BU e salva → abre formulário de Nova BU → campo "Head de Dados" não aparece (cache antigo não tem o campo)
- Usuário remove campo de liderança na aba Torre e salva → reabre formulário de Torre → campo removido ainda aparece

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Quando o save falha com erro, o sistema deve continuar exibindo o toast de erro sem modificar o estado local (`torreConfig` / `buConfig`)
- Quando o usuário altera campos na interface sem clicar em "Salvar", nenhuma invalidação de cache deve ocorrer
- Quando o usuário seleciona uma BU diferente no seletor da aba Torre, o carregamento da configuração específica daquela BU deve continuar funcionando normalmente
- O save de configuração de Torre não deve invalidar queries de configuração de BU, e vice-versa

**Scope:**
Todos os inputs que NÃO envolvem um save bem-sucedido de configuração devem ser completamente não afetados por esta correção. Isso inclui:
- Interações de UI sem save (toggle de switches, adição/remoção de campos localmente)
- Saves que resultam em erro
- Troca de BU selecionada no seletor

## Hypothesized Root Cause

Com base na análise do código:

1. **Ausência de `useQueryClient` em `BUTorreConfigTab`**: O componente não importa nem usa `useQueryClient` do React Query. Sem acesso ao `queryClient`, é impossível chamar `invalidateQueries`.

2. **`TorreForm` e `BusinessUnitForm` não usam React Query para buscar configuração**: Ambos os formulários chamam os services diretamente via `useEffect` com um `ref` de controle (`loadedRef`), sem passar por React Query. Isso significa que mesmo que o cache fosse invalidado, os formulários não recarregariam automaticamente — eles só buscam a configuração uma vez por abertura de dialog. A correção mais simples é garantir que o cache seja invalidado para que, na próxima abertura do dialog, os dados sejam frescos.

3. **Query keys não padronizadas**: `TorreForm` e `BusinessUnitForm` não registram suas buscas de configuração no React Query, então não há query key para invalidar diretamente. A solução é: (a) migrar as buscas de configuração nos formulários para `useQuery` com keys padronizadas, ou (b) manter o comportamento atual dos formulários (busca direta no open) e garantir que o cache do Supabase seja contornado via `invalidateQueries` nas keys que os formulários passarão a usar.

4. **Estratégia de correção mais simples**: Adicionar `useQueryClient` em `BUTorreConfigTab` e chamar `invalidateQueries` com as keys `["configuracao_torre", buId]` e `["configuracao_bu"]` após saves bem-sucedidos. Paralelamente, migrar as buscas de configuração em `TorreForm` e `BusinessUnitForm` para `useQuery` com essas mesmas keys, substituindo o padrão `useEffect + ref`.

## Correctness Properties

Property 1: Bug Condition - Invalidação de Cache Após Save de Configuração de Torre

_For any_ evento de save bem-sucedido de configuração de Torre (handleSaveTorre retorna sem erro), a função corrigida SHALL chamar `queryClient.invalidateQueries({ queryKey: ["configuracao_torre", buId] })`, garantindo que a próxima leitura da configuração daquela BU busque dados frescos do Supabase.

**Validates: Requirements 2.1, 2.3**

Property 2: Bug Condition - Invalidação de Cache Após Save de Configuração de BU

_For any_ evento de save bem-sucedido de configuração de BU (handleSaveBU retorna sem erro), a função corrigida SHALL chamar `queryClient.invalidateQueries({ queryKey: ["configuracao_bu"] })`, garantindo que a próxima leitura da configuração de BU busque dados frescos do Supabase.

**Validates: Requirements 2.2, 2.3**

Property 3: Preservation - Ausência de Invalidação em Saves com Erro

_For any_ evento de save que resulta em erro (upsert lança exceção), a função corrigida SHALL produzir o mesmo resultado que a função original — exibir toast de erro sem chamar `invalidateQueries` e sem alterar o estado local.

**Validates: Requirements 3.1**

Property 4: Preservation - Isolamento entre Cache de Torre e BU

_For any_ save bem-sucedido de configuração de Torre, a função corrigida SHALL invalidar apenas `["configuracao_torre", buId]` e NÃO invalidar `["configuracao_bu"]`; e vice-versa para save de BU.

**Validates: Requirements 3.4**

## Fix Implementation

### Changes Required

**Arquivo 1**: `src/components/business-units/BUTorreConfigTab.tsx`

**Mudanças**:
1. **Importar `useQueryClient`**: Adicionar `useQueryClient` ao import de `@tanstack/react-query`
2. **Instanciar queryClient**: Adicionar `const queryClient = useQueryClient()` no corpo do componente
3. **Invalidar cache em handleSaveTorre**: Após `await configuracaoTorreService.upsert(torreConfig)` com sucesso, chamar `queryClient.invalidateQueries({ queryKey: ["configuracao_torre", torreConfig.bu_id] })`
4. **Invalidar cache em handleSaveBU**: Após `await configuracaoBUService.upsert(buConfig)` com sucesso, chamar `queryClient.invalidateQueries({ queryKey: ["configuracao_bu"] })`

**Arquivo 2**: `src/components/torres/TorreForm.tsx`

**Mudanças**:
1. **Migrar busca de configuração para `useQuery`**: Substituir o `useEffect` que chama `configuracaoTorreService.getByBuId(watchedBuId)` por um `useQuery` com `queryKey: ["configuracao_torre", watchedBuId]` e `enabled: !!watchedBuId && watchedBuId !== "none"`. Isso garante que quando o cache for invalidado, o formulário automaticamente recarregue a configuração na próxima abertura.

**Arquivo 3**: `src/components/business-units/BusinessUnitForm.tsx`

**Mudanças**:
1. **Migrar busca de configuração para `useQuery`**: Substituir o `useEffect + loadedRef` que chama `configuracaoBUService.get()` por um `useQuery` com `queryKey: ["configuracao_bu"]` e `enabled: open`. Isso garante que quando o cache for invalidado, o formulário recarregue a configuração na próxima abertura.

## Testing Strategy

### Validation Approach

A estratégia segue duas fases: primeiro, confirmar o bug no código não corrigido (exploratory); depois, verificar que a correção funciona e não introduz regressões (fix checking + preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug ANTES da correção. Confirmar que `handleSaveTorre` e `handleSaveBU` não chamam `invalidateQueries`.

**Test Plan**: Mockar `queryClient` e `configuracaoTorreService.upsert` / `configuracaoBUService.upsert`, renderizar `BUTorreConfigTab`, acionar o save e verificar que `invalidateQueries` NÃO é chamado no código original.

**Test Cases**:
1. **Torre Save sem invalidação**: Renderizar com BU selecionada, acionar handleSaveTorre → verificar que `queryClient.invalidateQueries` não é chamado (demonstra o bug)
2. **BU Save sem invalidação**: Acionar handleSaveBU → verificar que `queryClient.invalidateQueries` não é chamado (demonstra o bug)
3. **TorreForm usa cache stale**: Salvar configuração de Torre, abrir TorreForm → verificar que os campos exibidos ainda refletem a configuração anterior

**Expected Counterexamples**:
- `queryClient.invalidateQueries` nunca é chamado após saves bem-sucedidos
- Causa confirmada: ausência de `useQueryClient` e chamadas de invalidação em `BUTorreConfigTab`

### Fix Checking

**Goal**: Verificar que para todos os saves bem-sucedidos onde a condição de bug se aplica, a função corrigida invalida o cache corretamente.

**Pseudocode:**
```
FOR ALL event WHERE isBugCondition(event) DO
  result := handleSave_fixed(event)
  ASSERT queryClient.invalidateQueries foi chamado com queryKey correta
  ASSERT toast de sucesso foi exibido
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos os inputs onde a condição de bug NÃO se aplica, o comportamento é idêntico ao original.

**Pseudocode:**
```
FOR ALL event WHERE NOT isBugCondition(event) DO
  ASSERT handleSave_original(event) = handleSave_fixed(event)
END FOR
```

**Testing Approach**: Testes de unidade com mocks são suficientes para preservation checking aqui, pois os caminhos de código são bem delimitados (erro no upsert, edição local sem save, troca de BU).

**Test Cases**:
1. **Erro no save de Torre**: Mockar upsert para lançar erro → verificar que `invalidateQueries` NÃO é chamado e toast de erro é exibido
2. **Erro no save de BU**: Idem para BU
3. **Edição local sem save**: Alterar `torreConfig` via switch → verificar que `invalidateQueries` não é chamado
4. **Isolamento Torre/BU**: Save de Torre → verificar que apenas `["configuracao_torre", buId]` é invalidado, não `["configuracao_bu"]`

### Unit Tests

- Testar `handleSaveTorre` com upsert bem-sucedido → `invalidateQueries` chamado com `["configuracao_torre", buId]`
- Testar `handleSaveBU` com upsert bem-sucedido → `invalidateQueries` chamado com `["configuracao_bu"]`
- Testar `handleSaveTorre` com upsert falhando → `invalidateQueries` não chamado, toast de erro exibido
- Testar `handleSaveBU` com upsert falhando → `invalidateQueries` não chamado, toast de erro exibido

### Property-Based Tests

- Gerar configurações aleatórias de Torre (variando `descricao_habilitada`, número de `campos_lideranca`) e verificar que após save bem-sucedido, `invalidateQueries` é sempre chamado com a key correta
- Gerar configurações aleatórias de BU e verificar o mesmo para `["configuracao_bu"]`
- Verificar que saves de Torre nunca invalidam `["configuracao_bu"]` e vice-versa, para qualquer configuração gerada

### Integration Tests

- Fluxo completo: salvar configuração de Torre com novo campo de liderança → abrir TorreForm para a mesma BU → verificar que o novo campo aparece
- Fluxo completo: salvar configuração de BU com `descricao_habilitada: true` → abrir BusinessUnitForm → verificar que campo Descrição aparece
- Verificar que troca de BU no seletor da aba Torre continua carregando a configuração correta após a correção
