# Plano de Implementação: Dashboard de Gestão de RH

## Visão Geral

Substituição completa da página `src/pages/Index.tsx` por um dashboard de RH orientado a dados acionáveis. A implementação segue a arquitetura definida no design: lógica pura em `dashboardRH.ts`, queries paralelas em `useDashboardRH`, e componentes de apresentação desacoplados.

## Tasks

- [x] 1. Criar funções puras de derivação de métricas em `src/utils/dashboardRH.ts`
  - Implementar `calcWorkforceMetrics(colaboradores, diretorias, areas)` retornando `WorkforceMetrics`
  - Implementar `calcContratoMetrics(contratos, torres)` retornando `ContratoMetrics`
  - Implementar `calcSenioridadeData(colaboradores)` retornando `SenioridadeItem[]` ordenado por value desc
  - Implementar `calcDiretoriaData(colaboradores, diretorias)` com fallback "Sem Diretoria"
  - Implementar `calcAreaHeadcountData(colaboradores, areas)` omitindo áreas sem ativos
  - Implementar `calcTorresData(torres)` retornando `TorreItem[]` ordenado por squadsCount desc
  - Implementar `calcRecentAdmissions(colaboradores, limit)` retornando os N mais recentes
  - Implementar `calcAlerts(colaboradores, squads)` retornando `Alert[]`
  - Implementar `formatDateBR(isoDate)` convertendo ISO → DD/MM/AAAA
  - Exportar todos os tipos: `WorkforceMetrics`, `ContratoMetrics`, `SenioridadeItem`, `DiretoriaItem`, `AreaHeadcountItem`, `TorreItem`, `RecentAdmission`, `Alert`
  - _Requirements: 1.1–1.6, 2.4, 3.4, 4.1–4.4, 5.1, 5.5, 6.1, 7.1–7.3, 7.7, 8.1, 8.4_


- [ ] 2. Escrever testes para `dashboardRH.ts`
  - [ ]* 2.1 Escrever property test — Property 1: taxaOcupacao consistente
    - **Property 1: Taxa de Ocupação é consistente com os dados de colaboradores**
    - **Validates: Requirements 1.4**
  - [ ]* 2.2 Escrever property test — Property 2: diretorias ativas ⊆ diretorias existentes
    - **Property 2: Contagem de diretorias ativas é subconjunto das diretorias existentes**
    - **Validates: Requirements 1.5**
  - [ ]* 2.3 Escrever property test — Property 3: soma senioridade = totalAtivos
    - **Property 3: Distribuição por senioridade cobre todos os ativos**
    - **Validates: Requirements 2.1, 2.4**
  - [ ]* 2.4 Escrever property test — Property 4: soma diretoria = totalAtivos
    - **Property 4: Distribuição por diretoria cobre todos os ativos (incluindo sem diretoria)**
    - **Validates: Requirements 3.1, 3.4**
  - [ ]* 2.5 Escrever property test — Property 5: admissões ordenadas por data decrescente
    - **Property 5: Admissões recentes estão ordenadas por data decrescente**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [ ]* 2.6 Escrever property test — Property 6: torres ordenadas por squadsCount decrescente
    - **Property 6: Torres ordenadas por squadsCount decrescente**
    - **Validates: Requirements 8.1**
  - [ ]* 2.7 Escrever property test — Property 7: totalMembros = soma membros dos squads
    - **Property 7: Total de membros por torre é a soma dos membros dos squads**
    - **Validates: Requirements 8.4**
  - [ ]* 2.8 Escrever property test — Property 8: alertas de squads sem líder são corretos
    - **Property 8: Alertas de squads sem líder são corretos**
    - **Validates: Requirements 7.1, 7.7**
  - [ ]* 2.9 Escrever property test — Property 9: formatação de data ISO → DD/MM/AAAA
    - **Property 9: Formatação de data de admissão**
    - **Validates: Requirements 5.5**
  - [ ]* 2.10 Escrever testes unitários para edge cases
    - `taxaOcupacao` com `totalAtivos === 0` retorna 0
    - Colaborador sem `diretoria_id` agrupado em "Sem Diretoria"
    - Alerta de squad vazio (`membros === null` ou `[]`)
    - Alerta de colaborador sem diretoria
    - Formatação de datas com mês/dia com zero à esquerda e ano bissexto
    - _Requirements: 1.4, 3.4, 7.2, 7.3, 5.5_
  - Arquivo: `src/test/dashboard-gestao-rh.test.ts`

- [x] 3. Checkpoint — Garantir que todos os testes de `dashboardRH.ts` passam
  - Garantir que todos os testes passam, tirar dúvidas com o usuário se necessário.


- [x] 4. Criar hook `src/hooks/useDashboardRH.ts`
  - Declarar 5 queries paralelas com React Query: `colaboradores`, `contratos`, `torres` (com squads), `diretorias`, `areas`
  - Usar `queryKey` existentes para aproveitar cache: `["colaboradores"]`, `["contratos"]`, `["torres"]`, `["diretorias"]`, `["areas"]`
  - Derivar todas as métricas chamando as funções de `dashboardRH.ts`
  - Expor `isLoading` como `true` enquanto qualquer query estiver carregando
  - Retornar interface `DashboardRHData` completa
  - _Requirements: 1.1–1.6, 2.1, 3.1, 4.1–4.4, 5.1, 6.1, 7.1–7.3, 8.1, 9.4_

- [x] 5. Criar componente genérico `src/components/dashboard/ExpandableCard.tsx`
  - Implementar `ExpandableCard` com props `title`, `preview`, `full`, `defaultExpanded?`
  - Estado interno `expanded` controlado por `useState`
  - Botão "Ver mais" / "Ver menos" no rodapé do card
  - Usar componentes shadcn/ui (`Card`, `Button`) e TailwindCSS
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 5.2, 5.3, 6.2, 6.3, 7.4, 7.5, 8.2, 8.3_

- [x] 6. Criar componentes de StatCards
  - [x] 6.1 Criar `src/components/dashboard/WorkforceStatCards.tsx`
    - Recebe `WorkforceMetrics` e `isLoading`
    - Renderiza 6 StatCards: total, ativos, desligados, taxa de ocupação (%), diretorias ativas, áreas ativas
    - Grid responsivo: 2 colunas (sm), 3 colunas (md), 6 colunas (lg)
    - Exibe skeletons quando `isLoading === true`
    - _Requirements: 1.1–1.7, 9.1, 9.4_
  - [x] 6.2 Criar `src/components/dashboard/ContratoStatCards.tsx`
    - Recebe `ContratoMetrics` e `isLoading`
    - Renderiza 4 StatCards: contratos ativos, pausados, torres ativas, squads ativos
    - Exibe skeletons quando `isLoading === true`
    - _Requirements: 4.1–4.5, 9.4_

- [x] 7. Criar componentes de gráficos
  - [x] 7.1 Criar `src/components/dashboard/SenioridadeBarChart.tsx`
    - Recebe `SenioridadeItem[]` e `collapsed: boolean`
    - Quando `collapsed`: exibe apenas os 4 primeiros itens com indicador "..."
    - Quando expandido: exibe todos os níveis
    - BarChart horizontal (layout="vertical") com Recharts
    - _Requirements: 2.1–2.4_
  - [x] 7.2 Criar `src/components/dashboard/DiretoriaPieChart.tsx`
    - Recebe `DiretoriaItem[]` e `collapsed: boolean`
    - Quando `collapsed`: altura 200px, legenda truncada
    - Quando expandido: altura 300px, legenda completa
    - PieChart donut com Recharts
    - _Requirements: 3.1–3.4_
  - [x] 7.3 Criar `src/components/dashboard/AreaBarChart.tsx`
    - Recebe `AreaHeadcountItem[]` e `collapsed: boolean`
    - Quando `collapsed`: exibe top 5; quando expandido: top 10
    - BarChart vertical com Recharts
    - _Requirements: 6.1–6.4_

- [x] 8. Criar componentes de listas
  - [x] 8.1 Criar `src/components/dashboard/AlertsPanel.tsx`
    - Recebe `Alert[]` e `collapsed: boolean`
    - Quando `collapsed`: máximo 3 alertas + indicador "..." se houver mais
    - Quando expandido: todos os alertas
    - Quando `alerts.length === 0`: exibe "Tudo certo por aqui"
    - Badge de tipo para cada alerta com nome do item afetado
    - _Requirements: 7.1–7.7_
  - [x] 8.2 Criar `src/components/dashboard/TorresList.tsx`
    - Recebe `TorreItem[]` e `collapsed: boolean`
    - Quando `collapsed`: 4 torres; quando expandido: todas
    - Exibe nome, contagem de squads e total de membros por torre
    - _Requirements: 8.1–8.5_
  - [x] 8.3 Criar `src/components/dashboard/RecentAdmissionsList.tsx`
    - Recebe `RecentAdmission[]` e `collapsed: boolean`
    - Quando `collapsed`: 5 itens; quando expandido: 10 itens
    - Exibe nome, senioridade e data formatada (DD/MM/AAAA)
    - Botão "Ver todos" que navega para `/colaboradores`
    - _Requirements: 5.1–5.5_

- [x] 9. Substituir `src/pages/Index.tsx` pelo novo Dashboard RH
  - Importar e usar `useDashboardRH`
  - Cabeçalho com título "Dashboard RH" e subtítulo com data atual em português
  - Seção de força de trabalho: `WorkforceStatCards`
  - Seção de contratos: `ContratoStatCards`
  - Grid de ExpandableCards (2 colunas md+): Senioridade, Diretoria, Headcount por Área, Admissões Recentes, Alertas, Torres
  - Espaçamento `gap-4` consistente entre todas as seções
  - _Requirements: 9.1–9.5_

- [x] 10. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, tirar dúvidas com o usuário se necessário.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- As funções puras em `dashboardRH.ts` são o núcleo testável — implementar e testar antes dos componentes
- Os componentes `StatCards.tsx` e `Charts.tsx` existentes são mantidos (não deletar) — o `Index.tsx` simplesmente para de importá-los
