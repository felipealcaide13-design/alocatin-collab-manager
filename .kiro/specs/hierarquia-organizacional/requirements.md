# Requirements Document

## Introduction

Esta feature adiciona dois novos níveis à hierarquia organizacional do sistema, que atualmente possui apenas "Áreas". A nova estrutura terá 3 níveis:

- **Diretoria** (nível superior) — agrupa uma ou mais Áreas
- **Área** (nível intermediário) — pertence a uma Diretoria, agrupa uma ou mais Especialidades
- **Especialidade** (nível inferior) — pertence a uma Área, representa a especialização técnica/funcional

Os impactos abrangem: banco de dados (Supabase), tipos TypeScript, serviços, página de Áreas e página de Colaboradores.

---

## Glossary

- **Sistema**: A aplicação web de gestão de colaboradores (Alocatin).
- **Diretoria**: Entidade organizacional de nível superior que agrupa uma ou mais Áreas.
- **Area**: Entidade organizacional de nível intermediário, pertencente a uma Diretoria, que agrupa uma ou mais Especialidades. Corresponde à tabela `areas` já existente no banco.
- **Especialidade**: Entidade organizacional de nível inferior, pertencente a uma Área. Substitui o conceito de `subarea` livre (texto) por uma entidade gerenciada.
- **Colaborador**: Pessoa cadastrada no sistema, vinculada a uma Área e opcionalmente a uma Especialidade.
- **DiretoriaService**: Serviço responsável pelas operações CRUD de Diretorias.
- **EspecialidadeService**: Serviço responsável pelas operações CRUD de Especialidades.
- **AreaService**: Serviço responsável pelas operações CRUD de Áreas, já existente, a ser estendido.
- **ColaboradorService**: Serviço responsável pelas operações CRUD de Colaboradores, já existente, a ser estendido.
- **DiretoriaPage**: Página de gerenciamento de Diretorias (nova).
- **AreasPage**: Página de gerenciamento de Áreas, já existente, a ser estendida.
- **ColaboradoresPage**: Página de gerenciamento de Colaboradores, já existente, a ser estendida.

---

## Requirements

### Requirement 1: Gerenciamento de Diretorias

**User Story:** Como administrador, quero cadastrar, editar e excluir Diretorias, para que eu possa organizar as Áreas dentro de uma estrutura hierárquica superior.

#### Acceptance Criteria

1. THE Sistema SHALL persistir Diretorias na tabela `diretorias` do banco de dados Supabase, com os campos: `id` (UUID), `nome` (texto obrigatório), `descricao` (texto opcional), `created_at` e `updated_at`.
2. WHEN o administrador submete o formulário de criação com `nome` preenchido, THE DiretoriaService SHALL inserir o registro na tabela `diretorias` e retornar a entidade criada.
3. IF o administrador submete o formulário de criação com `nome` vazio, THEN THE Sistema SHALL exibir uma mensagem de validação indicando que o nome é obrigatório.
4. WHEN o administrador submete o formulário de edição com dados válidos, THE DiretoriaService SHALL atualizar o registro correspondente na tabela `diretorias`.
5. WHEN o administrador confirma a exclusão de uma Diretoria que possui Áreas vinculadas, THE Sistema SHALL impedir a exclusão e exibir uma mensagem informando que a Diretoria possui Áreas associadas.
6. WHEN o administrador confirma a exclusão de uma Diretoria sem Áreas vinculadas, THE DiretoriaService SHALL remover o registro da tabela `diretorias`.
7. THE DiretoriaPage SHALL exibir a lista de Diretorias cadastradas em ordem alfabética por nome.
8. WHEN o administrador busca por nome na DiretoriaPage, THE Sistema SHALL filtrar a lista exibindo apenas Diretorias cujo nome contenha o texto informado (case-insensitive).

---

### Requirement 2: Vinculação de Área a Diretoria

**User Story:** Como administrador, quero associar cada Área a uma Diretoria, para que a hierarquia organizacional seja refletida no sistema.

#### Acceptance Criteria

1. THE Sistema SHALL adicionar a coluna `diretoria_id` (UUID, FK para `diretorias.id`) na tabela `areas` do banco de dados.
2. WHEN o administrador abre o formulário de criação ou edição de uma Área, THE AreasPage SHALL exibir um campo de seleção com todas as Diretorias cadastradas.
3. WHEN o administrador submete o formulário de Área com uma Diretoria selecionada, THE AreaService SHALL persistir o `diretoria_id` correspondente na tabela `areas`.
4. IF o administrador submete o formulário de Área sem selecionar uma Diretoria, THEN THE Sistema SHALL exibir uma mensagem de validação indicando que a Diretoria é obrigatória.
5. THE AreasPage SHALL exibir o nome da Diretoria associada a cada Área na listagem.
6. WHEN o administrador filtra a listagem de Áreas por Diretoria, THE AreasPage SHALL exibir apenas as Áreas pertencentes à Diretoria selecionada.

---

### Requirement 3: Gerenciamento de Especialidades

**User Story:** Como administrador, quero cadastrar, editar e excluir Especialidades vinculadas a uma Área, para substituir o campo de subárea livre por entidades gerenciadas.

#### Acceptance Criteria

1. THE Sistema SHALL persistir Especialidades na tabela `especialidades` do banco de dados Supabase, com os campos: `id` (UUID), `nome` (texto obrigatório), `area_id` (UUID, FK para `areas.id`), `descricao` (texto opcional), `created_at` e `updated_at`.
2. WHEN o administrador submete o formulário de criação de Especialidade com `nome` e `area_id` preenchidos, THE EspecialidadeService SHALL inserir o registro na tabela `especialidades`.
3. IF o administrador submete o formulário de criação de Especialidade com `nome` vazio ou sem `area_id`, THEN THE Sistema SHALL exibir mensagens de validação para os campos ausentes.
4. WHEN o administrador confirma a exclusão de uma Especialidade que possui Colaboradores vinculados, THE Sistema SHALL impedir a exclusão e exibir uma mensagem informando que a Especialidade possui Colaboradores associados.
5. WHEN o administrador confirma a exclusão de uma Especialidade sem Colaboradores vinculados, THE EspecialidadeService SHALL remover o registro da tabela `especialidades`.
6. THE AreasPage SHALL exibir as Especialidades de cada Área na listagem, agrupadas por Área.
7. WHEN o administrador seleciona uma Área no formulário de Especialidade, THE Sistema SHALL exibir apenas as Especialidades pertencentes àquela Área.

---

### Requirement 4: Vinculação de Colaborador a Especialidade

**User Story:** Como administrador, quero associar cada Colaborador a uma Especialidade (dentro de sua Área), para substituir o campo de subárea livre por uma referência gerenciada.

#### Acceptance Criteria

1. THE Sistema SHALL adicionar a coluna `especialidade_id` (UUID, FK para `especialidades.id`, nullable) na tabela `colaboradores` do banco de dados.
2. WHEN o administrador abre o formulário de criação ou edição de um Colaborador e seleciona uma Área, THE ColaboradoresPage SHALL carregar e exibir apenas as Especialidades pertencentes à Área selecionada.
3. WHEN o administrador seleciona uma Área diferente no formulário de Colaborador, THE Sistema SHALL limpar a seleção de Especialidade anterior.
4. WHEN o administrador submete o formulário de Colaborador com uma Especialidade selecionada, THE ColaboradorService SHALL persistir o `especialidade_id` correspondente na tabela `colaboradores`.
5. THE ColaboradoresPage SHALL exibir o nome da Especialidade do Colaborador na coluna "Subárea" da listagem.
6. WHEN o administrador filtra a listagem de Colaboradores por Área, THE ColaboradoresPage SHALL exibir apenas os Colaboradores pertencentes à Área selecionada.
7. WHERE o campo `especialidade_id` for nulo, THE Sistema SHALL exibir "—" na coluna de Especialidade na listagem de Colaboradores.

---

### Requirement 5: Migração de Dados Existentes

**User Story:** Como administrador, quero que os dados existentes de Áreas e Colaboradores sejam preservados após a migração, para que não haja perda de informação.

#### Acceptance Criteria

1. THE Sistema SHALL executar uma migration SQL que adiciona as tabelas `diretorias` e `especialidades` sem remover ou alterar dados existentes nas tabelas `areas` e `colaboradores`.
2. THE Sistema SHALL adicionar a coluna `diretoria_id` na tabela `areas` como nullable, para que Áreas existentes não sejam invalidadas antes de serem associadas manualmente.
3. THE Sistema SHALL adicionar a coluna `especialidade_id` na tabela `colaboradores` como nullable, para que Colaboradores existentes não sejam invalidados.
4. WHEN a migration é aplicada, THE Sistema SHALL manter todos os registros existentes nas tabelas `areas` e `colaboradores` intactos.
5. THE Sistema SHALL criar os índices necessários nas colunas de FK (`diretoria_id`, `area_id`, `especialidade_id`) para garantir performance nas consultas de listagem e filtro.

---

### Requirement 6: Consistência de Navegação e UI

**User Story:** Como usuário, quero que a hierarquia organizacional seja visível e navegável na interface, para que eu entenda a estrutura da organização.

#### Acceptance Criteria

1. THE Sistema SHALL adicionar a DiretoriaPage ao menu de navegação lateral, acessível a partir da rota `/diretorias`.
2. THE AreasPage SHALL exibir um filtro por Diretoria na barra de filtros existente.
3. THE ColaboradoresPage SHALL exibir um filtro por Especialidade na barra de filtros existente.
4. WHEN o administrador acessa a DiretoriaPage, THE Sistema SHALL exibir a contagem de Áreas associadas a cada Diretoria na listagem.
5. THE AreasPage SHALL exibir a contagem de Especialidades associadas a cada Área na listagem.
