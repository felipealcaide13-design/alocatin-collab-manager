# Design Document — Configuração de Torre por BU

## Overview

Esta feature introduz um sistema de configuração dinâmica para o formulário de cadastro de Torre. Hoje os campos de liderança são hardcoded no `TorreForm`; com esta mudança, cada Business Unit define sua própria lista de campos de liderança (nome, senioridade-filtro, diretoria-filtro) e um toggle para o campo Descrição. O formulário de Torre passa a ser renderizado dinamicamente com base na configuração da BU selecionada.

A configuração é gerenciada em uma nova aba "Configuração" dentro da página de Business Units, e persistida em uma nova tabela `bu_torre_configs` no Supabase.

## Architecture

```mermaid
graph TD
    A[BusinessUnits Page] -->|aba Configuração| B[BUTorreConfigTab]
    B -->|seleciona BU| C[configuracaoTorreService]
    C -->|CRUD| D[(bu_torre_configs)]
    E[TorreForm] -->|bu_id selecionado| C
    C -->|retorna CampoConfig[]| E
    E -->|filtra por senioridade + diretoria| F[colaboradorService]
    F -->|lista filtrada| E
```

**Fluxo principal:**
1. Admin acessa aba "Configuração" → seleciona uma BU → vê/edita a lista de campos de liderança
2. Usuário abre TorreForm → seleciona BU → form carrega config da BU → renderiza campos dinamicamente
3. Cada campo de liderança é um `<Select>` filtrado por `senioridade` e `diretoria_id` do colaborador

**Decisões de design:**
- A configuração é armazenada como JSONB em uma tabela dedicada (1 linha por BU), evitando múltiplas tabelas relacionais para um dado simples e mutável.
- Os campos fixos hardcoded (`responsavel_negocio`, `head_tecnologia`, etc.) são removidos do `TorreForm` e substituídos por um campo JSONB `liderancas` na tabela `torres`, que armazena `{ [campo_id]: colaborador_id }`.
- A migração dos dados existentes é feita via função no serviço, não via migration SQL automática, para dar controle ao admin.

## Components and Interfaces

### Novos componentes

**`BUTorreConfigTab`** (`src/components/business-units/BUTorreConfigTab.tsx`)
- Aba de configuração dentro de `BusinessUnits.tsx`
- Props: `businessUnits: BusinessUnit[]`
- Estado interno: `selectedBuId`, `config: BUTorreConfig | null`, `editingCampo`
- Renderiza: seletor de BU, campos fixos (read-only), toggle de Descrição, lista de campos de liderança com CRUD e reordenação

**`CampoLiderancaForm`** (`src/components/business-units/CampoLiderancaForm.tsx`)
- Formulário inline (ou dialog) para adicionar/editar um campo de liderança
- Props: `campo?: CampoLiderancaConfig`, `diretorias: Diretoria[]`, `onSave`, `onCancel`
- Validação: nome obrigatório, senioridade obrigatória, diretoria obrigatória

### Componentes modificados

**`TorreForm`** (`src/components/torres/TorreForm.tsx`)
- Remove campos fixos de liderança do schema Zod e do JSX
- Adiciona `liderancas: Record<string, string | null>` ao schema
- Ao mudar `bu_id`: busca config da BU, renderiza campos dinamicamente, limpa valores anteriores
- Pré-preenche `liderancas` ao editar uma Torre existente

**`BusinessUnits.tsx`** (`src/pages/BusinessUnits.tsx`)
- Adiciona `TabsTrigger` e `TabsContent` para a aba "Configuração"
- Passa `businessUnits` para `BUTorreConfigTab`

### Novo serviço

**`configuracaoTorreService`** (`src/services/configuracaoTorreService.ts`)

```typescript
interface CampoLiderancaConfig {
  id: string;           // UUID gerado no cliente (crypto.randomUUID)
  nome: string;
  senioridade: Senioridade;
  diretoria_id: string;
  ordem: number;
}

interface BUTorreConfig {
  bu_id: string;
  campos_lideranca: CampoLiderancaConfig[];
  descricao_habilitada: boolean;
}

const configuracaoTorreService = {
  getByBuId(buId: string): Promise<BUTorreConfig | null>,
  upsert(config: BUTorreConfig): Promise<BUTorreConfig>,
  migrarCamposFixos(buId: string): Promise<void>,  // cria config padrão se não existir
}
```

## Data Models

### Nova tabela: `bu_torre_configs`

```sql
CREATE TABLE public.bu_torre_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bu_id       UUID NOT NULL UNIQUE REFERENCES public.business_units(id) ON DELETE CASCADE,
  config      JSONB NOT NULL DEFAULT '{"campos_lideranca": [], "descricao_habilitada": false}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

O campo `config` armazena o objeto `BUTorreConfig` serializado:
```json
{
  "campos_lideranca": [
    {
      "id": "uuid",
      "nome": "Head de Tecnologia",
      "senioridade": "Head",
      "diretoria_id": "uuid-diretoria",
      "ordem": 0
    }
  ],
  "descricao_habilitada": true
}
```

### Modificação na tabela `torres`

Adicionar coluna `liderancas` para substituir os cinco campos fixos:

```sql
ALTER TABLE public.torres
  ADD COLUMN IF NOT EXISTS liderancas JSONB NOT NULL DEFAULT '{}';
```

Estrutura: `{ [campo_id: string]: string | null }` onde a chave é o `id` do `CampoLiderancaConfig` e o valor é o UUID do colaborador selecionado.

Os campos fixos (`responsavel_negocio`, `head_tecnologia`, `head_produto`, `gerente_produto`, `gerente_design`) permanecem na tabela para compatibilidade retroativa, mas deixam de ser usados pelo `TorreForm`.

### Tipos TypeScript novos

```typescript
// src/types/configuracaoTorre.ts
export interface CampoLiderancaConfig {
  id: string;
  nome: string;
  senioridade: Senioridade;
  diretoria_id: string;
  ordem: number;
}

export interface BUTorreConfig {
  bu_id: string;
  campos_lideranca: CampoLiderancaConfig[];
  descricao_habilitada: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Campos fixos sempre presentes no TorreForm

*Para qualquer* configuração de BU (incluindo configuração vazia ou nula), o `TorreForm` deve sempre renderizar os campos "Nome da Torre" e "Business Unit".

**Validates: Requirements 2.1, 2.2**

---

### Property 2: Visibilidade de Descrição reflete configuração

*Para qualquer* `BUTorreConfig`, se `descricao_habilitada` for `true` então o campo Descrição deve estar visível no `TorreForm`; se for `false`, o campo deve estar oculto.

**Validates: Requirements 3.2, 3.3**

---

### Property 3: Adição de campo aumenta a lista

*Para qualquer* `BUTorreConfig` com N campos de liderança, após adicionar um novo campo válido, a lista deve conter N+1 campos.

**Validates: Requirements 4.1**

---

### Property 4: Remoção de campo diminui a lista

*Para qualquer* `BUTorreConfig` com N > 0 campos de liderança, após remover um campo, a lista deve conter N-1 campos e o campo removido não deve mais aparecer.

**Validates: Requirements 4.3**

---

### Property 5: Campos com dados obrigatórios ausentes são rejeitados

*Para qualquer* `CampoLiderancaConfig` onde `nome`, `senioridade` ou `diretoria_id` esteja vazio/nulo, a tentativa de salvar deve ser rejeitada com mensagem de erro, e a lista de campos não deve ser alterada.

**Validates: Requirements 4.5, 4.6, 4.7**

---

### Property 6: Round-trip de configuração por BU

*Para qualquer* `BUTorreConfig` válida, após chamar `upsert(config)` e em seguida `getByBuId(config.bu_id)`, o resultado retornado deve ser equivalente ao objeto salvo (mesmos campos, mesma ordem, mesmo toggle de descrição).

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 7: Campos de liderança renderizados correspondem à configuração

*Para qualquer* BU com uma `BUTorreConfig` contendo N campos de liderança, ao selecionar essa BU no `TorreForm`, exatamente N campos de liderança devem ser renderizados, com os nomes correspondentes à configuração.

**Validates: Requirements 6.1**

---

### Property 8: Filtro de colaboradores por senioridade e diretoria

*Para qualquer* campo de liderança com `senioridade` S e `diretoria_id` D, e qualquer lista de colaboradores, as opções exibidas no select devem conter apenas colaboradores cuja `senioridade === S` e `diretoria_id === D`.

**Validates: Requirements 6.2, 7.1**

---

### Property 9: Troca de BU limpa valores de liderança

*Para qualquer* `TorreForm` com uma BU selecionada e campos de liderança preenchidos, ao trocar para outra BU, todos os valores de `liderancas` devem ser resetados para `null`.

**Validates: Requirements 6.3**

---

### Property 10: Migração é idempotente

*Para qualquer* BU que já possui uma `BUTorreConfig` salva, chamar `migrarCamposFixos(buId)` não deve alterar a configuração existente.

**Validates: Requirements 8.3**

---

## Error Handling

| Cenário | Comportamento |
|---|---|
| `getByBuId` para BU sem config | Retorna `null`; UI exibe estado vazio com orientação |
| `upsert` falha no Supabase | Toast de erro; estado local não é alterado |
| Colaborador não encontra filtros | Select exibe apenas opção "Nenhum" |
| BU removida com config associada | `ON DELETE CASCADE` remove a config automaticamente |
| Campo de liderança com nome duplicado | Permitido (sem restrição de unicidade por nome) |
| `migrarCamposFixos` em BU já configurada | Retorna sem modificar (idempotente) |

## Testing Strategy

### Abordagem dual: testes unitários + property-based

**Testes unitários** cobrem exemplos concretos e casos de borda:
- Renderização da aba "Configuração" na página de BUs
- Estado vazio quando nenhuma BU está selecionada
- Campos fixos exibidos como não-editáveis na config
- Select vazio quando nenhum colaborador satisfaz os filtros
- Função de migração cria os 5 campos padrão para BU sem config

**Property-based tests** cobrem as propriedades universais acima usando a biblioteca **fast-check** (já compatível com o stack Vitest/TypeScript do projeto).

Configuração mínima: **100 iterações por propriedade**.

Cada teste de propriedade deve ser anotado com:
```
// Feature: configuracao-torre-bu, Property N: <texto da propriedade>
```

**Mapeamento de propriedades para testes:**

| Propriedade | Tipo de teste | Geradores fast-check |
|---|---|---|
| P1 — Campos fixos sempre presentes | property | `fc.record({ campos_lideranca: fc.array(...), descricao_habilitada: fc.boolean() })` |
| P2 — Visibilidade de Descrição | property | `fc.boolean()` para `descricao_habilitada` |
| P3 — Adição aumenta lista | property | `fc.array(campoArb)` + `fc.record(campoArb)` |
| P4 — Remoção diminui lista | property | `fc.array(campoArb, { minLength: 1 })` |
| P5 — Campos inválidos rejeitados | property | `fc.record({ nome: fc.constant(""), ... })` |
| P6 — Round-trip de config | property | `fc.record(buTorreConfigArb)` |
| P7 — Campos renderizados = config | property | `fc.array(campoArb)` |
| P8 — Filtro de colaboradores | property | `fc.array(colaboradorArb)` + `fc.record(campoArb)` |
| P9 — Troca de BU limpa valores | property | dois `fc.uuid()` para bu_ids distintos |
| P10 — Migração idempotente | property | `fc.record(buTorreConfigArb)` |

**Arquivos de teste:**
- `src/test/configuracao-torre-bu.test.ts` — todos os testes unitários e de propriedade
