# Formify (2026-Team-D)
## Sistema de Gestão de Formulários e Workflows

Projeto desenvolvido no âmbito de contexto académico/empresarial, desenhado para modernizar e digitalizar processos burocráticos. O projeto foi conduzido com metodologias ágeis (**SCRUM**) e a gestão de tarefas foi orquestrada no **GitHub Projects**.

O **Formify** é uma plataforma *full-stack* que interliga a criação dinâmica de formulários com um robusto motor de workflows, garantindo a gestão ponta-a-ponta de processos e submissões.

---

## Objetivo e Visão Geral

Desenvolver um sistema centralizado e inteligente que permita:

- **Construção Dinâmica:** Criação e gestão de formulários customizáveis por administradores, suportando rascunhos (*drafts*) e múltiplos tipos de campos.
- **Segmentação de Público:** Publicação de formulários direcionados a perfis específicos dentro da instituição.
- **Submissão Descomplicada:** Preenchimento e envio de processos de forma intuitiva pelos utilizadores finais.
- **Motor de Workflows:** Associação de estados e ciclos de vida aos formulários.
- **Gestão de Estados:** Aprovação, rejeição, devolução para correção e consulta em tempo real do estado dos processos submetidos.

---

## Perfis de Utilizador e Portais

O sistema foi arquitetado em torno de um modelo de permissões baseado em papéis (Role-Based Access Control), garantindo interfaces personalizadas:

- **Administrador:** Acesso ao *Admin Dashboard*, com privilégios para criar formulários (`CreateForm`), gerir rascunhos (`DraftedForms`) e orquestrar os workflows globais.
- **Aluno:** Portal dedicado para visualização dos formulários disponíveis para estudantes, submissão de processos e acompanhamento na área pessoal (`MySubmissions`).
- **Professor:** Portal com formulários e permissões específicas para o corpo docente.
- **Funcionário:** Acesso a processos administrativos e gestão do seu próprio histórico de pedidos.

---

## Árvore do Projeto (Estrutura Completa)

O código-fonte está integrado numa única solução `.slnx` no ecossistema .NET, facilitando o desenvolvimento simultâneo do front e back-end. Abaixo encontra-se a árvore exaustiva de todos os ficheiros do repositório:

```text
2026-Team-D/
├── .gitignore
├── README.md
└── backend/
    └── Formify/
        ├── Formify.slnx
        ├── package-lock.json
        ├── Formify.Server/                  # PROJETO BACKEND
            │   ├── .gitignore
        │   ├── appsettings.Development.json
        │   ├── appsettings.json
        │   ├── CHANGELOG.md
        │   ├── Formify.Server.csproj
        │   ├── Formify.Server.csproj.user
        │   ├── Program.cs
        │   ├── Controllers/
        │   │   ├── AuthController.cs
        │   │   ├── FormsController.cs
        │   │   └── SubmissionsController.cs
        │   ├── Data/
        │   │   └── users.json
        │   ├── DTOs/
        │   │   ├── CreateFormRequest.cs
        │   │   ├── SubmitFormRequest.cs
        │   │   └── UpdateStatusRequest.cs
        │   ├── Models/
        │   │   ├── Field.cs
        │   │   ├── Form.cs
        │   │   ├── Submission.cs
        │   │   └── UserModel.cs
        │   ├── Properties/
        │   │   └── launchSettings.json
        │   └── Services/
        │       ├── JsonHandler.cs
        │       └── UsersService.cs
        │
        └── formify.client/                  # PROJETO FRONTEND
            ├── CHANGELOG.md
            ├── eslint.config.js
            ├── formify.client.esproj
            ├── index.html
            ├── package-lock.json
            ├── package.json
            ├── postcss.config.js
            ├── README.md
            ├── tailwind.config.js
            ├── vite.config.js
            ├── public/
            │   ├── favicon.svg
            │   └── icons.svg
            ├── Schema/
            │   ├── FormElements.json
            │   ├── FormsList.json
            │   └── SubmissionsList.json
            └── src/
                ├── App.jsx
                ├── index.css
                ├── main.jsx
                ├── assets/
                │   ├── mockup-1.png
                │   └── mockup-2.png
                ├── components/
                │   ├── StatusBadge.jsx
                │   ├── Toast.jsx
                │   ├── Auth/
                │   │   ├── ProtectedRoute.jsx
                │   │   └── SessionGuard.jsx
                │   ├── Layout/
                │   │   ├── Header.jsx
                │   │   ├── Layout.jsx
                │   │   └── Sidebar.jsx
                │   └── Toast/
                │       └── ToastManager.jsx
                └── pages/
                    ├── AdminDashboard.jsx
                    ├── CreateForm.jsx
                    ├── DraftedForms.jsx
                    ├── Landing.jsx
                    ├── Login.jsx
                    ├── MyInfo.jsx
                    ├── MySubmissionDetail.jsx
                    ├── MySubmissions.jsx
                    ├── Register.jsx
                    ├── RespondForm.jsx
                    ├── ViewForm.jsx
                    ├── Aluno/
                    │   └── AlunoDashboard.jsx
                    ├── Funcionario/
                    │   └── FuncionarioDashboard.jsx
                    └── Professor/
                        └── ProfessorDashboard.jsx
```
## Dicionário de Ficheiros
Abaixo encontra-se a explicação detalhada da responsabilidade e finalidade de cada ficheiro da estrutura acima.

### 1. Raiz do Repositório
* **`.gitignore`:** Define que pastas e ficheiros locais (como node_modules ou compilados) não devem ser versionados no Git.
* **`README.md`:** Este ficheiro de documentação global do projeto.

### 2. Solução Global (backend/Formify)
* **`Formify.slnx`:** O ficheiro da Solução .NET que liga e carrega os projetos do servidor e do cliente em simultâneo.
* **`package-lock.json`:** Lockfile gerado ao nível da raiz da solução para gestão fixa de pacotes npm integrados.

### 3. Backend - Web API (backend/Formify/Formify.Server)
**Raiz do Backend e Configurações**
* **`Formify.Server.csproj`:** Ficheiro principal do projeto C# definindo as frameworks alvo e dependências NuGet.
* **`Formify.Server.csproj.user`:** Ficheiro de configurações gerado e focado nas preferências do utilizador/IDE.
* **`Program.cs`:** O ponto central de entrada do backend (.NET 8+). Aqui configuram-se os serviços, Injeção de Dependências, CORS e o pipeline HTTP.
* **`appsettings.json` e `appsettings.Development.json`:** Ficheiros de configuração da aplicação (cadeias de ligação a bases de dados, configurações JWT e segredos da API).
* **`CHANGELOG.md`:** Registo histórico de alterações feitas à camada da API.
* **`.gitignore`:** Regras específicas do Git aplicadas apenas ao projeto backend.
* **`Properties/launchSettings.json`:** Define perfis de lançamento (portas locais e variáveis de ambiente ao correr o backend).

**Controladores (Controllers/)**
* **`AuthController.cs`:** Endpoints para gerir a autenticação (Login de utilizadores, Registo e validação).
* **`FormsController.cs`:** A interface REST para operações em formulários e rascunhos (CRUD).
* **`SubmissionsController.cs`:** Endpoints para os utilizadores enviarem respostas e para atualizar os estados do processo no workflow.

**Modelos de Domínio (Models/)**
* **`Form.cs`:** Representa um Formulário completo no sistema.
* **`Field.cs`:** Representa a configuração de uma pergunta individual dentro de um Form.
* **`Submission.cs`:** A entidade que guarda a submissão de um utilizador perante um formulário.
* **`UserModel.cs`:** A representação de um utilizador do sistema com os seus respetivos papéis (Roles).

**Transferência de Dados (DTOs/)**
* **`CreateFormRequest.cs`:** Estrutura dos dados enviados pelo Frontend quando se cria ou guarda um formulário.
* **`SubmitFormRequest.cs`:** Payload que o Frontend envia no momento de preencher uma submissão.
* **`UpdateStatusRequest.cs`:** A estrutura de dados exigida para atualizar o estado de uma submissão no workflow (ex: Rejeitar/Aprovar).

**Serviços e Dados (Services/ & Data/)**
* **`UsersService.cs`:** Encapsula a lógica de negócio associada a contas de utilizador.
* **`JsonHandler.cs`:** Um serviço utilitário para facilitar as operações de leitura e escrita em ficheiros JSON.
* **`Data/users.json`:** Ficheiro de persistência que simula ou serve como base de dados inicial (mock) para armazenamento dos perfis de utilizador.

### 4. Frontend - React & Vite (backend/Formify/formify.client)
**Configurações de Frontend**
* **`package.json` e `package-lock.json`:** Registo de dependências NPM (Tailwind, React Router, Axios) e as suas versões exatas.
* **`formify.client.esproj`:** Ficheiro específico do ecossistema .NET que mapeia este projeto React como parte da solução global do Visual Studio.
* **`vite.config.js`:** O ficheiro de configuração do bundler Vite, incluindo o proxy para ligar diretamente aos endpoints da API em ambiente de desenvolvimento.
* **`tailwind.config.js` e `postcss.config.js`:** Parametrização da framework CSS Tailwind (definição de temas, paletas e plugins).
* **`eslint.config.js`:** Regras obrigatórias de linting para salvaguardar a consistência do código JS/React.
* **`README.md` e `CHANGELOG.md`:** Ficheiros documentais confinados à aplicação React.

**Entrada da Aplicação**
* **`index.html`:** A página base do projeto Web.
* **`src/main.jsx`:** O script que renderiza a aplicação e monta o Virtual DOM do React.
* **`src/App.jsx`:** O componente base da aplicação, onde fica mapeada a árvore de roteamento (React Router DOM).
* **`src/index.css`:** Ficheiro que importa as predefinições globais do Tailwind CSS.

**Assets e Ficheiros Estáticos**
* **`public/favicon.svg` e `public/icons.svg`:** Ícones vetoriais servidos diretamente para o utilizador.
* **`src/assets/mockup-1.png` e `src/assets/mockup-2.png`:** Imagens/mockups ilustrativos usados primariamente nas páginas institucionais ou Landing Pages.

**Schemas de Dados (Schema/)**
* **`FormElements.json`, `FormsList.json`, `SubmissionsList.json`:** Ficheiros de schema ou mock de dados, úteis para parametrizar de forma robusta o renderizador do formulário sem depender em exclusivo do backend.

**Componentes Partilhados (src/components/)**
* **`StatusBadge.jsx`:** Componente visual (um distintivo) que reflete o estado atual de uma submissão no fluxo de aprovação.
* **`Toast.jsx` e `Toast/ToastManager.jsx`:** Todo o sistema e lógica para os pop-ups temporários de erro e sucesso.
* **Layouts:**
  * **`Layout/Layout.jsx`:** O molde de página para as áreas autenticadas.
  * **`Layout/Header.jsx`:** O componente da barra de topo (perfil e ações globais).
  * **`Layout/Sidebar.jsx`:** O menu de navegação à esquerda.
* **Autenticação:**
  * **`Auth/ProtectedRoute.jsx`:** Componente de barreira (Higher Order Component) que restringe páginas apenas a quem tem as roles adequadas.
  * **`Auth/SessionGuard.jsx`:** Ferramenta de observação passiva que fiscaliza se a sessão expirou.

**Vistas da Aplicação (src/pages/)**
* **Públicas e Contas:**
  * **`Landing.jsx`:** O primeiro ecrã que o utilizador externo vê, servindo de porta de entrada do projeto.
  * **`Login.jsx` e `Register.jsx`:** Ecrãs de gestão de credenciais e entrada na aplicação.
  * **`MyInfo.jsx`:** O separador do utilizador ver e editar a sua conta pessoal.
* **Operações do Formulário:**
  * **`AdminDashboard.jsx`:**

---

## Como Executar Localmente
O arranque da plataforma baseia-se num processo unificado:

1. Fazer o Clone do repositório para o disco rígido.
2. Navegar para a base da solução através do comando:
   ```bash
   cd backend/Formify
  
3. Correr o projeto (o comando seguinte compilará a API em .NET e arranca, em simultâneo transparente, o servidor Vite com o React):

  ```bash
  dotnet run --project Formify.Server/Formify.Server.csproj
  ```
4. Aceder aos endpoints HTTP / HTTPS expostos no terminal.


