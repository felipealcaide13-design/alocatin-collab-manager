# Requirements Document

## Introduction

Esta feature implementa as regras de senioridade por camada organizacional no sistema de gestão de RH Alocatin. O sistema possui a hierarquia: **BU (Business Unit) > Torre > Squad**. Cada nível de senioridade tem restrições precisas sobre em qual camada pode ser alocado. Essas regras devem ser aplicadas tanto na validação de cadastro/edição de colaboradores quanto na exibição hierárquica nas visualizações de Business Units.

A tabela de regras é:

| Senioridade         | Camadas permitidas       |
|---------------------|--------------------------|
| C-level             | BU apenas                |
| Diretor(a)          | BU e/ou Torre            |
| Head                | Torre apenas             |
| Gerente             | Torre apenas             |
| Coordenador(a)      | Torre e/ou Squad         |
| Staf I              | Torre e/ou Squad         |
| Staf II             | Torre e/ou Squad         |
| Analista senior     | Torre e/ou Squad         |
| Analista pleno      | Squad apenas             |
| Analista junior     | Squad apenas             |

---

## Glossary

- **Sistema**: A aplicação web de gestão de colaboradores Alocatin (frontend React/TypeScript + backend Supabase).
- **BU**: Business Unit — camada organizacional de nível 1. Tabela `business_units`. Nó raiz da hierarquia visível.
- **Torre**: Camada organizacional de nível 2. Tabela `torres`. Filha de uma BU.
- **Squad**: Camada organizacional de nível 3. Tabela `squads`. Filha de uma Torre.
- **Colaborador**: Pessoa cadastrada no sistema. Tabela `colaboradores`. Possui campo `senioridade`.
- **Senioridade**: Classificação hierárquica do Colaborador. Valores: `C-level`, `Diretor(a)`, `Head`, `Gerente`, `Coordenador(a)`, `Staf I`, `Staf II`, `Analista senior`, `Analista pleno`, `Analista junior`.
- **Camada**: Nível organizacional ao qual um Colaborador pode ser alocado: `BU`, `Torre` ou `Squad`.
- **Regra_Senioridade**: Conjunto de camadas permitidas para uma determinada senioridade, conforme tabela de referência desta feature.
- **ValidadorSenioridade**: Módulo TypeScript responsável por verificar se a combinação senioridade × camadas de alocação é válida.
- **FormularioColaborador**: Componente `ColaboradorForm` que exibe e valida os campos de alocação de um colaborador.
- **VisualizacaoBU**: Componente `BUOrgChart` e página `BusinessUnits` que exibem a hierarquia organizacional com colaboradores por camada.

---

## Requirements

### Requirement 1: Regras de Senioridade por Camada — Definição e Validação

**User Story:** Como administrador, quero que o sistema valide automaticamente as camadas de alocação de cada colaborador conforme sua senioridade, para que as regras de negócio sejam aplicadas de forma consistente no cadastro e edição.

#### Acceptance Criteria

1. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `C-level` só podem ser alocados na camada `BU`, sendo vedada a alocação em `Torre` ou `Squad`.
2. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Diretor(a)` podem ser alocados nas camadas `BU` e/ou `Torre`, sendo vedada a alocação exclusiva em `Squad`.
3. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Head` só podem ser alocados na camada `Torre`, sendo vedada a alocação em `BU` ou `Squad`.
4. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Gerente` só podem ser alocados na camada `Torre`, sendo vedada a alocação em `BU` ou `Squad`.
5. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Coordenador(a)` podem ser alocados nas camadas `Torre` e/ou `Squad`, sendo vedada a alocação exclusiva em `BU`.
6. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Staf I` podem ser alocados nas camadas `Torre` e/ou `Squad`, sendo vedada a alocação exclusiva em `BU`.
7. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Staf II` podem ser alocados nas camadas `Torre` e/ou `Squad`, sendo vedada a alocação exclusiva em `BU`.
8. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Analista senior` podem ser alocados nas camadas `Torre` e/ou `Squad`, sendo vedada a alocação exclusiva em `BU`.
9. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Analista pleno` só podem ser alocados na camada `Squad`, sendo vedada a alocação em `BU` ou `Torre`.
10. THE ValidadorSenioridade SHALL definir que colaboradores com senioridade `Analista junior` só podem ser alocados na camada `Squad`, sendo vedada a alocação em `BU` ou `Squad`.
11. WHEN uma tentativa de salvar um Colaborador é feita com camadas de alocação incompatíveis com a senioridade, THE ValidadorSenioridade SHALL retornar uma mensagem de erro descritiva indicando quais camadas são permitidas para aquela senioridade.
12. THE ValidadorSenioridade SHALL expor uma função pura `validarCamadasPorSenioridade(senioridade, camadas)` que retorna `{ valido: boolean, mensagem?: string }` sem efeitos colaterais.

---

### Requirement 2: Aplicação no Formulário de Colaboradores

**User Story:** Como administrador, quero que o formulário de cadastro e edição de colaboradores exiba apenas as camadas permitidas para a senioridade selecionada, para evitar alocações inválidas.

#### Acceptance Criteria

1. WHEN a senioridade é alterada no FormularioColaborador, THE FormularioColaborador SHALL recalcular e exibir apenas os campos de camada compatíveis com a nova senioridade selecionada.
2. WHEN a senioridade selecionada é `C-level`, THE FormularioColaborador SHALL exibir apenas o campo de seleção de `BU` e ocultar os campos de `Torre` e `Squad`.
3. WHEN a senioridade selecionada é `Diretor(a)`, THE FormularioColaborador SHALL exibir os campos de `BU` e `Torre` e ocultar o campo de `Squad`.
4. WHEN a senioridade selecionada é `Head` ou `Gerente`, THE FormularioColaborador SHALL exibir apenas o campo de seleção de `Torre` e ocultar os campos de `BU` e `Squad`.
5. WHEN a senioridade selecionada é `Coordenador(a)`, `Staf I`, `Staf II` ou `Analista senior`, THE FormularioColaborador SHALL exibir os campos de `Torre` e `Squad` e ocultar o campo de `BU`.
6. WHEN a senioridade selecionada é `Analista pleno` ou `Analista junior`, THE FormularioColaborador SHALL exibir apenas o campo de seleção de `Squad` e ocultar os campos de `BU` e `Torre`.
7. WHEN a senioridade é alterada no FormularioColaborador, THE FormularioColaborador SHALL limpar os valores previamente selecionados nos campos de camada que se tornaram inválidos ou ocultos.
8. WHEN o formulário é submetido com campos de camada obrigatórios vazios para a senioridade selecionada, THE FormularioColaborador SHALL exibir mensagem de validação indicando qual camada é obrigatória.
9. IF um Colaborador existente tem alocações em camadas incompatíveis com sua senioridade atual, THEN THE FormularioColaborador SHALL exibir um aviso ao abrir o formulário de edição indicando a inconsistência.

---

### Requirement 3: Aplicação na Visualização de Business Units

**User Story:** Como gestor, quero que a visualização hierárquica de Business Units exiba os colaboradores respeitando as regras de senioridade por camada, para que o organograma reflita a estrutura real.

#### Acceptance Criteria

1. WHEN a VisualizacaoBU renderiza um nó de camada `BU`, THE VisualizacaoBU SHALL exibir apenas colaboradores com senioridade `C-level` ou `Diretor(a)` associados àquela BU.
2. WHEN a VisualizacaoBU renderiza um nó de camada `Torre`, THE VisualizacaoBU SHALL exibir apenas colaboradores com senioridade `Diretor(a)`, `Head`, `Gerente`, `Coordenador(a)`, `Staf I`, `Staf II` ou `Analista senior` associados àquela Torre.
3. WHEN a VisualizacaoBU renderiza um nó de camada `Squad`, THE VisualizacaoBU SHALL exibir apenas colaboradores com senioridade `Coordenador(a)`, `Staf I`, `Staf II`, `Analista senior`, `Analista pleno` ou `Analista junior` associados àquele Squad.
4. THE VisualizacaoBU SHALL filtrar colaboradores por camada usando a mesma lógica do ValidadorSenioridade, garantindo consistência entre validação e exibição.
5. WHEN um colaborador está alocado em múltiplas camadas permitidas para sua senioridade (ex: Diretor(a) em BU e Torre), THE VisualizacaoBU SHALL exibir o colaborador em cada camada onde está alocado.
6. IF um colaborador possui alocações em camadas incompatíveis com sua senioridade (dado inconsistente), THEN THE VisualizacaoBU SHALL omitir esse colaborador do nó incompatível e exibi-lo apenas nos nós compatíveis.

---

### Requirement 4: Consistência e Manutenibilidade das Regras

**User Story:** Como desenvolvedor, quero que as regras de senioridade por camada sejam definidas em um único lugar no código, para que alterações futuras sejam aplicadas de forma consistente em todo o sistema.

#### Acceptance Criteria

1. THE Sistema SHALL centralizar a definição das regras de senioridade por camada em um único módulo TypeScript (`src/utils/senioridadeCamadas.ts`), evitando duplicação de lógica entre formulário e visualização.
2. THE ValidadorSenioridade SHALL ser implementado como funções puras sem dependências de estado externo, permitindo uso tanto no frontend quanto em testes unitários.
3. THE Sistema SHALL exportar do módulo central uma constante `REGRAS_SENIORIDADE_CAMADA` do tipo `Record<Senioridade, Camada[]>` que mapeia cada senioridade para suas camadas permitidas.
4. WHEN o módulo central é importado, THE Sistema SHALL disponibilizar as funções: `getCamadasPermitidas(senioridade)`, `validarCamadasPorSenioridade(senioridade, camadas)` e `isCamadaPermitida(senioridade, camada)`.
5. THE Sistema SHALL garantir que todas as 10 senioridades definidas no enum `senioridade_enum` possuam entradas correspondentes em `REGRAS_SENIORIDADE_CAMADA`, sem omissões.

---

### Requirement 5: Parser e Serialização das Regras

**User Story:** Como desenvolvedor, quero que as regras de senioridade por camada possam ser serializadas e desserializadas de forma consistente, para suportar persistência de configuração e testes de propriedade.

#### Acceptance Criteria

1. THE Sistema SHALL serializar o mapa `REGRAS_SENIORIDADE_CAMADA` para JSON e desserializar de volta produzindo um objeto equivalente ao original (propriedade de round-trip).
2. WHEN uma entrada de `REGRAS_SENIORIDADE_CAMADA` é serializada para JSON e desserializada, THE Sistema SHALL preservar a ordem e os valores do array de camadas permitidas.
3. THE Sistema SHALL expor uma função `parsearRegrasSenioridade(json: string)` que valida e converte uma string JSON para o tipo `Record<Senioridade, Camada[]>`, retornando erro descritivo para entradas inválidas.
4. IF a função `parsearRegrasSenioridade` recebe uma string JSON com senioridade desconhecida, THEN THE Sistema SHALL retornar um erro indicando qual senioridade é inválida.
5. IF a função `parsearRegrasSenioridade` recebe uma string JSON com camada desconhecida, THEN THE Sistema SHALL retornar um erro indicando qual camada é inválida.

