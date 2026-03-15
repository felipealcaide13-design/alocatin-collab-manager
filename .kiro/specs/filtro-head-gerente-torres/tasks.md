# Plano de Implementação: Filtro de Colaboradores por Senioridade e Área nos Campos de Head e Gerente da Página de Torres

## Overview

Implementação de filtros client-side no `TorreForm` para os campos de Head e Gerente. A lógica central é uma função pura `filterColaboradores` que filtra por senioridade e área. O `TorreForm` passa a buscar áreas em paralelo com colaboradores via React Query e aplica os filtros em cada campo de seleção.

## Tasks

- [x] 1. Criar a função utilitária `filterColaboradores`
  - Criar o arquivo `src/utils/filterColaboradores.ts` com a função pura
  - A função recebe `(colaboradores: Colaborador[], areas: Area[], senioridade: Senioridade, areaNome: string): Colaborador[]`
  - Localizar a área pelo nome com `area.nome.toLowerCase() === areaNome.toLowerCase()`
  - Se a área não for encontrada, retornar todos os colaboradores com a senioridade correta (fallback)
  - Se a área for encontrada, retornar colaboradores com `senioridade === senioridade && area_ids.includes(area.id)`
  - _Requirements: 1.2, 2.1, 3.1, 4.1, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.1 Escrever property test — Property 1: filtro retorna apenas colaboradores com senioridade e área corretas
    - Usar fast-check para gerar listas aleatórias de colaboradores e áreas
    - Verificar que todos os elementos retornados têm `senioridade` correta e `area_ids` contendo o id da área alvo
    - `// Feature: filtro-head-gerente-torres, Property 1`
    - _Requirements: 1.2, 2.1, 3.1, 4.1, 1.3, 2.2, 3.2, 4.2_

  - [ ]* 1.2 Escrever property test — Property 2: colaborador com múltiplas áreas aparece em todos os filtros aplicáveis
    - Gerar colaborador com `area_ids` contendo IDs de duas áreas distintas e senioridade "Head"
    - Verificar que aparece no resultado de `filterColaboradores` para ambas as áreas
    - `// Feature: filtro-head-gerente-torres, Property 2`
    - _Requirements: 2.3_

  - [ ]* 1.3 Escrever property test — Property 3: matching de área é case-insensitive
    - Gerar variações de capitalização do nome da área (ex: "TECNOLOGIA", "tecnologia", "tEcNoLoGiA")
    - Verificar que `filterColaboradores` retorna o mesmo conjunto de colaboradores para todas as variações
    - `// Feature: filtro-head-gerente-torres, Property 3`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 1.4 Escrever property test — Property 4: fallback quando área não existe retorna todos com a senioridade correta
    - Gerar lista de áreas que não contém a área alvo pelo nome
    - Verificar que retorna todos os colaboradores com a senioridade correspondente, sem filtro de área
    - `// Feature: filtro-head-gerente-torres, Property 4`
    - _Requirements: 6.4_

- [x] 2. Atualizar o `TorreForm` para buscar áreas e aplicar os filtros
  - Adicionar `useQuery` para `areaService.getAll()` com `queryKey: ["areas"]` em paralelo à query de colaboradores
  - Importar `areaService` de `@/services/areaService`
  - Importar a função `filterColaboradores` de `@/utils/filterColaboradores`
  - Derivar as listas filtradas usando `filterColaboradores`:
    - `headsTeconologia`: senioridade `"Head"`, área `"tecnologia"`
    - `headsProduto`: senioridade `"Head"`, área `"produto"`
    - `gerentesProduto`: senioridade `"Gerente"`, área `"produto"`
    - `gerentesDesign`: senioridade `"Gerente"`, área `"design"`
  - Derivar `colaboradoresAtivos` filtrando `status === "Ativo"` para o campo Responsável pelo Negócio
  - Passar `disabled={isLoading || areasLoading}` para todos os `SelectTrigger` dos campos filtrados
  - Substituir a lista `colaboradores` por cada lista filtrada nos respectivos campos `SelectContent`
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 7.1, 7.2, 7.3_

  - [ ]* 2.1 Escrever property test — Property 5: campo Responsável pelo Negócio exibe apenas colaboradores ativos
    - Gerar lista mista de colaboradores com status "Ativo" e "Desligado"
    - Verificar que a lista derivada `colaboradoresAtivos` contém exatamente os colaboradores com `status === "Ativo"`
    - `// Feature: filtro-head-gerente-torres, Property 5`
    - _Requirements: 5.1_

  - [ ]* 2.2 Escrever testes unitários para o `TorreForm`
    - Testar que campos ficam desabilitados enquanto `isLoading` ou `areasLoading` é `true`
    - Testar que o valor selecionado é preservado quando o colaborador não está na lista filtrada (edição)
    - Testar que a query de áreas é disparada ao abrir o formulário
    - _Requirements: 1.4, 7.2, 1.1_

- [x] 3. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.
