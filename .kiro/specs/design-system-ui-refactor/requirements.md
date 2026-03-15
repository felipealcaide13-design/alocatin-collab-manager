# Requirements Document

## Introduction

Refatoração visual completa e criação de um design system centralizado para o sistema de gestão de RH **Alocatin**. O objetivo é padronizar tokens de design (cores, tipografia, espaçamentos, sombras), unificar componentes com estrutura duplicada (StatCards, DetailPanels, Badges de status/senioridade, formulários), modernizar o visual do dashboard e garantir consistência visual em todas as páginas.

**Filosofia de uso de cor:** A paleta neutral (branco, cinza claro, cinza médio) é a base da interface — backgrounds, superfícies de cards, bordas sutis e texto. A paleta primária azul-ciano (#3CA2C4) é reservada para elementos de destaque e identidade: ícones ativos, bordas de ênfase, badges, botões de ação, indicadores de navegação ativa, títulos de seção e elementos interativos. Não é necessário usar todos os tons da escala — apenas os que fazem sentido semântico (ex: 600 para ação principal, 700 para hover, 100/50 para backgrounds sutis de destaque). A paleta complementar laranja-terracota (#C4603C) é usada pontualmente para alertas críticos e ações destrutivas.

---

## Glossary

- **Design_System**: Conjunto centralizado de tokens de design (variáveis CSS) e componentes base reutilizáveis que governam toda a aparência do sistema.
- **Token**: Variável CSS nomeada que representa um valor de design (cor, espaçamento, tipografia, sombra, raio de borda).
- **StatCard**: Componente de cartão de métrica exibido no dashboard, composto por ícone, título e valor numérico.
- **DetailPanel**: Componente de painel de detalhes exibido em Dialog, usado para Colaborador, Contrato, Torre, Squad e Diretoria.
- **StatusBadge**: Componente de badge que representa o status de uma entidade (Ativo, Desligado, Pausado, Encerrado).
- **SenioridadeBadge**: Componente de badge que representa o nível de senioridade de um colaborador.
- **PageLayout**: Estrutura padrão de uma página com cabeçalho (título + subtítulo + ação primária), área de filtros e área de conteúdo principal.
- **FilterBar**: Componente de barra de filtros padronizado usado em todas as páginas de listagem.
- **AppLayout**: Componente de layout raiz com sidebar e header.
- **Sidebar**: Painel de navegação lateral do AppLayout.
- **Dashboard**: Página principal (Index) com visão geral de métricas de RH.
- **Primary_Palette**: Escala de cores baseada no azul-ciano #3CA2C4, de 50 a 900.
- **Complementary_Color**: Laranja-terracota (~#C4603C) usado como cor de destaque e ação.
- **Chart**: Componente de visualização de dados (gráfico de barras, pizza, etc.) do dashboard.

---

## Requirements

### Requirement 1: Tokens de Design Centralizados

**User Story:** Como desenvolvedor, quero tokens de design centralizados em variáveis CSS, para que qualquer mudança visual seja aplicada globalmente sem editar componentes individualmente.

#### Acceptance Criteria

1. THE Design_System SHALL definir tokens de cor primária apenas para os tons com uso semântico claro: `--primary-50`, `--primary-100`, `--primary-600`, `--primary-700`, `--primary-800`, `--primary-900` — baseados em #3CA2C4.
2. THE Design_System SHALL definir tokens semânticos de cor: `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-border`, `--color-border-subtle`, `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled`.
3. THE Design_System SHALL definir tokens de status semânticos: `--color-success`, `--color-success-subtle`, `--color-warning`, `--color-warning-subtle`, `--color-danger`, `--color-danger-subtle`, `--color-info`, `--color-info-subtle`.
4. THE Design_System SHALL definir tokens de espaçamento em escala de 4px (`--space-1` = 4px, `--space-2` = 8px, ..., `--space-16` = 64px).
5. THE Design_System SHALL definir tokens de tipografia: `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`, `--font-size-3xl`.
6. THE Design_System SHALL definir tokens de sombra: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`.
7. THE Design_System SHALL definir tokens de raio de borda: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`.
8. THE Design_System SHALL expor a cor complementar laranja-terracota via token `--color-complementary` (~#C4603C) e sua escala sutil `--color-complementary-subtle`.
9. WHEN um token de cor primária é alterado, THE Design_System SHALL propagar a mudança para todos os componentes que o referenciam sem necessidade de edição individual.

---

### Requirement 2: Uso Correto da Paleta de Cores

**User Story:** Como designer do produto, quero que a paleta neutral seja a base da interface e a paleta primária seja usada em elementos de destaque, para que o sistema tenha identidade visual coesa sem saturação de cor.

#### Acceptance Criteria

1. THE Design_System SHALL configurar a cor `--primary` do shadcn/ui para corresponder ao token `--primary-600` (#3CA2C4).
2. THE Design_System SHALL usar a paleta neutral (branco, `--background`, `--card`, `--muted`) como base para backgrounds de página, superfícies de cards, bordas sutis e texto — seguindo o padrão shadcn/ui existente.
3. THE Design_System SHALL usar a paleta primária exclusivamente em elementos de destaque e identidade: ícones de navegação ativos, botões de ação primária, badges de status, bordas de ênfase, indicadores de progresso e títulos de seção com acento visual.
4. THE Design_System SHALL usar apenas os tons primários que fazem sentido semântico: `--primary-600` para ação/destaque principal, `--primary-700` para hover de botões, `--primary-800`/`--primary-900` para sidebar escura, `--primary-100`/`--primary-50` para backgrounds sutis de destaque (ex: hover de linha de tabela, fundo de badge info).
5. THE Sidebar SHALL usar `--primary-900` (#0D3D4F) como cor de fundo, criando contraste com a área de conteúdo neutral.
6. THE Sidebar SHALL usar `--primary-600` como cor de destaque para ícones e labels de itens de navegação ativos, com `--primary-800` como fundo do item ativo.
7. THE AppLayout SHALL usar `--background` (branco/cinza muito claro) como cor de fundo da área de conteúdo principal.
8. WHERE a cor complementar laranja-terracota é usada, THE Design_System SHALL restringir seu uso a alertas críticos, ações destrutivas e badges de status de alto risco.
9. THE Design_System SHALL substituir todas as referências a cores hardcoded (ex: `text-blue-600`, `bg-emerald-500/10`, `text-purple-600`) por tokens semânticos do Design_System.

---

### Requirement 3: Componente StatCard Unificado

**User Story:** Como desenvolvedor, quero um único componente `StatCard` reutilizável, para que os três componentes atuais (StatCards, WorkforceStatCards, ContratoStatCards) sejam substituídos por uma implementação única e consistente.

#### Acceptance Criteria

1. THE Design_System SHALL fornecer um componente `StatCard` com props: `title: string`, `value: string | number`, `icon: LucideIcon`, `variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'`, `trend?: { value: number; label: string }`, `isLoading?: boolean`.
2. WHEN `isLoading` é `true`, THE StatCard SHALL exibir um skeleton de dimensões equivalentes ao card preenchido.
3. WHEN `variant` é fornecido, THE StatCard SHALL aplicar a cor do ícone e do valor usando o token semântico correspondente (`--color-success`, `--color-warning`, etc.).
4. WHEN `variant` não é fornecido, THE StatCard SHALL usar `--primary-600` como cor padrão do ícone e do valor.
5. THE StatCard SHALL aceitar uma prop `trend` opcional e, WHEN fornecida, SHALL exibir um indicador de tendência (seta + percentual) abaixo do valor principal.
6. THE Design_System SHALL remover os componentes `StatCards.tsx`, `WorkforceStatCards.tsx` e `ContratoStatCards.tsx` após migração completa para o componente unificado `StatCard`.
7. THE StatCard SHALL manter o layout atual: ícone no canto superior direito, título acima, valor em destaque abaixo.

---

### Requirement 4: Componente StatusBadge Unificado

**User Story:** Como desenvolvedor, quero um componente `StatusBadge` centralizado, para que os mapeamentos de cor de status duplicados em múltiplos arquivos sejam eliminados.

#### Acceptance Criteria

1. THE Design_System SHALL fornecer um componente `StatusBadge` com props: `status: string`, `variant?: 'entity' | 'contract' | 'seniority'`.
2. WHEN `variant` é `'entity'`, THE StatusBadge SHALL mapear: `'Ativo'` → token success, `'Desligado'` → token danger.
3. WHEN `variant` é `'contract'`, THE StatusBadge SHALL mapear: `'Ativo'` → token success, `'Encerrado'` → token muted, `'Pausado'` → token warning.
4. WHEN `variant` é `'seniority'`, THE StatusBadge SHALL mapear cada nível de senioridade para uma cor da escala primária ou análoga, usando tokens do Design_System.
5. WHEN um `status` desconhecido é fornecido, THE StatusBadge SHALL renderizar com estilo neutro (muted) sem lançar erro.
6. THE Design_System SHALL remover os objetos `STATUS_COLOR`, `SENIORIDADE_COLOR` e `CONTRATO_STATUS_COLOR` duplicados em `ColaboradorDetailPanel.tsx`, `ContratoDetailPanel.tsx`, `TorreDetailPanel.tsx` e `DiretoriaDetailPanel.tsx` após migração para `StatusBadge`.

---

### Requirement 5: Padrão de DetailPanel Unificado

**User Story:** Como desenvolvedor, quero um padrão estrutural comum para todos os DetailPanels, para que a experiência de visualização de detalhes seja consistente entre Colaborador, Contrato, Torre, Squad e Diretoria.

#### Acceptance Criteria

1. THE Design_System SHALL fornecer um componente `DetailSection` com props: `icon: LucideIcon`, `title: string`, `children: ReactNode` para padronizar seções internas dos DetailPanels.
2. THE Design_System SHALL fornecer um componente `DetailRow` com props: `icon: LucideIcon`, `label: string`, `value: ReactNode` para padronizar linhas de informação (equivalente ao `InfoRow` atual em `ColaboradorDetailPanel`).
3. THE Design_System SHALL fornecer um componente `StatMini` com props: `label: string`, `value: string | number` para padronizar os mini-cards de estatística dentro dos DetailPanels (ex: "2 Squads", "15 Colaboradores").
4. WHEN um DetailPanel é aberto, THE DetailPanel SHALL exibir um cabeçalho padronizado com: avatar/ícone da entidade, nome principal, badges de status e subtítulo contextual.
5. THE DetailPanel SHALL usar `max-w-xl` e `max-h-[85vh] overflow-y-auto` como dimensões padrão, exceto `DiretoriaDetailPanel` que usa `max-w-2xl`.
6. THE Design_System SHALL garantir que todos os DetailPanels usem `DetailSection`, `DetailRow` e `StatMini` em substituição às implementações inline atuais.

---

### Requirement 6: Dashboard Visual Moderno

**User Story:** Como usuário do sistema, quero um dashboard visualmente moderno e informativo, para que eu tenha uma visão clara e agradável das métricas de RH ao abrir o sistema.

#### Acceptance Criteria

1. THE Dashboard SHALL exibir um cabeçalho com saudação contextual (bom dia/tarde/noite), nome do dia e data, e um indicador visual de "última atualização".
2. THE Dashboard SHALL organizar as seções com separadores visuais claros e títulos de seção estilizados com a paleta primária.
3. THE Dashboard SHALL usar o componente `StatCard` unificado para todas as métricas de Força de Trabalho e Contratos.
4. WHEN os dados do dashboard estão carregando, THE Dashboard SHALL exibir skeletons em todos os StatCards e cards de gráfico simultaneamente, sem layout shift.
5. THE Dashboard SHALL exibir os gráficos (`SenioridadeBarChart`, `DiretoriaPieChart`, `AreaBarChart`) com cores derivadas da escala primária e complementar, substituindo as cores hardcoded atuais.
6. THE Dashboard SHALL usar `--chart-1` a `--chart-5` como tokens de cor para todos os gráficos, mapeados para a paleta primária.
7. THE ExpandableCard SHALL ter visual de hover e transição suave ao expandir/colapsar, usando tokens de animação do Design_System.
8. THE AlertsPanel SHALL usar tokens semânticos de cor (warning, danger, info) em vez de classes hardcoded (`text-amber-500`, `text-orange-500`, `text-blue-500`).

---

### Requirement 7: Padrão de PageLayout Unificado

**User Story:** Como desenvolvedor, quero um componente `PageLayout` reutilizável, para que todas as páginas de listagem (Colaboradores, Contratos, Áreas, BusinessUnits) tenham estrutura e aparência consistentes.

#### Acceptance Criteria

1. THE Design_System SHALL fornecer um componente `PageLayout` com props: `title: string`, `subtitle?: string`, `action?: ReactNode`, `children: ReactNode`.
2. THE PageLayout SHALL renderizar um cabeçalho com título em `text-2xl font-bold`, subtítulo em `text-sm text-muted-foreground` e slot de ação alinhado à direita.
3. THE Design_System SHALL fornecer um componente `FilterBar` com prop `children: ReactNode` que renderiza um container padronizado (`bg-card rounded-xl border shadow-sm p-4`) para os filtros.
4. WHEN o componente `PageLayout` é usado, THE PageLayout SHALL aplicar `space-y-6` como espaçamento padrão entre seções.
5. THE Design_System SHALL garantir que as páginas `Colaboradores.tsx`, `Contratos.tsx`, `Areas.tsx` e `BusinessUnits.tsx` usem `PageLayout` e `FilterBar` em substituição às estruturas inline atuais.

---

### Requirement 8: Sidebar e AppLayout Modernizados

**User Story:** Como usuário, quero uma sidebar visualmente refinada e um header limpo, para que a navegação seja intuitiva e o visual seja coeso com o design system.

#### Acceptance Criteria

1. THE Sidebar SHALL exibir o logotipo "Alocatin" com a letra inicial em `--primary-400` e o restante em branco, mantendo o padrão atual mas com a nova paleta.
2. THE Sidebar SHALL usar `--primary-900` como cor de fundo e `--primary-700` como cor de hover dos itens de navegação.
3. THE Sidebar SHALL exibir um indicador de item ativo com borda esquerda de 3px na cor `--primary-400` e fundo `--primary-800`.
4. WHEN a sidebar está colapsada, THE Sidebar SHALL exibir apenas os ícones de navegação centralizados, com tooltip ao hover mostrando o label.
5. THE AppLayout header SHALL ter altura de 64px, fundo `--color-surface-raised` (branco/card), borda inferior sutil e sombra `--shadow-sm`.
6. THE AppLayout header SHALL exibir o avatar do usuário com iniciais em `--primary-600` como fundo e branco como texto.
7. WHEN a viewport é menor que 768px, THE AppLayout SHALL exibir o botão de menu mobile com ícone `Menu` e abrir a sidebar como overlay com backdrop semitransparente.

---

### Requirement 9: Tipografia e Hierarquia Visual

**User Story:** Como designer do produto, quero uma hierarquia tipográfica clara e consistente, para que os usuários identifiquem rapidamente títulos, subtítulos, labels e valores em qualquer tela.

#### Acceptance Criteria

1. THE Design_System SHALL definir que títulos de página usam `text-2xl font-bold text-foreground`.
2. THE Design_System SHALL definir que títulos de seção usam `text-xs font-semibold uppercase tracking-wider text-muted-foreground`.
3. THE Design_System SHALL definir que labels de campo usam `text-xs text-muted-foreground`.
4. THE Design_System SHALL definir que valores de campo usam `text-sm font-medium text-foreground`.
5. THE Design_System SHALL definir que valores de StatCard usam `text-3xl font-bold` com a cor do variant.
6. THE Design_System SHALL garantir que a fonte `Inter` seja carregada via `@import` no `index.css` com fallback para `system-ui`.
7. THE Design_System SHALL definir line-height padrão de `1.5` para texto de corpo e `1.2` para títulos via tokens CSS.

---

### Requirement 10: Consistência de Interações e Micro-animações

**User Story:** Como usuário, quero feedback visual consistente em todas as interações (hover, foco, clique), para que a interface pareça responsiva e polida.

#### Acceptance Criteria

1. THE Design_System SHALL definir uma classe utilitária `interactive` que aplica `transition-colors duration-150 ease-in-out` a qualquer elemento interativo.
2. WHEN um item de tabela recebe hover, THE Design_System SHALL aplicar `bg-primary-50/50` como cor de fundo de hover, substituindo `hover:bg-muted/20`.
3. WHEN um botão primário recebe hover, THE Design_System SHALL aplicar `bg-primary-700` como cor de fundo.
4. WHEN um Dialog é aberto, THE Design_System SHALL aplicar animação de entrada `fade-in` com `translateY(8px)` → `translateY(0)` em 200ms.
5. THE Design_System SHALL definir animação `slide-in-right` para DetailPanels que entram pela direita, com duração de 250ms.
6. WHEN um StatCard recebe hover, THE StatCard SHALL aplicar `shadow-md` e leve elevação via `translateY(-1px)`, com transição de 150ms.
7. THE Design_System SHALL garantir que todos os elementos focáveis tenham `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` para acessibilidade de teclado.

---

### Requirement 11: Componentes de Gráfico Padronizados

**User Story:** Como desenvolvedor, quero que todos os gráficos do dashboard usem a mesma paleta de cores e estrutura de container, para que a visualização de dados seja visualmente coesa.

#### Acceptance Criteria

1. THE Design_System SHALL definir um array de cores de gráfico `CHART_COLORS` derivado dos tokens `--chart-1` a `--chart-5`, mapeados para a escala primária e complementar.
2. THE Design_System SHALL fornecer um componente `ChartContainer` com props: `title: string`, `children: ReactNode`, `isLoading?: boolean` que padroniza o container dos gráficos com título, borda e padding consistentes.
3. WHEN `isLoading` é `true` no `ChartContainer`, THE ChartContainer SHALL exibir um skeleton de altura equivalente ao gráfico.
4. THE Design_System SHALL garantir que `SenioridadeBarChart`, `DiretoriaPieChart` e `AreaBarChart` usem `CHART_COLORS` em vez de arrays de cores hardcoded.
5. THE Design_System SHALL garantir que o componente legado `Charts.tsx` (PilarChart, SenioridadeChart) seja removido ou marcado como deprecated após migração completa.
6. WHEN um gráfico não tem dados, THE ChartContainer SHALL exibir um estado vazio padronizado com ícone e mensagem "Sem dados disponíveis".

---

### Requirement 12: Acessibilidade e Contraste

**User Story:** Como usuário com necessidades de acessibilidade, quero que todos os elementos visuais tenham contraste adequado e sejam navegáveis por teclado, para que o sistema seja utilizável por todos.

#### Acceptance Criteria

1. THE Design_System SHALL garantir que todas as combinações de cor texto/fundo atendam ao mínimo de contraste WCAG AA (4.5:1 para texto normal, 3:1 para texto grande).
2. THE Design_System SHALL garantir que todos os elementos interativos (botões, links, inputs) tenham estado de foco visível via `focus-visible:ring`.
3. THE Design_System SHALL garantir que todos os ícones decorativos tenham `aria-hidden="true"` e ícones funcionais tenham `aria-label` descritivo.
4. THE StatusBadge SHALL incluir texto legível além da cor, nunca usando cor como único indicador de status.
5. THE Design_System SHALL garantir que todos os Dialogs tenham `DialogTitle` visível ou `sr-only` para leitores de tela.
6. WHEN um elemento de tabela é focado via teclado, THE Design_System SHALL aplicar o mesmo estilo de foco definido no Requirement 10, critério 7.
