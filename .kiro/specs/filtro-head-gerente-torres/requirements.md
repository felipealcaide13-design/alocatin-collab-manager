# Requirements Document

## Introduction

Na página de Torres (TorreForm), os campos de seleção de Head e Gerente atualmente exibem todos os colaboradores sem nenhum filtro. Esta feature implementa filtros contextuais nesses campos: os campos de Head devem exibir apenas colaboradores com senioridade "Head" que pertencem à área correspondente (Tecnologia ou Produto), e os campos de Gerente devem exibir apenas colaboradores com senioridade "Gerente" que pertencem à área correspondente (Produto ou Design).

O modelo de dados já suporta essa filtragem: `Colaborador` possui `senioridade` (enum `senioridade_enum`) e `area_ids` (array de UUIDs referenciando `areas`). As áreas relevantes são identificadas pelo nome (ex: "Tecnologia", "Produto", "Design").

## Glossary

- **TorreForm**: Componente React responsável pelo formulário de criação e edição de Torres (`src/components/torres/TorreForm.tsx`)
- **Colaborador**: Entidade que representa um colaborador da empresa, com campos `senioridade`, `area_ids` e `status`
- **Area**: Entidade que representa uma área organizacional, com campo `nome` e `id`
- **Senioridade**: Enum com valores possíveis: "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)", "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior"
- **Head**: Colaborador com senioridade igual a "Head"
- **Gerente**: Colaborador com senioridade igual a "Gerente"
- **Area_ids**: Array de UUIDs de áreas às quais o colaborador pertence
- **colaboradorService**: Serviço responsável por buscar colaboradores do banco de dados (`src/services/colaboradorService.ts`)
- **areaService**: Serviço responsável por buscar áreas do banco de dados (`src/services/areaService.ts`)

---

## Requirements

### Requirement 1: Filtro de Head de Tecnologia por Senioridade e Área

**User Story:** Como usuário da página de Torres, quero que o campo "Head de Tecnologia" exiba apenas colaboradores com senioridade "Head" pertencentes à área de Tecnologia, para que eu selecione apenas candidatos elegíveis para o cargo.

#### Acceptance Criteria

1. WHEN o TorreForm é aberto, THE TorreForm SHALL carregar a lista de áreas disponíveis para identificar o ID da área de Tecnologia.
2. WHEN o campo "Head de Tecnologia" é renderizado, THE TorreForm SHALL exibir apenas colaboradores cuja `senioridade` seja "Head" E cujo `area_ids` contenha o ID da área de Tecnologia.
3. IF nenhum colaborador com senioridade "Head" pertencente à área de Tecnologia for encontrado, THEN THE TorreForm SHALL exibir a opção "Nenhum" como único item disponível além do placeholder.
4. WHEN um colaborador já selecionado como Head de Tecnologia não atende mais aos critérios de filtro (ex: mudança de senioridade), THE TorreForm SHALL manter o valor salvo visível no campo durante a edição sem forçar limpeza automática.

---

### Requirement 2: Filtro de Head de Produto por Senioridade e Área

**User Story:** Como usuário da página de Torres, quero que o campo "Head de Produto" exiba apenas colaboradores com senioridade "Head" pertencentes à área de Produto, para que eu selecione apenas candidatos elegíveis para o cargo.

#### Acceptance Criteria

1. WHEN o campo "Head de Produto" é renderizado, THE TorreForm SHALL exibir apenas colaboradores cuja `senioridade` seja "Head" E cujo `area_ids` contenha o ID da área de Produto.
2. IF nenhum colaborador com senioridade "Head" pertencente à área de Produto for encontrado, THEN THE TorreForm SHALL exibir a opção "Nenhum" como único item disponível além do placeholder.
3. THE TorreForm SHALL aplicar o filtro de Head de Produto de forma independente do filtro de Head de Tecnologia, permitindo que o mesmo colaborador apareça em ambos os campos se pertencer a ambas as áreas.

---

### Requirement 3: Filtro de Gerente de Produto por Senioridade e Área

**User Story:** Como usuário da página de Torres, quero que o campo "Gerente de Produto" exiba apenas colaboradores com senioridade "Gerente" pertencentes à área de Produto, para que eu selecione apenas candidatos elegíveis para o cargo.

#### Acceptance Criteria

1. WHEN o campo "Gerente de Produto" é renderizado, THE TorreForm SHALL exibir apenas colaboradores cuja `senioridade` seja "Gerente" E cujo `area_ids` contenha o ID da área de Produto.
2. IF nenhum colaborador com senioridade "Gerente" pertencente à área de Produto for encontrado, THEN THE TorreForm SHALL exibir a opção "Nenhum" como único item disponível além do placeholder.

---

### Requirement 4: Filtro de Gerente de Design por Senioridade e Área

**User Story:** Como usuário da página de Torres, quero que o campo "Gerente de Design" exiba apenas colaboradores com senioridade "Gerente" pertencentes à área de Design, para que eu selecione apenas candidatos elegíveis para o cargo.

#### Acceptance Criteria

1. WHEN o campo "Gerente de Design" é renderizado, THE TorreForm SHALL exibir apenas colaboradores cuja `senioridade` seja "Gerente" E cujo `area_ids` contenha o ID da área de Design.
2. IF nenhum colaborador com senioridade "Gerente" pertencente à área de Design for encontrado, THEN THE TorreForm SHALL exibir a opção "Nenhum" como único item disponível além do placeholder.

---

### Requirement 5: Campo Responsável pelo Negócio sem filtro de senioridade

**User Story:** Como usuário da página de Torres, quero que o campo "Responsável pelo Negócio" continue exibindo todos os colaboradores ativos, pois esse papel não está restrito a uma senioridade específica.

#### Acceptance Criteria

1. WHEN o campo "Responsável pelo Negócio" é renderizado, THE TorreForm SHALL exibir todos os colaboradores com `status` igual a "Ativo", sem filtro por senioridade ou área.

---

### Requirement 6: Identificação de Áreas por Nome

**User Story:** Como desenvolvedor, quero que a identificação das áreas relevantes (Tecnologia, Produto, Design) seja feita por nome de forma case-insensitive, para que variações de capitalização não quebrem o filtro.

#### Acceptance Criteria

1. WHEN o TorreForm carrega as áreas, THE TorreForm SHALL identificar a área de Tecnologia comparando o campo `nome` da área de forma case-insensitive com o valor "tecnologia".
2. WHEN o TorreForm carrega as áreas, THE TorreForm SHALL identificar a área de Produto comparando o campo `nome` da área de forma case-insensitive com o valor "produto".
3. WHEN o TorreForm carrega as áreas, THE TorreForm SHALL identificar a área de Design comparando o campo `nome` da área de forma case-insensitive com o valor "design".
4. IF uma área correspondente não for encontrada pelo nome, THEN THE TorreForm SHALL exibir todos os colaboradores com a senioridade correspondente sem filtro de área, como fallback.

---

### Requirement 7: Performance e Carregamento

**User Story:** Como usuário, quero que os campos filtrados carreguem sem atraso perceptível, para que a experiência de uso do formulário seja fluida.

#### Acceptance Criteria

1. THE TorreForm SHALL buscar colaboradores e áreas em paralelo usando React Query, evitando requisições sequenciais desnecessárias.
2. WHILE os dados de colaboradores ou áreas estão sendo carregados, THE TorreForm SHALL manter os campos de seleção desabilitados ou exibir estado de carregamento.
3. THE TorreForm SHALL aplicar os filtros de senioridade e área no lado do cliente (client-side), sem requisições adicionais ao banco de dados por campo.
