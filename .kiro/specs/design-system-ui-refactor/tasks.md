# Implementation Plan: Design System UI Refactor

## Overview

Migração incremental em 4 fases: tokens CSS → componentes base → dashboard → AppLayout e páginas. Cada fase é independente e validável antes de avançar.

## Tasks

- [x] 1. Fase 1 — Tokens e Base
  - [x] 1.1 Atualizar `src/index.css` com tokens CSS primários e semânticos
    - Adicionar escala primária: `--primary-50`, `--primary-100`, `--primary-600`, `--primary-700`, `--primary-800`, `--primary-900` baseados em #3CA2C4
    - Adicionar tokens semânticos de superfície: `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-border`, `--color-border-subtle`
    - Adicionar tokens de texto: `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled`
    - Adicionar tokens de status: `--color-success`, `--color-success-subtle`, `--color-warning`, `--color-warning-subtle`, `--color-danger`, `--color-danger-subtle`, `--color-info`, `--color-info-subtle`
    - Adicionar tokens de espaçamento `--space-1` a `--space-16` (escala de 4px)
    - Adicionar tokens de tipografia: `--font-size-xs` a `--font-size-3xl`
    - Adicionar tokens de sombra: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
    - Adicionar tokens de raio: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`
    - Adicionar token complementar: `--color-complementary` (~#C4603C) e `--color-complementary-subtle`
    - Adicionar tokens de animação: `interactive` (transition-colors 150ms), `fade-in` (200ms), `slide-in-right` (250ms)
    - Adicionar `@import` da fonte Inter com fallback `system-ui`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 9.6, 9.7, 10.1, 10.4, 10.5_

  - [x] 1.2 Sobrescrever `--primary` do shadcn/ui para #3CA2C4 em HSL no `:root` do `index.css`
    - Mapear `--primary` para o valor HSL equivalente a `--primary-600` (#3CA2C4)
    - Garantir que `--primary-foreground` seja branco para contraste adequado
    - _Requirements: 2.1, 12.1_

  - [x] 1.3 Atualizar `tailwind.config.ts` para expor tokens primários como classes utilitárias
    - Adicionar `primary-50`, `primary-100`, `primary-600`, `primary-700`, `primary-800`, `primary-900` no `extend.colors` referenciando as variáveis CSS
    - Adicionar `chart-1` a `chart-5` no `extend.colors`
    - _Requirements: 1.1, 2.4, 11.1_

  - [ ]* 1.4 Escrever property test: tokens primários são valores CSS válidos
    - **Property 1: Token CSS primário é string não-vazia e começa com `#` ou `hsl`**
    - **Validates: Requirements 1.1, 2.1**

- [x] 2. Fase 2 — Componentes Base
  - [x] 2.1 Criar `src/components/ui/stat-card.tsx`
    - Implementar `StatCard` com props: `title`, `value`, `icon`, `variant?`, `trend?`, `isLoading?`
    - Aplicar cor do ícone/valor via token semântico conforme `variant` (`--color-success`, `--color-warning`, `--color-danger`, `--color-info`)
    - Usar `--primary-600` como cor padrão quando `variant` não fornecido
    - Exibir skeleton quando `isLoading` é `true`
    - Exibir indicador de tendência (seta + percentual) quando `trend` fornecido
    - Layout: ícone no canto superior direito, título acima, valor em destaque (`text-3xl font-bold`)
    - Aplicar hover com `shadow-md` e `translateY(-1px)` em 150ms
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 10.6_

  - [ ]* 2.2 Escrever property test para StatCard
    - **Property 2: StatCard com `isLoading=true` nunca renderiza valor numérico**
    - **Property 3: StatCard com qualquer `variant` válido renderiza sem lançar erro**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 2.3 Criar `src/components/ui/status-badge.tsx`
    - Implementar `StatusBadge` com props: `status`, `variant?: 'entity' | 'contract' | 'seniority'`
    - Mapear `entity`: `'Ativo'` → success, `'Desligado'` → danger
    - Mapear `contract`: `'Ativo'` → success, `'Encerrado'` → muted, `'Pausado'` → warning
    - Mapear `seniority`: cada nível para cor da escala primária/análoga via tokens
    - Status desconhecido → estilo neutro (muted) sem erro
    - Incluir texto legível além da cor (nunca cor como único indicador)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.4_

  - [ ]* 2.4 Escrever property test para StatusBadge
    - **Property 4: StatusBadge com status desconhecido sempre renderiza sem lançar erro**
    - **Property 5: StatusBadge sempre contém texto visível (não apenas cor)**
    - **Validates: Requirements 4.5, 12.4**

  - [x] 2.5 Criar `src/components/ui/detail-section.tsx`
    - Implementar `DetailSection` com props: `icon`, `title`, `children`
    - Implementar `DetailRow` com props: `icon`, `label`, `value`
    - Implementar `StatMini` com props: `label`, `value`
    - Aplicar tipografia padronizada: labels `text-xs text-muted-foreground`, valores `text-sm font-medium`
    - _Requirements: 5.1, 5.2, 5.3, 9.3, 9.4_

  - [x] 2.6 Criar `src/components/ui/page-layout.tsx`
    - Implementar `PageLayout` com props: `title`, `subtitle?`, `action?`, `children`
    - Título em `text-2xl font-bold`, subtítulo em `text-sm text-muted-foreground`, ação alinhada à direita
    - Aplicar `space-y-6` como espaçamento padrão entre seções
    - Implementar `FilterBar` com prop `children` e container `bg-card rounded-xl border shadow-sm p-4`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1_

  - [x] 2.7 Criar `src/components/ui/chart-container.tsx` e `src/lib/chart-colors.ts`
    - Implementar `ChartContainer` com props: `title`, `children`, `isLoading?`
    - Exibir skeleton quando `isLoading` é `true`
    - Exibir estado vazio com ícone e "Sem dados disponíveis" quando sem dados
    - Criar `CHART_COLORS` array em `src/lib/chart-colors.ts` derivado de `--chart-1` a `--chart-5`
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

  - [ ]* 2.8 Escrever property test para ChartContainer
    - **Property 6: ChartContainer com `isLoading=true` nunca renderiza children**
    - **Validates: Requirements 11.3**

- [ ] 3. Checkpoint — Componentes base
  - Garantir que todos os novos componentes em `src/components/ui/` compilam sem erros TypeScript.
  - Garantir que todos os testes passam. Perguntar ao usuário se houver dúvidas.

- [x] 4. Fase 3 — Dashboard
  - [x] 4.1 Refatorar `src/pages/Index.tsx` com cabeçalho de saudação contextual
    - Adicionar saudação contextual (bom dia/tarde/noite), nome do dia e data
    - Adicionar indicador visual de "última atualização"
    - Organizar seções com separadores visuais e títulos estilizados com paleta primária
    - _Requirements: 6.1, 6.2_

  - [x] 4.2 Migrar `StatCards.tsx`, `WorkforceStatCards.tsx`, `ContratoStatCards.tsx` para usar `StatCard` unificado
    - Substituir implementações inline pelo componente `StatCard` importado de `src/components/ui/stat-card.tsx`
    - Mapear props existentes para a nova interface (`title`, `value`, `icon`, `variant`, `isLoading`)
    - Garantir que skeletons aparecem simultaneamente sem layout shift
    - _Requirements: 3.1, 3.2, 6.3, 6.4_

  - [x] 4.3 Migrar `SenioridadeBarChart`, `DiretoriaPieChart`, `AreaBarChart` para `ChartContainer` + `CHART_COLORS`
    - Envolver cada gráfico com `ChartContainer`
    - Substituir arrays de cores hardcoded por `CHART_COLORS` de `src/lib/chart-colors.ts`
    - _Requirements: 6.5, 6.6, 11.4_

  - [x] 4.4 Refatorar `AlertsPanel` para usar tokens semânticos de cor
    - Substituir `text-amber-500`, `text-orange-500`, `text-blue-500` por tokens `--color-warning`, `--color-danger`, `--color-info`
    - _Requirements: 2.9, 6.8_

  - [x] 4.5 Remover componentes legados `StatCards.tsx`, `WorkforceStatCards.tsx`, `ContratoStatCards.tsx`
    - Verificar que não há mais importações dos arquivos legados
    - Deletar os arquivos após confirmação
    - _Requirements: 3.6_

  - [ ]* 4.6 Escrever property test para saudação contextual do Dashboard
    - **Property 7: Saudação retorna "bom dia" para horas 6–11, "boa tarde" para 12–17, "boa noite" para demais**
    - **Validates: Requirements 6.1**

- [ ] 5. Checkpoint — Dashboard
  - Garantir que o dashboard renderiza sem erros e todos os testes passam. Perguntar ao usuário se houver dúvidas.

- [x] 6. Fase 4 — AppLayout, Páginas e DetailPanels
  - [x] 6.1 Refatorar `src/components/AppLayout.tsx`
    - Aplicar `--primary-900` como cor de fundo da sidebar
    - Aplicar `--primary-600` para ícones/labels de itens ativos, `--primary-800` como fundo do item ativo
    - Adicionar borda esquerda de 3px em `--primary-400` no item ativo
    - Aplicar `--primary-700` como hover dos itens de navegação
    - Header com altura 64px, fundo `--color-surface-raised`, borda inferior sutil e `--shadow-sm`
    - Avatar do usuário com iniciais em `--primary-600` como fundo e branco como texto
    - Garantir comportamento mobile: botão Menu + sidebar como overlay com backdrop
    - _Requirements: 2.5, 2.6, 2.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 6.2 Aplicar `PageLayout` + `FilterBar` em `Colaboradores.tsx`, `Contratos.tsx`, `Areas.tsx`, `BusinessUnits.tsx`
    - Substituir estruturas de cabeçalho e filtros inline pelo `PageLayout` e `FilterBar`
    - Manter toda a lógica de estado e handlers existentes
    - _Requirements: 7.5_

  - [x] 6.3 Migrar `ColaboradorDetailPanel` para `DetailSection`, `DetailRow`, `StatMini`, `StatusBadge`
    - Substituir `InfoRow` inline por `DetailRow`
    - Substituir seções inline por `DetailSection`
    - Substituir mini-cards inline por `StatMini`
    - Substituir badge de status/senioridade por `StatusBadge`
    - Aplicar dimensões padrão: `max-w-xl max-h-[85vh] overflow-y-auto`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.4 Migrar `ContratoDetailPanel` para `DetailSection`, `DetailRow`, `StatMini`, `StatusBadge`
    - Substituir implementações inline pelos componentes padronizados
    - Aplicar dimensões padrão: `max-w-xl max-h-[85vh] overflow-y-auto`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.5 Migrar `TorreDetailPanel` e `SquadDetailPanel` para `DetailSection`, `DetailRow`, `StatMini`, `StatusBadge`
    - Substituir implementações inline pelos componentes padronizados
    - Aplicar dimensões padrão: `max-w-xl max-h-[85vh] overflow-y-auto`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.6 Migrar `DiretoriaDetailPanel` para `DetailSection`, `DetailRow`, `StatMini`, `StatusBadge`
    - Substituir implementações inline pelos componentes padronizados
    - Aplicar dimensões padrão: `max-w-2xl max-h-[85vh] overflow-y-auto`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.7 Remover objetos de cor duplicados `STATUS_COLOR`, `SENIORIDADE_COLOR`, `CONTRATO_STATUS_COLOR`
    - Verificar e remover de `ColaboradorDetailPanel.tsx`, `ContratoDetailPanel.tsx`, `TorreDetailPanel.tsx`, `DiretoriaDetailPanel.tsx`
    - Confirmar que `StatusBadge` cobre todos os casos antes de remover
    - _Requirements: 4.6_

  - [ ]* 6.8 Escrever property test: DetailPanel sempre renderiza DialogTitle acessível
    - **Property 8: Todo DetailPanel renderizado contém elemento com role `dialog` e título não-vazio**
    - **Validates: Requirements 12.5_

- [x] 7. Criar `src/test/design-system.test.tsx` com as 9 correctness properties
  - [x] 7.1 Implementar Property 1: tokens primários são valores CSS válidos
    - _Requirements: 1.1, 2.1_
  - [x] 7.2 Implementar Property 2: StatCard com `isLoading=true` nunca renderiza valor numérico
    - _Requirements: 3.2_
  - [x] 7.3 Implementar Property 3: StatCard com qualquer `variant` válido renderiza sem erro
    - _Requirements: 3.3_
  - [x] 7.4 Implementar Property 4: StatusBadge com status desconhecido renderiza sem erro
    - _Requirements: 4.5_
  - [x] 7.5 Implementar Property 5: StatusBadge sempre contém texto visível
    - _Requirements: 12.4_
  - [x] 7.6 Implementar Property 6: ChartContainer com `isLoading=true` nunca renderiza children
    - _Requirements: 11.3_
  - [x] 7.7 Implementar Property 7: saudação contextual cobre todas as faixas de hora
    - _Requirements: 6.1_
  - [x] 7.8 Implementar Property 8: DetailPanel sempre renderiza DialogTitle acessível
    - _Requirements: 12.5_
  - [ ]* 7.9 Implementar Property 9: todas as páginas com PageLayout aplicam `space-y-6`
    - **Property 9: PageLayout sempre aplica classe `space-y-6` no container raiz**
    - **Validates: Requirements 7.4**

- [x] 8. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, nenhum componente legado é importado, e o build compila sem erros. Perguntar ao usuário se houver dúvidas.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requirements específicos para rastreabilidade
- A ordem das fases é importante: tokens → componentes base → dashboard → layout/páginas
- Componentes legados só devem ser removidos após migração completa e validada
- Property tests usam Vitest + fast-check conforme padrão do projeto
