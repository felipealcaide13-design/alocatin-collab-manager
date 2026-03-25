# Requirements Document

## Introduction

Atualmente, o campo personalizado de liderança (`CampoLiderancaConfig`) permite selecionar apenas uma senioridade e uma diretoria para filtrar os colaboradores elegíveis. Esta feature expande esse filtro para suportar múltiplas senioridades e múltiplas diretorias, tornando a configuração mais flexível. A mudança afeta o formulário de configuração (`CampoLiderancaForm`), o tipo `CampoLiderancaConfig`, e os formulários de preenchimento (`TorreForm` e `BusinessUnitForm`) que usam esses filtros para exibir colaboradores elegíveis.

## Glossary

- **CampoLiderancaConfig**: Estrutura de dados que define um campo de liderança personalizado, incluindo nome, filtros de senioridade e diretoria, e ordem de exibição.
- **CampoLiderancaForm**: Formulário inline usado na aba de configuração de BU/Torre para criar ou editar um `CampoLiderancaConfig`.
- **BUTorreConfigTab**: Componente de aba que gerencia a configuração de campos de liderança para BU e Torre.
- **TorreForm**: Formulário de criação/edição de Torre que exibe campos de liderança dinâmicos com colaboradores filtrados.
- **BusinessUnitForm**: Formulário de criação/edição de BU que exibe campos de liderança dinâmicos com colaboradores filtrados.
- **LiderancaSection**: Subcomponente de `BUTorreConfigTab` que gerencia a lista de campos de liderança.
- **Colaborador_Elegivel**: Colaborador cujos atributos `senioridade` e `diretoria_id` satisfazem os filtros configurados no `CampoLiderancaConfig`.
- **Filtro_Senioridade**: Lista de senioridades aceitas para um campo de liderança; vazia significa "qualquer senioridade".
- **Filtro_Diretoria**: Lista de IDs de diretorias aceitas para um campo de liderança; vazia significa "qualquer diretoria".

## Requirements

### Requirement 1: Modelo de dados com múltiplas senioridades e diretorias

**User Story:** Como administrador, quero configurar um campo de liderança com múltiplas senioridades e múltiplas diretorias, para que o filtro de colaboradores elegíveis seja mais abrangente e flexível.

#### Acceptance Criteria

1. THE Sistema SHALL substituir o campo `senioridade: string` de `CampoLiderancaConfig` por `senioridades: string[]`.
2. THE Sistema SHALL substituir o campo `diretoria_id: string` de `CampoLiderancaConfig` por `diretoria_ids: string[]`.
3. WHEN `senioridades` é um array vazio, THE Sistema SHALL tratar o filtro de senioridade como "qualquer senioridade" (sem restrição).
4. WHEN `diretoria_ids` é um array vazio, THE Sistema SHALL tratar o filtro de diretoria como "qualquer diretoria" (sem restrição).
5. THE Sistema SHALL manter retrocompatibilidade na leitura de configurações salvas com os campos legados `senioridade` e `diretoria_id` (string simples), convertendo-os para arrays de um elemento.

### Requirement 2: Formulário de configuração com seleção múltipla

**User Story:** Como administrador, quero selecionar múltiplas senioridades e múltiplas diretorias ao criar ou editar um campo de liderança, para que eu possa definir filtros compostos sem precisar criar campos duplicados.

#### Acceptance Criteria

1. WHEN o usuário abre o `CampoLiderancaForm`, THE Formulario SHALL exibir um controle de seleção múltipla para senioridades com todas as opções do enum `senioridade_enum`.
2. WHEN o usuário abre o `CampoLiderancaForm`, THE Formulario SHALL exibir um controle de seleção múltipla para diretorias com todas as diretorias disponíveis.
3. THE Formulario SHALL permitir que o usuário selecione zero ou mais senioridades.
4. THE Formulario SHALL permitir que o usuário selecione zero ou mais diretorias.
5. WHEN o usuário tenta salvar um campo com `nome` vazio, THE Formulario SHALL exibir mensagem de erro inline e bloquear o envio.
6. WHEN o usuário edita um campo existente, THE Formulario SHALL pré-selecionar as senioridades e diretorias já configuradas.
7. THE Formulario SHALL exibir as senioridades selecionadas como badges ou chips visíveis dentro do controle de seleção.
8. THE Formulario SHALL exibir as diretorias selecionadas como badges ou chips visíveis dentro do controle de seleção.

### Requirement 3: Exibição do resumo do campo na lista de configuração

**User Story:** Como administrador, quero ver um resumo legível das senioridades e diretorias configuradas na lista de campos de liderança, para que eu possa identificar rapidamente o filtro de cada campo.

#### Acceptance Criteria

1. WHEN um campo de liderança tem uma ou mais senioridades configuradas, THE LiderancaSection SHALL exibir os nomes das senioridades separados por vírgula no resumo do card.
2. WHEN um campo de liderança tem `senioridades` vazio, THE LiderancaSection SHALL exibir "Qualquer senioridade" no resumo do card.
3. WHEN um campo de liderança tem uma ou mais diretorias configuradas, THE LiderancaSection SHALL exibir os nomes das diretorias separados por vírgula no resumo do card.
4. WHEN um campo de liderança tem `diretoria_ids` vazio, THE LiderancaSection SHALL exibir "Qualquer diretoria" no resumo do card.

### Requirement 4: Filtragem de colaboradores elegíveis nos formulários de preenchimento

**User Story:** Como usuário, quero que os selects de liderança no `TorreForm` e `BusinessUnitForm` exibam apenas colaboradores que satisfaçam todos os filtros configurados, para que eu não selecione um colaborador inelegível.

#### Acceptance Criteria

1. WHEN `TorreForm` renderiza um campo de liderança, THE TorreForm SHALL filtrar colaboradores cujo `senioridade` esteja contido em `campo.senioridades`, ou exibir todos se `senioridades` for vazio.
2. WHEN `TorreForm` renderiza um campo de liderança, THE TorreForm SHALL filtrar colaboradores cujo `diretoria_id` esteja contido em `campo.diretoria_ids`, ou exibir todos se `diretoria_ids` for vazio.
3. WHEN `BusinessUnitForm` renderiza um campo de liderança, THE BusinessUnitForm SHALL filtrar colaboradores cujo `senioridade` esteja contido em `campo.senioridades`, ou exibir todos se `senioridades` for vazio.
4. WHEN `BusinessUnitForm` renderiza um campo de liderança, THE BusinessUnitForm SHALL filtrar colaboradores cujo `diretoria_id` esteja contido em `campo.diretoria_ids`, ou exibir todos se `diretoria_ids` for vazio.
5. WHEN ambos os filtros (`senioridades` e `diretoria_ids`) são não-vazios, THE Sistema SHALL aplicar os dois filtros com lógica AND (colaborador deve satisfazer senioridade E diretoria).

### Requirement 5: Retrocompatibilidade na leitura de dados persistidos

**User Story:** Como sistema, quero que configurações salvas com o formato antigo (campos `senioridade` e `diretoria_id` como strings) continuem funcionando após a migração, para que dados existentes não sejam corrompidos.

#### Acceptance Criteria

1. WHEN o serviço `configuracaoTorreService` lê uma configuração com `senioridade: string` no JSON, THE Servico SHALL converter para `senioridades: [senioridade]` antes de retornar ao componente.
2. WHEN o serviço `configuracaoBUService` lê uma configuração com `diretoria_id: string` no JSON, THE Servico SHALL converter para `diretoria_ids: [diretoria_id]` antes de retornar ao componente.
3. WHEN `senioridade` ou `diretoria_id` legados são strings vazias, THE Servico SHALL converter para arrays vazios `[]`.
4. THE Sistema SHALL persistir novos campos sempre no formato de arrays (`senioridades`, `diretoria_ids`), nunca no formato legado de string.
