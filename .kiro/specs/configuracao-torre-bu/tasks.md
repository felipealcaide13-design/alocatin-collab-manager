# Implementation Plan: Configuração de Torre por BU

## Overview

Implementar o sistema de configuração dinâmica de campos de liderança no formulário de Torre, com persistência por BU via tabela `bu_torre_configs` e aba de gerenciamento na página de Business Units.

## Tasks

- [x] 1. Criar migration SQL e tipos TypeScript
  - Criar arquivo de migration com a tabela `bu_torre_configs` (JSONB, FK para `business_units` com CASCADE)
  - Adicionar coluna `liderancas JSONB NOT NULL DEFAULT '{}'` na tabela `torres`
  - Criar `src/types/configuracaoTorre.ts` com interfaces `CampoLiderancaConfig` e `BUTorreConfig`
  - Atualizar `src/integrations/supabase/types.ts` adicionando `bu_torre_configs` ao schema de tipos
  - _Requirements: 5.1, 5.3, 8.1_

- [x] 2. Implementar `configuracaoTorreService`
  - [x] 2.1 Criar `src/services/configuracaoTorreService.ts` com métodos `getByBuId`, `upsert` e `migrarCamposFixos`
    - `getByBuId`: busca no Supabase e retorna `BUTorreConfig | null`
    - `upsert`: persiste via INSERT ... ON CONFLICT DO UPDATE
    - `migrarCamposFixos`: cria config padrão com os 5 campos originais se BU não tiver config
    - _Requirements: 5.1, 5.2, 5.4, 8.2, 8.3_

  - [ ]* 2.2 Escrever property test para round-trip de configuração (Property 6)
    - **Property 6: Round-trip de configuração por BU**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 2.3 Escrever property test para migração idempotente (Property 10)
    - **Property 10: Migração é idempotente**
    - **Validates: Requirements 8.3**

- [x] 3. Implementar `CampoLiderancaForm`
  - Criar `src/components/business-units/CampoLiderancaForm.tsx`
  - Formulário com campos: nome (obrigatório), senioridade (Select com enum `senioridade_enum`), diretoria (Select com lista de diretorias)
  - Validação Zod: nome, senioridade e diretoria_id obrigatórios; exibir mensagens de erro inline
  - Props: `campo?: CampoLiderancaConfig`, `diretorias: Diretoria[]`, `onSave`, `onCancel`
  - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7_

  - [ ]* 3.1 Escrever property test para validação de campos obrigatórios (Property 5)
    - **Property 5: Campos com dados obrigatórios ausentes são rejeitados**
    - **Validates: Requirements 4.5, 4.6, 4.7**

- [x] 4. Implementar `BUTorreConfigTab`
  - Criar `src/components/business-units/BUTorreConfigTab.tsx`
  - Seletor de BU no topo; ao selecionar, carrega config via `configuracaoTorreService.getByBuId`
  - Exibir campos fixos "Nome da Torre" e "Business Unit" como read-only
  - Toggle para `descricao_habilitada`
  - Lista de campos de liderança com botões Editar, Remover e reordenação (mover para cima/baixo)
  - Botão "Adicionar Campo" abre `CampoLiderancaForm` inline
  - Botão "Salvar Configuração" chama `configuracaoTorreService.upsert`; toast de sucesso/erro
  - Estado vazio com mensagem orientativa quando nenhuma BU selecionada
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 3.1, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.1 Escrever property test para adição de campo aumenta lista (Property 3)
    - **Property 3: Adição de campo aumenta a lista**
    - **Validates: Requirements 4.1**

  - [ ]* 4.2 Escrever property test para remoção de campo diminui lista (Property 4)
    - **Property 4: Remoção de campo diminui a lista**
    - **Validates: Requirements 4.3**

- [x] 5. Adicionar aba "Configuração" em `BusinessUnits.tsx`
  - Importar `BUTorreConfigTab` e `Settings` icon (lucide-react)
  - Adicionar `TabsTrigger value="configuracao"` ao `TabsList` existente
  - Adicionar `TabsContent value="configuracao"` renderizando `<BUTorreConfigTab businessUnits={businessUnits} />`
  - _Requirements: 1.1_

- [x] 6. Checkpoint — Verificar aba de Configuração
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas antes de prosseguir.

- [x] 7. Refatorar `TorreForm` para renderização dinâmica
  - [x] 7.1 Remover campos fixos de liderança do schema Zod e do JSX
    - Remover `responsavel_negocio`, `head_tecnologia`, `head_produto`, `gerente_produto`, `gerente_design` do schema e do form
    - Adicionar `liderancas: z.record(z.string(), z.string().nullable().optional())` ao schema
    - _Requirements: 8.1_

  - [x] 7.2 Adicionar lógica de carregamento dinâmico de config por BU
    - Ao mudar `bu_id`, chamar `configuracaoTorreService.getByBuId(bu_id)` e armazenar em estado local
    - Limpar todos os valores de `liderancas` ao trocar de BU
    - Renderizar dinamicamente os campos de liderança com base em `config.campos_lideranca`
    - Cada campo renderiza um `<Select>` filtrado por `senioridade === campo.senioridade && diretoria_id === campo.diretoria_id`
    - Exibir campo "Descrição" somente se `config.descricao_habilitada === true`
    - Não exibir seção de Liderança se BU não tiver configuração
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 3.2, 3.3_

  - [x] 7.3 Pré-preencher `liderancas` ao editar Torre existente
    - Ao abrir form em modo edição, popular `liderancas` a partir de `initialData.liderancas`
    - Validar que o colaborador pré-preenchido ainda satisfaz os filtros da config atual
    - _Requirements: 6.4_

  - [ ]* 7.4 Escrever property test para campos fixos sempre presentes (Property 1)
    - **Property 1: Campos fixos sempre presentes no TorreForm**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 7.5 Escrever property test para visibilidade de Descrição (Property 2)
    - **Property 2: Visibilidade de Descrição reflete configuração**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 7.6 Escrever property test para campos renderizados = config (Property 7)
    - **Property 7: Campos de liderança renderizados correspondem à configuração**
    - **Validates: Requirements 6.1**

  - [ ]* 7.7 Escrever property test para filtro de colaboradores (Property 8)
    - **Property 8: Filtro de colaboradores por senioridade e diretoria**
    - **Validates: Requirements 6.2, 7.1**

  - [ ]* 7.8 Escrever property test para troca de BU limpa valores (Property 9)
    - **Property 9: Troca de BU limpa valores de liderança**
    - **Validates: Requirements 6.3**

- [x] 8. Atualizar `torreService` para persistir `liderancas`
  - Garantir que `createTorre` e `updateTorre` incluem o campo `liderancas` no payload enviado ao Supabase
  - Atualizar o tipo `TorreInput` em `src/types/torre.ts` adicionando `liderancas?: Record<string, string | null>`
  - _Requirements: 5.1, 6.1_

- [x] 9. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas antes de finalizar.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Os campos fixos (`responsavel_negocio` etc.) permanecem na tabela `torres` para compatibilidade retroativa, mas deixam de ser usados pelo `TorreForm`
- Property tests usam `fast-check` com mínimo de 100 iterações, anotados com `// Feature: configuracao-torre-bu, Property N: <texto>`
- Arquivo de testes: `src/test/configuracao-torre-bu.test.ts`
