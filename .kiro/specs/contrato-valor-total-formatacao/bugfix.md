# Bugfix Requirements Document

## Introduction

O campo "Valor Total" no formulário de cadastro de contratos (`ContratoForm.tsx`) não exibe o valor formatado corretamente. Atualmente o campo usa `type="number"` nativo do browser, que não aplica separadores de milhares e aceita casas decimais. O requisito é exibir números inteiros com ponto como separador de milhares (ex: `100.000.000`, `999.990`), sem centavos.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o usuário digita um valor inteiro grande no campo "Valor Total" (ex: 100000000) THEN o sistema exibe o número sem formatação, sem separadores de milhares (ex: `100000000`)

1.2 WHEN o formulário é aberto para edição de um contrato existente com valor numérico THEN o sistema exibe o valor sem formatação de milhares no campo de entrada

1.3 WHEN o usuário digita no campo "Valor Total" THEN o sistema permite entrada de casas decimais (ex: `2500000.00`) por ser `type="number"` com `step="0.01"`, contrariando o requisito de inteiros sem centavos

### Expected Behavior (Correct)

2.1 WHEN o usuário digita um valor inteiro no campo "Valor Total" THEN o sistema SHALL exibir o valor formatado com ponto como separador de milhares (ex: `100.000.000`)

2.2 WHEN o formulário é aberto para edição de um contrato existente THEN o sistema SHALL exibir o valor numérico armazenado formatado com separadores de milhares no campo de entrada

2.3 WHEN o usuário interage com o campo "Valor Total" THEN o sistema SHALL aceitar apenas dígitos inteiros, sem permitir entrada de casas decimais

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o usuário submete o formulário com um valor total preenchido THEN o sistema SHALL CONTINUE TO enviar o valor como número inteiro para o serviço de persistência (`contratoService`)

3.2 WHEN o campo "Valor Total" está vazio THEN o sistema SHALL CONTINUE TO aceitar o campo como opcional (nullable) e submeter `null`

3.3 WHEN o valor total é exibido na tabela de listagem de contratos (`Contratos.tsx`) THEN o sistema SHALL CONTINUE TO formatar o valor usando `Intl.NumberFormat` com estilo de moeda BRL (ex: `R$ 100.000.000,00`)

3.4 WHEN os demais campos do formulário de contrato (nome, cliente, datas, status, descrição) são preenchidos e submetidos THEN o sistema SHALL CONTINUE TO funcionar sem alterações de comportamento

---

## Bug Condition (Pseudocódigo)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ValorTotalInput
  OUTPUT: boolean

  // O bug ocorre quando o campo recebe qualquer valor inteiro positivo
  RETURN X.valor_total IS NOT NULL AND X.valor_total > 0
END FUNCTION
```

```pascal
// Property: Fix Checking — Formatação com separador de milhares
FOR ALL X WHERE isBugCondition(X) DO
  displayValue ← formatarValorTotal(X.valor_total)
  ASSERT displayValue MATCHES pattern /^\d{1,3}(\.\d{3})*$/
  ASSERT displayValue NOT CONTAINS ","
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT submitValue(X) = originalSubmitValue(X)
END FOR
```
