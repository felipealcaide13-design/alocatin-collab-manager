# Requirements Document

## Introduction

Redesenho da página Dashboard (`src/pages/Index.tsx`) para criar uma visão de gestão completa voltada para a Diretora de RH. O novo dashboard substitui a visão genérica atual por painéis temáticos que cobrem força de trabalho, saúde organizacional, contratos e alocação — com foco em dados acionáveis, sem sobrecarga visual. Cards com muito conteúdo usam truncamento com botão de expandir para exibir gráficos ou listas completas.

## Glossary

- **Dashboard_RH**: A página principal (`/`) redesenhada para a Diretora de RH.
- **StatCard**: Componente de card numérico com ícone, valor e variação.
- **ExpandableCard**: Card que exibe prévia truncada com botão "Ver mais" para revelar conteúdo completo (gráfico ou lista).
- **Colaborador**: Profissional cadastrado no sistema com senioridade, status, diretoria e áreas.
- **Contrato**: Acordo comercial com cliente, podendo ser do tipo Aberto (recorrente) ou Fechado (projeto).
- **Torre**: Unidade de entrega vinculada a uma Business Unit, com squads e responsáveis.
- **Squad**: Equipe operacional vinculada a uma Torre e opcionalmente a um Contrato.
- **Diretoria**: Agrupamento organizacional de alto nível que contém Áreas.
- **Área**: Subdivisão de uma Diretoria com líderes e colaboradores associados.
- **Business_Unit**: Agrupamento de Torres para fins de gestão de portfólio.
- **Senioridade**: Nível hierárquico do colaborador (C-level, Diretor(a), Head, Gerente, Coordenador(a), Staf I, Staf II, Analista senior, Analista pleno, Analista junior).
- **Taxa_de_Ocupação**: Percentual de colaboradores ativos alocados em pelo menos um squad.
- **Headcount**: Contagem de colaboradores ativos em um dado contexto organizacional.

---

## Requirements

### Requirement 1: Indicadores Gerais de Força de Trabalho

**User Story:** Como Diretora de RH, quero ver os principais números da força de trabalho em destaque, para ter uma leitura rápida da situação atual sem precisar navegar para outras páginas.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um StatCard com o total de colaboradores cadastrados no sistema.
2. THE Dashboard_RH SHALL exibir um StatCard com o total de colaboradores com status "Ativo".
3. THE Dashboard_RH SHALL exibir um StatCard com o total de colaboradores com status "Desligado".
4. THE Dashboard_RH SHALL exibir um StatCard com a Taxa_de_Ocupação, calculada como o percentual de colaboradores ativos que possuem ao menos um squad_id associado.
5. THE Dashboard_RH SHALL exibir um StatCard com o total de Diretorias ativas (com ao menos um colaborador ativo).
6. THE Dashboard_RH SHALL exibir um StatCard com o total de Áreas ativas (com ao menos um colaborador ativo).
7. WHEN os dados estão sendo carregados, THE Dashboard_RH SHALL exibir skeletons nos lugares dos StatCards.

---

### Requirement 2: Distribuição por Senioridade

**User Story:** Como Diretora de RH, quero visualizar como os colaboradores estão distribuídos por nível de senioridade, para entender a pirâmide organizacional e identificar gaps de liderança ou excesso de um nível.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um ExpandableCard com gráfico de barras horizontais mostrando a contagem de colaboradores ativos por Senioridade.
2. WHEN o ExpandableCard de senioridade está no estado colapsado, THE Dashboard_RH SHALL exibir apenas os 4 níveis com maior headcount e indicar com "..." que há mais dados.
3. WHEN o usuário clica em "Ver mais" no ExpandableCard de senioridade, THE Dashboard_RH SHALL exibir o gráfico completo com todos os níveis de Senioridade.
4. THE Dashboard_RH SHALL ordenar os níveis de Senioridade do maior para o menor headcount no gráfico.

---

### Requirement 3: Distribuição por Diretoria

**User Story:** Como Diretora de RH, quero ver como os colaboradores ativos estão distribuídos entre as Diretorias, para identificar concentrações e desequilíbrios na estrutura organizacional.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um ExpandableCard com gráfico de pizza/donut mostrando a proporção de colaboradores ativos por Diretoria.
2. WHEN o ExpandableCard de diretoria está no estado colapsado, THE Dashboard_RH SHALL exibir o gráfico com altura reduzida (máximo 200px) e legenda truncada.
3. WHEN o usuário clica em "Ver mais" no ExpandableCard de diretoria, THE Dashboard_RH SHALL exibir o gráfico em altura completa (300px) com legenda completa.
4. IF um colaborador ativo não possui diretoria_id associado, THEN THE Dashboard_RH SHALL agrupá-lo na categoria "Sem Diretoria" no gráfico.

---

### Requirement 4: Saúde dos Contratos

**User Story:** Como Diretora de RH, quero ter uma visão rápida do portfólio de contratos, para entender quantos estão ativos, pausados ou encerrados e qual o volume financeiro envolvido.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um StatCard com o total de contratos com status "Ativo".
2. THE Dashboard_RH SHALL exibir um StatCard com o total de contratos com status "Pausado".
3. THE Dashboard_RH SHALL exibir um StatCard com o total de Torres vinculadas a contratos ativos.
4. THE Dashboard_RH SHALL exibir um StatCard com o total de Squads vinculados a contratos ativos.
5. WHEN os dados de contratos estão sendo carregados, THE Dashboard_RH SHALL exibir skeletons nos lugares dos StatCards de contratos.

---

### Requirement 5: Colaboradores Recém-Admitidos

**User Story:** Como Diretora de RH, quero ver os colaboradores admitidos mais recentemente, para acompanhar o onboarding e garantir que os novos membros estejam sendo integrados corretamente.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um ExpandableCard listando os 5 colaboradores com dataAdmissao mais recente.
2. WHEN o ExpandableCard de admissões está no estado colapsado, THE Dashboard_RH SHALL exibir apenas os 5 colaboradores mais recentes com nome, senioridade e data de admissão.
3. WHEN o usuário clica em "Ver mais" no ExpandableCard de admissões, THE Dashboard_RH SHALL exibir os 10 colaboradores mais recentes.
4. THE Dashboard_RH SHALL exibir um botão "Ver todos" que navega para `/colaboradores`.
5. THE Dashboard_RH SHALL formatar a dataAdmissao no padrão brasileiro (DD/MM/AAAA) na listagem.

---

### Requirement 6: Headcount por Área (Top N)

**User Story:** Como Diretora de RH, quero ver quais Áreas concentram mais colaboradores ativos, para identificar onde há maior densidade de pessoas e planejar redistribuições.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um ExpandableCard com gráfico de barras verticais mostrando as 5 Áreas com maior headcount de colaboradores ativos.
2. WHEN o ExpandableCard de headcount por área está no estado colapsado, THE Dashboard_RH SHALL exibir apenas as 5 Áreas com maior headcount.
3. WHEN o usuário clica em "Ver mais" no ExpandableCard de headcount por área, THE Dashboard_RH SHALL exibir as 10 Áreas com maior headcount.
4. IF uma Área não possui colaboradores ativos, THEN THE Dashboard_RH SHALL omiti-la do gráfico.

---

### Requirement 7: Alertas e Destaques Operacionais

**User Story:** Como Diretora de RH, quero ser alertada sobre situações que requerem atenção imediata, para agir proativamente antes que se tornem problemas maiores.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um painel de alertas que lista Squads sem líder definido (lider = null).
2. THE Dashboard_RH SHALL exibir no painel de alertas Squads sem membros (membros = null ou array vazio).
3. THE Dashboard_RH SHALL exibir no painel de alertas colaboradores ativos sem diretoria_id associado.
4. WHEN o painel de alertas está no estado colapsado, THE Dashboard_RH SHALL exibir no máximo 3 alertas com indicação "..." se houver mais.
5. WHEN o usuário clica em "Ver mais" no painel de alertas, THE Dashboard_RH SHALL exibir todos os alertas.
6. WHEN não há alertas ativos, THE Dashboard_RH SHALL exibir uma mensagem "Tudo certo por aqui" no painel de alertas.
7. THE Dashboard_RH SHALL categorizar cada alerta com um tipo (ex: "Squad sem líder", "Squad vazio", "Colaborador sem diretoria") e exibir o nome do item afetado.

---

### Requirement 8: Visão de Squads por Torre

**User Story:** Como Diretora de RH, quero ver um resumo de quantos squads cada Torre possui e quantos membros estão alocados, para entender a densidade operacional por Torre.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL exibir um ExpandableCard com lista das Torres ordenadas pelo número de squads (decrescente).
2. WHEN o ExpandableCard de torres está no estado colapsado, THE Dashboard_RH SHALL exibir as 4 Torres com mais squads, com nome da Torre, contagem de squads e total de membros.
3. WHEN o usuário clica em "Ver mais" no ExpandableCard de torres, THE Dashboard_RH SHALL exibir todas as Torres.
4. THE Dashboard_RH SHALL calcular o total de membros de uma Torre somando os membros de todos os seus squads.
5. IF uma Torre não possui squads, THE Dashboard_RH SHALL exibi-la com contagem zero.

---

### Requirement 9: Layout e Responsividade

**User Story:** Como Diretora de RH, quero que o dashboard seja legível tanto em desktop quanto em telas menores, para acessar as informações em qualquer dispositivo.

#### Acceptance Criteria

1. THE Dashboard_RH SHALL organizar os StatCards em grid de 2 colunas em telas pequenas (sm) e 3 colunas em telas médias (md) e 6 colunas em telas grandes (lg).
2. THE Dashboard_RH SHALL organizar os ExpandableCards em grid de 1 coluna em telas pequenas e 2 colunas em telas médias e grandes.
3. THE Dashboard_RH SHALL exibir um cabeçalho com título "Dashboard RH" e subtítulo com a data atual formatada em português.
4. WHILE os dados estão carregando, THE Dashboard_RH SHALL exibir skeletons com as mesmas dimensões dos componentes finais.
5. THE Dashboard_RH SHALL manter espaçamento consistente de `gap-4` entre todos os cards e seções.
