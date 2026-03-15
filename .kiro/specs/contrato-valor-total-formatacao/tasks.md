# Implementation Plan

- [x] 1. Escrever teste de exploração do bug condition (ANTES da correção)
  - **Property 1: Bug Condition** - Campo Valor Total sem formatação de milhares
  - **CRITICAL**: Este teste DEVE FALHAR no código não corrigido — a falha confirma que o bug existe
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Este teste codifica o comportamento esperado — ele validará a correção quando passar após a implementação
  - **GOAL**: Expor contraexemplos que demonstrem que o bug existe
  - **Scoped PBT Approach**: Para o bug determinístico, escopar a propriedade aos casos concretos de falha para garantir reprodutibilidade
  - Renderizar `ContratoForm` com `initialData` contendo `valor_total = 1000000` e verificar que o valor exibido no input está formatado como `"1.000.000"` (isBugCondition: `valor_total IS NOT NULL AND valor_total > 0`)
  - Simular digitação de `"2500000"` e verificar que o valor exibido contém pontos separadores (`"2.500.000"`)
  - Verificar que o campo não aceita entrada de decimais (ex: `"2500000.50"` deve ser rejeitado)
  - Testar com `valor_total = 100000000` → deve exibir `"100.000.000"` (não `"100000000"`)
  - Rodar no código NÃO CORRIGIDO
  - **EXPECTED OUTCOME**: Teste FALHA (isso é correto — prova que o bug existe)
  - Documentar contraexemplos encontrados (ex: `"input exibe '1000000' sem separadores de milhares"`)
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Escrever testes de preservação (ANTES da correção)
  - **Property 2: Preservation** - Valor numérico no submit e comportamento dos demais campos
  - **IMPORTANT**: Seguir metodologia observation-first
  - Observar: submit com campo vazio → `valor_total = null` no código não corrigido
  - Observar: submit com `valor_total = 1000000` → envia `1000000` (number) ao serviço no código não corrigido
  - Observar: demais campos (nome, cliente, status, datas, descrição) funcionam normalmente
  - Escrever testes baseados em propriedades: para qualquer string de dígitos válida, o submit deve produzir `number | null` (nunca string)
  - Verificar que `formatCurrency` em `Contratos.tsx` continua exibindo `R$ 1.000.000,00` (não afetado pela correção)
  - Rodar no código NÃO CORRIGIDO
  - **EXPECTED OUTCOME**: Testes PASSAM (confirma comportamento baseline a preservar)
  - Marcar tarefa como completa quando os testes estiverem escritos, executados e passando no código não corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Corrigir formatação do campo Valor Total em ContratoForm

  - [x] 3.1 Implementar a correção em `src/components/contratos/ContratoForm.tsx`
    - Adicionar função auxiliar `formatarMilhares(digits: string): string` que aplica regex `/\B(?=(\d{3})+(?!\d))/g` para inserir pontos
    - Adicionar estado local `displayValor` (string) para controlar o valor exibido no input, separado do valor numérico do form
    - Adicionar handler `handleValorChange` que filtra apenas dígitos, aplica `formatarMilhares` e atualiza `displayValor` e o campo do form
    - Atualizar `useEffect` de inicialização para popular `displayValor` com o valor formatado quando `initialData.valor_total` existir
    - Substituir `z.coerce.number()` por `z.preprocess` que remove pontos antes de converter para inteiro (`parseInt` após `replace(/\./g, "")`)
    - Mudar o Input de `type="number"` para `type="text"`, remover `step="0.01"`, usar `value={displayValor}` e `onChange={handleValorChange}`, atualizar placeholder para `"Ex: 2.500.000"`
    - _Bug_Condition: `isBugCondition(X)` onde `X.valor_total IS NOT NULL AND X.valor_total > 0`_
    - _Expected_Behavior: `displayValue MATCHES /^\d{1,3}(\.\d{3})*$/` e `submitValue` é `number | null`_
    - _Preservation: submit continua enviando `number | null`; campo vazio continua sendo `null`; demais campos inalterados_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 3.2 Verificar que o teste de exploração do bug condition agora passa
    - **Property 1: Expected Behavior** - Campo Valor Total com formatação de milhares
    - **IMPORTANT**: Re-executar o MESMO teste da tarefa 1 — NÃO escrever um novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Rodar o teste de exploração do bug condition do passo 1
    - **EXPECTED OUTCOME**: Teste PASSA (confirma que o bug foi corrigido)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verificar que os testes de preservação continuam passando
    - **Property 2: Preservation** - Valor numérico no submit e comportamento dos demais campos
    - **IMPORTANT**: Re-executar os MESMOS testes da tarefa 2 — NÃO escrever novos testes
    - Rodar os testes de preservação do passo 2
    - **EXPECTED OUTCOME**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes passam após a correção

- [x] 4. Checkpoint — Garantir que todos os testes passam
  - Executar a suite completa de testes
  - Verificar que o teste de exploração (Property 1) passa com o código corrigido
  - Verificar que os testes de preservação (Property 2) continuam passando
  - Perguntar ao usuário se houver dúvidas
