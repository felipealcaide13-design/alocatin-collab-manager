# Requirements Document

## Introduction

Esta funcionalidade permite que cada Business Unit (BU) configure quais campos de Liderança aparecem no modal de cadastro de Torre. Hoje os campos de liderança são fixos e hardcoded (Responsável pelo Negócio, Head de Tecnologia, Head de Produto, Gerente de Produto, Gerente de Design). Com esta feature, o administrador acessa uma aba de "Configuração" dentro da página de Business Units e define, por BU, quais campos de liderança existem, seus nomes, e os filtros de Senioridade e Diretoria que determinam quais colaboradores aparecem no select de cada campo.

## Glossary

- **BU (Business Unit)**: Unidade de negócio que agrupa Torres.
- **Torre**: Entidade organizacional vinculada a uma BU, cadastrada via modal.
- **Campo de Liderança**: Campo configurável no formulário de Torre que representa um papel de liderança (ex: "Head de Produto"). Cada campo possui nome, senioridade-filtro e diretoria-filtro.
- **Configuração de Torre**: Conjunto de campos de liderança definidos para uma BU específica, que determina o layout do formulário de cadastro de Torre para aquela BU.
- **Configuracao_Torre_Service**: Serviço responsável por persistir e recuperar as configurações de campos de Torre por BU.
- **TorreForm**: Componente de modal de cadastro/edição de Torre.
- **BU_Config_Page**: Aba de configuração dentro da página de Business Units.
- **Senioridade**: Nível hierárquico do colaborador (ex: Head, Gerente, C-level).
- **Diretoria**: Unidade organizacional à qual o colaborador pertence.

## Requirements

### Requirement 1: Aba de Configuração na Página de Business Units

**User Story:** Como administrador, quero acessar uma aba de configuração dentro da página de Business Units, para que eu possa personalizar os campos do formulário de Torre por BU.

#### Acceptance Criteria

1. THE BU_Config_Page SHALL exibir uma aba chamada "Configuração" na página de Business Units, ao lado das abas existentes (BUs, Torres, Squads, Hierarquia).
2. WHEN o usuário seleciona uma BU na aba de Configuração, THE BU_Config_Page SHALL carregar e exibir a configuração de campos de Torre associada àquela BU.
3. IF nenhuma BU estiver selecionada, THEN THE BU_Config_Page SHALL exibir uma mensagem orientando o usuário a selecionar uma BU.

---

### Requirement 2: Campos Fixos Obrigatórios

**User Story:** Como administrador, quero que Nome da Torre e Business Unit sejam sempre obrigatórios e não removíveis, para que toda Torre tenha identificação mínima garantida.

#### Acceptance Criteria

1. THE TorreForm SHALL sempre exibir o campo "Nome da Torre" como obrigatório, independentemente da configuração da BU.
2. THE TorreForm SHALL sempre exibir o campo "Business Unit" como obrigatório, independentemente da configuração da BU.
3. THE BU_Config_Page SHALL exibir os campos "Nome da Torre" e "Business Unit" como fixos e não editáveis na interface de configuração.

---

### Requirement 3: Campo Opcional de Descrição

**User Story:** Como administrador, quero poder habilitar ou desabilitar o campo Descrição no formulário de Torre, para que eu controle a verbosidade do cadastro.

#### Acceptance Criteria

1. THE BU_Config_Page SHALL exibir um toggle para habilitar ou desabilitar o campo "Descrição" no formulário de Torre da BU selecionada.
2. WHEN o campo "Descrição" estiver habilitado na configuração, THE TorreForm SHALL exibir o campo "Descrição" como opcional.
3. WHEN o campo "Descrição" estiver desabilitado na configuração, THE TorreForm SHALL ocultar o campo "Descrição".

---

### Requirement 4: Gerenciamento de Campos de Liderança Configuráveis

**User Story:** Como administrador, quero adicionar, editar e remover campos de liderança na configuração da BU, para que o formulário de Torre reflita a estrutura de liderança real de cada BU.

#### Acceptance Criteria

1. THE BU_Config_Page SHALL permitir que o usuário adicione um novo campo de liderança informando: nome do campo, senioridade-filtro e diretoria-filtro.
2. THE BU_Config_Page SHALL permitir que o usuário edite o nome, a senioridade-filtro e a diretoria-filtro de um campo de liderança existente.
3. THE BU_Config_Page SHALL permitir que o usuário remova um campo de liderança da configuração da BU.
4. THE BU_Config_Page SHALL exibir os campos de liderança configurados em uma lista ordenada, permitindo que o usuário reordene os campos via drag-and-drop ou botões de mover para cima/baixo.
5. WHEN o usuário tenta salvar um campo de liderança sem nome, THEN THE BU_Config_Page SHALL exibir uma mensagem de erro indicando que o nome é obrigatório.
6. WHEN o usuário tenta salvar um campo de liderança sem senioridade-filtro, THEN THE BU_Config_Page SHALL exibir uma mensagem de erro indicando que a senioridade é obrigatória.
7. WHEN o usuário tenta salvar um campo de liderança sem diretoria-filtro, THEN THE BU_Config_Page SHALL exibir uma mensagem de erro indicando que a diretoria é obrigatória.

---

### Requirement 5: Persistência da Configuração por BU

**User Story:** Como administrador, quero que a configuração de campos de Torre seja salva por BU, para que cada BU tenha sua própria estrutura de liderança.

#### Acceptance Criteria

1. WHEN o usuário salva a configuração de uma BU, THE Configuracao_Torre_Service SHALL persistir a lista de campos de liderança associada ao ID da BU.
2. WHEN o usuário acessa a configuração de uma BU já configurada, THE Configuracao_Torre_Service SHALL retornar a configuração salva para aquela BU.
3. THE Configuracao_Torre_Service SHALL armazenar para cada campo de liderança: identificador único, nome do campo, senioridade-filtro e diretoria-filtro.
4. WHEN uma BU não possui configuração salva, THE Configuracao_Torre_Service SHALL retornar uma configuração padrão vazia (sem campos de liderança, com Descrição desabilitada).

---

### Requirement 6: Aplicação da Configuração no Formulário de Torre

**User Story:** Como usuário, quero que o modal de cadastro de Torre exiba apenas os campos configurados para a BU selecionada, para que o formulário seja relevante para aquela BU.

#### Acceptance Criteria

1. WHEN o usuário seleciona uma BU no TorreForm, THE TorreForm SHALL carregar a configuração de campos de liderança daquela BU e renderizar dinamicamente os campos correspondentes.
2. WHEN uma BU possui campos de liderança configurados, THE TorreForm SHALL exibir cada campo como um select de colaboradores filtrado pela senioridade-filtro E pela diretoria-filtro definidos na configuração.
3. WHEN o usuário altera a BU selecionada no TorreForm, THE TorreForm SHALL limpar os valores dos campos de liderança anteriores e recarregar os campos da nova BU.
4. WHEN uma Torre está sendo editada e a BU possui configuração, THE TorreForm SHALL pré-preencher os campos de liderança com os valores salvos na Torre, desde que o colaborador ainda satisfaça os filtros da configuração.
5. WHEN uma BU não possui configuração de campos de liderança, THE TorreForm SHALL não exibir a seção de Liderança.

---

### Requirement 7: Filtragem de Colaboradores por Senioridade e Diretoria

**User Story:** Como usuário, quero que o select de cada campo de liderança exiba apenas colaboradores que atendem aos critérios configurados, para que eu selecione apenas pessoas elegíveis para aquele papel.

#### Acceptance Criteria

1. WHEN o TorreForm renderiza um campo de liderança, THE TorreForm SHALL filtrar os colaboradores exibindo apenas aqueles cuja senioridade seja igual à senioridade-filtro do campo E cuja diretoria_id seja igual à diretoria-filtro do campo.
2. WHEN nenhum colaborador satisfaz os filtros de um campo de liderança, THE TorreForm SHALL exibir o select vazio com a opção "Nenhum" disponível.
3. THE TorreForm SHALL exibir o nome completo do colaborador em cada opção do select de liderança.

---

### Requirement 8: Migração dos Campos Fixos para o Sistema Configurável

**User Story:** Como administrador, quero que os campos de liderança atuais (Responsável pelo Negócio, Head de Tecnologia, Head de Produto, Gerente de Produto, Gerente de Design) sejam substituídos pelo sistema configurável, para que não haja duplicidade de campos.

#### Acceptance Criteria

1. THE TorreForm SHALL remover os campos fixos de liderança (responsavel_negocio, head_tecnologia, head_produto, gerente_produto, gerente_design) do formulário estático.
2. THE Configuracao_Torre_Service SHALL oferecer uma função de migração que, para cada BU existente, cria uma configuração padrão com os cinco campos de liderança originais mapeados para suas respectivas senioridades e diretorias.
3. WHEN a migração é executada para uma BU que já possui configuração, THE Configuracao_Torre_Service SHALL preservar a configuração existente sem sobrescrevê-la.
