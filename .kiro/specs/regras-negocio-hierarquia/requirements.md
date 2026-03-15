# Requirements Document

## Introduction

Esta feature formaliza e implementa as regras de negócio de hierarquia organizacional do Alocatin. O sistema já possui a estrutura de dados (tabelas `diretorias`, `areas`, `especialidades`, `colaboradores`, `alocacoes`) e um trigger básico de validação. O objetivo é evoluir o backend com:

1. **Regras de senioridade e escopo de alocação** — cada nível de senioridade tem restrições precisas sobre em qual nó da hierarquia pode ser alocado.
2. **Cadeia de comando (reporte)** — validação de que o gestor imediato de um colaborador pertence a um nível de senioridade permitido.
3. **Inferência automática de caminho hierárquico** — dado um colaborador, o sistema deve retornar o caminho completo (Empresa → Diretoria → Área → Especialidade) e o gestor imediato.
4. **Schema de banco de dados revisado** — tabela `user_allocations` normalizada e funções SQL de validação e consulta recursiva.

A hierarquia de nós organizacionais é: **Empresa > Diretoria > Área > Especialidade**. Cada nó só enxerga seus filhos diretos.

---

## Glossary

- **Sistema**: A aplicação web de gestão de colaboradores Alocatin (backend Supabase + frontend React/TypeScript).
- **Empresa**: Nó raiz da hierarquia organizacional. Não possui entidade própria no banco; é representada implicitamente.
- **Diretoria**: Nó de nível 1 (L1). Tabela `diretorias`. Filho direto da Empresa.
- **Area**: Nó de nível 2 (L2). Tabela `areas`. Filho direto de uma Diretoria.
- **Especialidade**: Nó de nível 3 (L3). Tabela `especialidades`. Filha direta de uma Área.
- **Colaborador**: Pessoa cadastrada no sistema. Tabela `colaboradores`. Possui um campo `senioridade` do tipo `senioridade_enum`.
- **Senioridade**: Classificação hierárquica do Colaborador. Valores: `C-level`, `Diretor(a)`, `Head`, `Gerente`, `Coordenador(a)`, `Staf I`, `Staf II`, `Analista senior`, `Analista pleno`, `Analista junior`.
- **Alocacao**: Registro que vincula um Colaborador a um nó organizacional. Tabela `alocacoes`. Possui campo `scope` (`especialidade`, `area`, `diretoria`).
- **Scope**: Nível do nó ao qual o Colaborador está alocado. Determinado pela senioridade.
- **Gestor_Imediato**: Colaborador de senioridade superior que responde diretamente por outro Colaborador, conforme a cadeia de comando definida.
- **Caminho_Hierarquico**: Sequência ordenada de nós organizacionais desde a Empresa até o nó de alocação do Colaborador (ex: `Empresa > Diretoria X > Área Y > Especialidade Z`).
- **ValidacaoAlocacao**: Função de banco de dados (`validate_alocacao`) responsável por garantir que a alocação respeita as regras de senioridade e escopo.
- **FuncaoCaminho**: Função de banco de dados (`get_caminho_colaborador`) que retorna o Caminho_Hierarquico e o Gestor_Imediato de um Colaborador.
- **FuncaoSubordinados**: Função de banco de dados (`get_subordinados`) que retorna os subordinados diretos de um gestor.
- **ViewAlocacoesExpandidas**: View `alocacoes_expandidas` que desnormaliza os dados de alocação com os nomes dos nós pai.

---

## Requirements

### Requirement 1: Estrutura de Nós Hierárquicos (Org Nodes)

**User Story:** Como administrador, quero que a hierarquia organizacional seja representada como uma árvore estrita de nós, para que cada entidade só possa conter filhos do nível imediatamente inferior.

#### Acceptance Criteria

1. THE Sistema SHALL garantir que cada Especialidade esteja vinculada a exatamente uma Área, por meio da FK `especialidade.area_id NOT NULL`.
2. THE Sistema SHALL garantir que cada Área esteja vinculada a exatamente uma Diretoria, por meio da FK `area.diretoria_id NOT NULL`.
3. WHEN uma Especialidade é consultada, THE Sistema SHALL retornar o `area_id` da Especialidade e o `diretoria_id` da Área pai, permitindo reconstruir o caminho completo.
4. IF uma operação tenta vincular uma Especialidade a uma Área que pertence a uma Diretoria diferente da Diretoria esperada, THEN THE Sistema SHALL rejeitar a operação com erro de integridade referencial.
5. THE Sistema SHALL garantir que nenhum nó de nível L2 (Área) seja filho direto de outro nó L2 — a FK `area.diretoria_id` deve referenciar exclusivamente a tabela `diretorias`.
6. THE Sistema SHALL garantir que nenhum nó de nível L3 (Especialidade) seja filho direto de outro nó L3 — a FK `especialidade.area_id` deve referenciar exclusivamente a tabela `areas`.

---

### Requirement 2: Regras de Senioridade e Escopo de Alocação

**User Story:** Como administrador, quero que o sistema valide automaticamente o escopo de alocação de cada colaborador conforme sua senioridade, para que as regras de negócio sejam aplicadas de forma consistente.

#### Acceptance Criteria

1. WHEN uma Alocacao é inserida ou atualizada para um Colaborador com senioridade `C-level`, THEN THE ValidacaoAlocacao SHALL rejeitar a operação, pois C-level possui escopo global implícito e não deve ter alocações específicas.
2. WHEN uma Alocacao é inserida para um Colaborador com senioridade `Diretor(a)`, THE ValidacaoAlocacao SHALL aceitar apenas registros com `scope IN ('area', 'diretoria')`.
3. IF uma Alocacao com `scope = 'especialidade'` é inserida para um Colaborador com senioridade `Diretor(a)`, THEN THE ValidacaoAlocacao SHALL rejeitar a operação com mensagem descritiva.
4. WHEN uma Alocacao é inserida para um Colaborador com senioridade `Head` ou `Gerente`, THE ValidacaoAlocacao SHALL aceitar apenas registros com `scope = 'area'`.
5. IF uma Alocacao com `scope <> 'area'` é inserida para um Colaborador com senioridade `Head` ou `Gerente`, THEN THE ValidacaoAlocacao SHALL rejeitar a operação com mensagem descritiva.
6. WHEN uma Alocacao é inserida para um Colaborador com senioridade `Coordenador(a)`, THE ValidacaoAlocacao SHALL aceitar apenas registros com `scope = 'area'`.
7. WHEN uma Alocacao é inserida para um Colaborador com senioridade `Analista junior`, `Analista pleno` ou `Analista senior`, THE ValidacaoAlocacao SHALL aceitar apenas registros com `scope = 'especialidade'`.
8. IF uma Alocacao com `scope <> 'especialidade'` é inserida para um Colaborador com senioridade `Analista junior`, `Analista pleno` ou `Analista senior`, THEN THE ValidacaoAlocacao SHALL rejeitar a operação com mensagem descritiva.
9. WHEN uma Alocacao é inserida para um Colaborador com senioridade `Staf I` ou `Staf II`, THE ValidacaoAlocacao SHALL aceitar registros com `scope IN ('area', 'diretoria')`.
10. IF uma Alocacao com `scope = 'especialidade'` é inserida para um Colaborador com senioridade `Staf I` ou `Staf II`, THEN THE ValidacaoAlocacao SHALL rejeitar a operação com mensagem descritiva.
11. WHEN uma Alocacao com `scope = 'especialidade'` é inserida para um Colaborador IC (Analista junior, Analista pleno ou Analista senior), THE ValidacaoAlocacao SHALL verificar que o Colaborador não possui outra Alocacao existente e rejeitar a inserção caso já exista uma, garantindo exatamente 1 alocação por IC.
12. THE Sistema SHALL inferir automaticamente a Área e a Diretoria pai de um Colaborador IC a partir da Especialidade alocada, sem exigir inserção manual dessas FKs na tabela `alocacoes`.

---

### Requirement 3: Cadeia de Comando (Reporte)

**User Story:** Como administrador, quero que o sistema valide e consulte a cadeia de reporte entre colaboradores, para que a estrutura de gestão seja consistente com as regras de negócio.

#### Acceptance Criteria

1. THE Sistema SHALL definir as seguintes relações de reporte permitidas:
   - `Analista junior`, `Analista pleno`, `Analista senior` reportam a `Coordenador(a)` ou `Gerente`.
   - `Coordenador(a)` reporta a `Head` ou `Gerente`.
   - `Gerente` reporta a `Head` ou `Diretor(a)`.
   - `Head` reporta a `Diretor(a)` ou `C-level`.
   - `Staf I` e `Staf II` reportam a `Head`, `Gerente` ou `Diretor(a)`.
2. WHEN a FuncaoSubordinados é chamada com o `id` de um Colaborador com senioridade `C-level`, THE FuncaoSubordinados SHALL retornar todos os Colaboradores da organização exceto o próprio C-level.
3. WHEN a FuncaoSubordinados é chamada com o `id` de um Colaborador com senioridade `Diretor(a)`, THE FuncaoSubordinados SHALL retornar todos os Colaboradores alocados nas Áreas e Diretorias sob gestão do Diretor.
4. WHEN a FuncaoSubordinados é chamada com o `id` de um Colaborador com senioridade `Head`, `Gerente` ou `Coordenador(a)`, THE FuncaoSubordinados SHALL retornar os Colaboradores alocados nas Especialidades pertencentes às Áreas sob gestão do gestor.
5. WHEN a FuncaoSubordinados é chamada com o `id` de um Colaborador IC (Analista ou Staf), THE FuncaoSubordinados SHALL retornar um conjunto vazio, pois ICs não possuem subordinados.
6. IF a FuncaoSubordinados é chamada com um `id` que não existe na tabela `colaboradores`, THEN THE FuncaoSubordinados SHALL lançar uma exceção com mensagem indicando que o Colaborador não foi encontrado.

---

### Requirement 4: Inferência e Consulta do Caminho Hierárquico

**User Story:** Como desenvolvedor, quero uma função SQL que, dado um colaborador, retorne o caminho hierárquico completo e o gestor imediato, para que o frontend possa exibir essas informações sem lógica adicional.

#### Acceptance Criteria

1. WHEN a FuncaoCaminho é chamada com o `id` de um Colaborador IC (Analista), THE FuncaoCaminho SHALL retornar o caminho `[Empresa > Diretoria > Área > Especialidade]` inferido a partir da Especialidade alocada.
2. WHEN a FuncaoCaminho é chamada com o `id` de um Colaborador com senioridade `Head`, `Gerente` ou `Coordenador(a)`, THE FuncaoCaminho SHALL retornar o caminho `[Empresa > Diretoria > Área]` para cada Área alocada.
3. WHEN a FuncaoCaminho é chamada com o `id` de um Colaborador com senioridade `Diretor(a)`, THE FuncaoCaminho SHALL retornar o caminho `[Empresa > Diretoria]` para cada Diretoria ou Área alocada.
4. WHEN a FuncaoCaminho é chamada com o `id` de um Colaborador com senioridade `C-level`, THE FuncaoCaminho SHALL retornar o caminho `[Empresa]`.
5. THE FuncaoCaminho SHALL retornar o Gestor_Imediato do Colaborador, identificado como o Colaborador de senioridade imediatamente superior alocado no mesmo nó ou no nó pai mais próximo.
6. IF a FuncaoCaminho é chamada com um `id` que não existe na tabela `colaboradores`, THEN THE FuncaoCaminho SHALL retornar um conjunto vazio sem lançar exceção.
7. THE FuncaoCaminho SHALL retornar os campos: `colaborador_id`, `nome_completo`, `senioridade`, `caminho` (array de texto), `gestor_id` (UUID nullable), `gestor_nome` (texto nullable), `gestor_senioridade` (senioridade_enum nullable).

---

### Requirement 5: View Desnormalizada de Alocações

**User Story:** Como desenvolvedor, quero uma view SQL que expanda os dados de alocação com os nomes dos nós pai, para simplificar as queries do frontend.

#### Acceptance Criteria

1. THE ViewAlocacoesExpandidas SHALL expor os campos: `alocacao_id`, `colaborador_id`, `nome_completo`, `senioridade`, `scope`, `especialidade_id`, `especialidade_nome`, `area_id`, `area_nome`, `diretoria_id`, `diretoria_nome`.
2. WHEN o `scope` de uma Alocacao é `especialidade`, THE ViewAlocacoesExpandidas SHALL preencher `especialidade_nome`, `area_nome` e `diretoria_nome` por meio de JOINs transitivos (Especialidade → Área → Diretoria).
3. WHEN o `scope` de uma Alocacao é `area`, THE ViewAlocacoesExpandidas SHALL preencher `area_nome` e `diretoria_nome`, deixando `especialidade_nome` como NULL.
4. WHEN o `scope` de uma Alocacao é `diretoria`, THE ViewAlocacoesExpandidas SHALL preencher apenas `diretoria_nome`, deixando `especialidade_nome` e `area_nome` como NULL.
5. THE ViewAlocacoesExpandidas SHALL ser atualizada automaticamente sempre que os dados das tabelas `alocacoes`, `especialidades`, `areas` ou `diretorias` forem modificados, por ser uma view (não materializada).

---

### Requirement 6: Integridade Referencial e Consistência de Dados

**User Story:** Como administrador, quero que o banco de dados impeça estados inválidos na hierarquia, para que os dados sejam sempre consistentes.

#### Acceptance Criteria

1. THE Sistema SHALL garantir que a combinação `(colaborador_id, especialidade_id)` seja única na tabela `alocacoes`, impedindo alocações duplicadas na mesma Especialidade.
2. THE Sistema SHALL garantir que a combinação `(colaborador_id, area_id)` seja única na tabela `alocacoes`, impedindo alocações duplicadas na mesma Área.
3. THE Sistema SHALL garantir que a combinação `(colaborador_id, diretoria_id)` seja única na tabela `alocacoes`, impedindo alocações duplicadas na mesma Diretoria.
4. WHEN uma Especialidade é excluída, THE Sistema SHALL remover em cascata todas as Alocacoes com `especialidade_id` referenciando essa Especialidade.
5. WHEN uma Área é excluída, THE Sistema SHALL remover em cascata todas as Especialidades filhas e, consequentemente, as Alocacoes dependentes.
6. WHEN uma Diretoria é excluída, THE Sistema SHALL remover em cascata todas as Áreas filhas e, consequentemente, as Especialidades e Alocacoes dependentes.
7. IF uma Alocacao é inserida com `scope = 'especialidade'` mas `especialidade_id = NULL`, THEN THE Sistema SHALL rejeitar a operação via constraint `chk_scope_especialidade`.
8. IF uma Alocacao é inserida com `scope = 'area'` mas `area_id = NULL`, THEN THE Sistema SHALL rejeitar a operação via constraint `chk_scope_area`.
9. IF uma Alocacao é inserida com `scope = 'diretoria'` mas `diretoria_id = NULL`, THEN THE Sistema SHALL rejeitar a operação via constraint `chk_scope_diretoria`.

---

### Requirement 7: Parser e Serialização de Dados Hierárquicos

**User Story:** Como desenvolvedor, quero que os dados hierárquicos sejam serializados e desserializados de forma consistente entre o banco de dados e o frontend TypeScript, para evitar inconsistências de representação.

#### Acceptance Criteria

1. THE Sistema SHALL serializar os dados de um Colaborador com suas alocações em um objeto TypeScript `ColaboradorComAlocacoes` que inclua os campos `alocacoes` (array), `caminho_hierarquico` (array de strings) e `gestor_imediato` (objeto nullable).
2. WHEN um objeto `ColaboradorComAlocacoes` é serializado para JSON e desserializado de volta, THE Sistema SHALL produzir um objeto equivalente ao original (propriedade de round-trip).
3. THE Sistema SHALL formatar o `caminho_hierarquico` como um array de strings no formato `["Empresa", "<nome_diretoria>", "<nome_area>", "<nome_especialidade>"]`, omitindo os níveis não aplicáveis conforme o scope.
4. WHEN o `caminho_hierarquico` é formatado e depois parseado de volta para os IDs dos nós, THE Sistema SHALL recuperar os mesmos `diretoria_id`, `area_id` e `especialidade_id` originais (round-trip de caminho).

