# Contrato Valor Total Formatação — Bugfix Design

## Overview

O campo "Valor Total" em `ContratoForm.tsx` usa `type="number"` nativo, que não aplica separadores de milhares e permite casas decimais. A correção transforma o campo em `type="text"` com máscara de formatação usando ponto como separador de milhares (ex: `100.000.000`), sem centavos. O valor numérico inteiro é preservado internamente e enviado corretamente ao `contratoService` no submit.

## Glossary

- **Bug_Condition (C)**: O campo exibe um valor inteiro positivo sem formatação de milhares — ocorre sempre que `valor_total` é um inteiro > 0
- **Property (P)**: O valor exibido no campo deve seguir o padrão `/^\d{1,3}(\.\d{3})*$/` (ponto como separador de milhares, sem centavos)
- **Preservation**: O valor submetido ao serviço deve continuar sendo `number | null`; os demais campos do formulário não devem ser afetados
- **formatarExibicao(n)**: Converte `number` para string formatada com pontos (ex: `1000000` → `"1.000.000"`)
- **parsearValor(s)**: Converte string formatada de volta para `number` removendo pontos (ex: `"1.000.000"` → `1000000`)
- **valor_total**: Campo do tipo `number | null` em `Contrato` que representa o valor monetário inteiro do contrato

## Bug Details

### Bug Condition

O bug manifesta-se quando o campo "Valor Total" é renderizado com `type="number"`, fazendo com que o browser exiba o número sem separadores de milhares e permita entrada de decimais. Qualquer valor inteiro positivo inserido ou carregado no campo é afetado.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type ValorTotalInput
  OUTPUT: boolean

  RETURN X.valor_total IS NOT NULL
         AND X.valor_total > 0
         AND displayedValue(X.valor_total) NOT MATCHES /^\d{1,3}(\.\d{3})*$/
END FUNCTION
```

### Examples

- Usuário digita `100000000` → exibido como `100000000` (bug); esperado: `100.000.000`
- Formulário abre para editar contrato com `valor_total = 2500000` → exibido como `2500000` (bug); esperado: `2.500.000`
- Usuário digita `2500000.50` → campo aceita decimal (bug); esperado: apenas inteiros
- Campo vazio → exibido como vazio (sem bug); deve continuar funcionando

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- O submit do formulário deve continuar enviando `valor_total` como `number | null` para `contratoService`
- Campo vazio deve continuar sendo aceito como opcional (`null`)
- A tabela de listagem em `Contratos.tsx` deve continuar formatando com `Intl.NumberFormat` BRL (ex: `R$ 100.000.000,00`)
- Todos os demais campos do formulário (nome, cliente, datas, status, descrição) devem continuar funcionando sem alterações

**Scope:**
Apenas o campo `valor_total` no `ContratoForm.tsx` é afetado. Nenhuma outra parte do sistema deve ser modificada.

## Hypothesized Root Cause

1. **Uso de `type="number"` nativo**: O input HTML nativo com `type="number"` delega a formatação ao browser, que não aplica separadores de milhares e permite decimais via `step="0.01"`. A solução é mudar para `type="text"` com controle manual da máscara.

2. **Ausência de lógica de formatação no onChange**: Não há handler que intercepte a digitação para aplicar a máscara de pontos em tempo real.

3. **Ausência de conversão no submit**: O schema Zod usa `z.coerce.number()`, que funciona para `type="number"`, mas com `type="text"` e máscara (pontos) precisará de pré-processamento para remover os pontos antes da coerção.

## Correctness Properties

Property 1: Bug Condition - Formatação com Separador de Milhares

_For any_ valor inteiro positivo inserido ou carregado no campo "Valor Total" (isBugCondition returns true), o campo SHALL exibir o valor formatado com ponto como separador de milhares, seguindo o padrão `/^\d{1,3}(\.\d{3})*$/`, sem casas decimais.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Valor Numérico no Submit

_For any_ interação com o formulário onde o bug condition NÃO se aplica (campo vazio, outros campos, submit), o sistema SHALL produzir exatamente o mesmo resultado que o código original, preservando o envio de `number | null` ao serviço e o comportamento dos demais campos.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `src/components/contratos/ContratoForm.tsx`

**Specific Changes:**

1. **Schema Zod — pré-processamento**: Substituir `z.coerce.number()` por `z.preprocess` que remove pontos da string antes de converter para número inteiro:
   ```ts
   valor_total: z.preprocess(
     (v) => {
       if (v === "" || v === null || v === undefined) return null;
       const cleaned = String(v).replace(/\./g, "");
       const n = parseInt(cleaned, 10);
       return isNaN(n) ? null : n;
     },
     z.number().int().nullable().optional()
   )
   ```

2. **Estado local de exibição**: Adicionar estado `displayValor` (string) para controlar o valor exibido no input, separado do valor numérico do form.

3. **Handler `handleValorChange`**: Ao digitar, filtrar apenas dígitos, aplicar formatação com pontos e atualizar tanto o estado de exibição quanto o campo do form (como string com pontos — o preprocess do Zod fará a conversão no submit).

4. **Inicialização do estado de exibição**: No `useEffect` que popula o form, inicializar `displayValor` com o valor formatado quando `initialData.valor_total` existir.

5. **Campo Input**: Mudar `type="number"` para `type="text"`, remover `step="0.01"`, usar `value={displayValor}` e `onChange={handleValorChange}`, atualizar placeholder para `"Ex: 2.500.000"`.

**Função auxiliar (inline no componente):**
```ts
const formatarMilhares = (digits: string): string => {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
```

## Testing Strategy

### Validation Approach

Abordagem em duas fases: primeiro rodar testes no código não corrigido para confirmar o bug, depois verificar que a correção funciona e que o comportamento existente é preservado.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug ANTES da correção — confirmar que o campo não formata valores com separadores de milhares.

**Test Plan**: Renderizar `ContratoForm` com `initialData` contendo `valor_total = 1000000` e verificar que o valor exibido no input NÃO está formatado. Rodar no código não corrigido para observar a falha.

**Test Cases:**
1. **Exibição sem formatação**: Abrir form com `valor_total = 1000000` → input exibe `"1000000"` (falha no código corrigido, passa no bugado)
2. **Digitação sem máscara**: Simular digitação de `"2500000"` → valor exibido não contém pontos (falha no código corrigido)
3. **Aceita decimal**: Simular digitação de `"2500000.50"` → campo aceita (falha no código corrigido)
4. **Edição com valor grande**: Abrir form com `valor_total = 100000000` → exibido como `"100000000"` sem pontos

**Expected Counterexamples:**
- O input exibe o número bruto sem separadores de milhares
- O campo aceita entrada de decimais via `step="0.01"`

### Fix Checking

**Goal**: Verificar que para todos os inputs onde o bug condition é verdadeiro, o campo exibe o valor formatado corretamente.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := renderField(X.valor_total)
  ASSERT result.displayValue MATCHES /^\d{1,3}(\.\d{3})*$/
  ASSERT result.displayValue NOT CONTAINS ","
END FOR
```

### Preservation Checking

**Goal**: Verificar que para inputs onde o bug condition NÃO se aplica, o comportamento é idêntico ao original.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT submitValue_original(X) = submitValue_fixed(X)
END FOR
```

**Testing Approach**: Testes baseados em propriedades são recomendados para preservation checking porque geram automaticamente muitos casos de teste no domínio de entrada e garantem que o valor submetido ao serviço permanece `number | null`.

**Test Cases:**
1. **Submit com valor formatado**: Preencher campo com `"1.000.000"` → submit envia `valor_total = 1000000` (number)
2. **Submit com campo vazio**: Deixar campo vazio → submit envia `valor_total = null`
3. **Outros campos inalterados**: Preencher nome, cliente, status → comportamento idêntico ao original
4. **Listagem não afetada**: `formatCurrency` em `Contratos.tsx` continua exibindo `R$ 1.000.000,00`

### Unit Tests

- Testar `formatarMilhares` com valores como `0`, `999`, `1000`, `1000000`, `100000000`
- Testar que o submit converte `"1.000.000"` → `1000000` e `""` → `null`
- Testar que o campo rejeita entrada de caracteres não numéricos

### Property-Based Tests

- Gerar inteiros aleatórios positivos e verificar que `formatarMilhares(String(n))` sempre produz string no padrão `/^\d{1,3}(\.\d{3})*$/`
- Verificar que `parsearValor(formatarMilhares(String(n))) === n` para qualquer inteiro positivo (round-trip)
- Verificar que o submit sempre produz `number | null` independente da string formatada recebida

### Integration Tests

- Abrir `ContratoForm` em modo criação, digitar valor, submeter e verificar payload enviado ao serviço
- Abrir `ContratoForm` em modo edição com contrato existente, verificar exibição formatada, alterar valor, submeter
- Verificar que a tabela de listagem continua exibindo valores com `Intl.NumberFormat` BRL após a correção
