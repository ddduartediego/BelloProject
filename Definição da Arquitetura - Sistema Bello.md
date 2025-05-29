# Definição da Arquitetura \- Sistema Bello

**Autor:** [Diego Duarte](mailto:dd.duartediego@gmail.com)  
**Data:** 28 de mai. de 2025  
**Versão:** 1.0

# Visão Geral da Arquitetura

Para o MVP do Sistema de Gestão para Salão de Beleza, optamos por uma arquitetura **Serverless utilizando Next.js para o Frontend e API Routes (Node.js) para o Backend, com Supabase como Backend as a Service (BaaS) e banco de dados, tudo hospedado na Vercel.**

## Justificativa da Escolha:

* **Time-to-Market Acelerado:** A combinação de Next.js com API Routes e Supabase permite um desenvolvimento rápido. Supabase abstrai grande parte da complexidade do backend tradicional (autenticação, API de banco de dados em tempo real, storage), enquanto Next.js facilita a criação de interfaces ricas e a Vercel simplifica o deploy.  
* **Custo-Benefício para MVP:** A Vercel e o Supabase oferecem planos gratuitos ou de baixo custo que são ideais para o início de um projeto, escalando conforme a necessidade (pay-as-you-go). A infraestrutura serverless elimina a necessidade de gerenciamento de servidores.  
* **Escalabilidade:** A Vercel gerencia automaticamente a escalabilidade das funções serverless (API Routes) e do frontend estático/SSR. O Supabase é construído sobre PostgreSQL e tecnologias escaláveis.  
* **Manutenibilidade:** A estrutura do Next.js incentiva a organização do código. A separação clara entre frontend (React components), backend (API Routes) e BaaS (Supabase) facilita a manutenção e evolução. As responsabilidades são bem definidas.  
* **Stack Tecnológica Coesa:** Next.js (React) e Node.js (para API Routes) utilizam JavaScript/TypeScript, o que permite que desenvolvedores full-stack trabalhem de forma eficiente em ambas as camadas. A Vercel é otimizada para Next.js.  
* **Integração com Google Agenda:** As API Routes em Node.js são um local adequado para gerenciar a lógica de integração com serviços externos como a API do Google Calendar, mantendo os tokens e a lógica segura no backend.

Essa arquitetura permite focar na entrega de valor das funcionalidades do MVP, com uma base sólida para futuras evoluções, como a possível transição para microsserviços mais dedicados caso a complexidade e a carga do sistema exijam no futuro.

# Diagrama de Componentes da Arquitetura

\+---------------------+      \+------------------------+      \+-----------------------+  
| Usuário             |-----\>| Frontend (Next.js)     |-----\>| API Routes (Node.js)  |  
| (Admin/Profissional)|      | (Rodando na Vercel)    |      | (Serverless Functions |  
\+---------------------+      \+------------------------+      |  na Vercel)           |  
                                      ^      |               \+-----------+-----------+  
                                      |      |                           |  
                                      |      | HTTPS/REST                | HTTPS/SDK  
                                      |      v                           v  
\+-----------------------+      \+------------------------+      \+-----------------------+  
| Google Agenda API     |\<-----| Serviço de Integração  |\<----\>| Supabase (BaaS)       |  
| (Serviço Externo)     |      | (Parte das API Routes) |      | \- PostgreSQL DB       |  
\+-----------------------+      \+------------------------+      | \- Autenticação        |  
                                                               | \- Storage             |  
                                                               | \- Realtime (opcional) |  
                                                               \+-----------------------+

Descrição das Interações:

1. O **Usuário** (Administrador ou Profissional) interage com a aplicação **Frontend (Next.js)** através de um navegador web.  
2. O **Frontend (Next.js)**, hospedado na Vercel, renderiza a interface e envia requisições (ex: para buscar dados, realizar ações) para as **API Routes (Node.js)**.  
3. As **API Routes (Node.js)**, executadas como funções serverless na Vercel, contêm a lógica de negócio. Elas:  
   * Comunicam-se com o **Supabase** para operações de CRUD no banco de dados (PostgreSQL), autenticação e gerenciamento de arquivos (Storage).  
   * Contêm o **Serviço de Integração com Google Agenda**, que se comunica com a **Google Agenda API** para sincronizar agendamentos.  
4. O **Supabase** atua como o BaaS, provendo banco de dados, autenticação, e possivelmente funcionalidades em tempo real.  
5. A **Google Agenda API** é um serviço externo consumido pelo backend para a funcionalidade de sincronização de agendas.

# Detalhamento dos Componentes

## Frontend (React com Next.js)

* **Responsabilidades:**  
  * Renderização da interface do usuário (UI) e experiência do usuário (UX).  
  * Gerenciamento do estado local e global da aplicação (ex: usando Context API, Zustand, ou Redux Toolkit).  
  * Interação com as API Routes para buscar e enviar dados.  
  * Validação de formulários no lado do cliente.  
  * Controle de rotas da aplicação.  
* **Estrutura de Pastas Sugerida (exemplo):**

/src  
├── /app 			// Rotas da aplicação  
├── /components  		// Componentes reutilizáveis (UI)  
│   ├── /common  		// Botões, Inputs, Modais genéricos  
│   └── /feature 		// Componentes específicos de funcionalidades  
├── /contexts     	// Gerenciamento de estado global (Context API)  
├── /hooks             // Hooks customizados  
├── /services  		// Funções para chamadas API  
├── /utils        	// Funções utilitárias  
├── /lib          	// Configurações, clientes de API  
└── /styles       	// Estilos globais e temas

* **Comunicação com Backend:**  
  * Utilizará requisições HTTP (predominantemente GET, POST, PUT, DELETE) para as API Routes (Backend Node.js).  
  * Recomenda-se o uso de bibliotecas como axios ou a API fetch nativa para realizar essas chamadas.  
  * Os dados serão trafegados no formato JSON.

## Backend (Node.js com Next.js API Routes)

* **Tipo de API:** **API RESTful**. É uma escolha pragmática para o MVP, bem suportada pelas API Routes do Next.js e amplamente compreendida.  
* **Principais Módulos/Serviços (organizados como arquivos/pastas dentro de**   
  * auth/: Endpoints para login, logout, gerenciamento de sessão (interagindo com Supabase Auth).  
  * agendamentos/: CRUD para agendamentos, lógica de sincronização com Google Agenda.  
  * comandas/: Lógica para abrir, visualizar, fechar e ajustar comandas.  
  * caixa/: Lógica para abrir, fechar, conferir e ajustar caixa.  
  * clientes/: CRUD para clientes.  
  * profissionais/: CRUD para profissionais.  
  * servicos/: CRUD para serviços.  
  * produtos/: CRUD para produtos.  
  * empresa/: CRUD para dados da empresa.  
  * google-integration/: Lógica específica para o fluxo OAuth e interações com a API do Google Calendar.  
* **Responsabilidades:**  
  * Implementação da lógica de negócio principal do sistema.  
  * Validação de dados recebidos do frontend.  
  * Autenticação e Autorização de requisições (utilizando Supabase Auth e verificação de papéis).  
  * Comunicação segura com o Supabase (utilizando a SERVICE\_ROLE\_KEY do Supabase para operações privilegiadas, protegendo-a como variável de ambiente).  
  * Orquestração da integração com a API do Google Agenda (fluxo OAuth, armazenamento seguro de tokens, chamadas à API).

## Banco de Dados e BaaS (Supabase)

* **Autenticação (Supabase Auth):**  
  * Gerenciamento de usuários (profissionais, administradores).  
  * Proverá login por email/senha.  
  * Gerenciamento de sessões via JWT.  
  * Os papéis (ADMINISTRADOR, PROFISSIONAL) serão armazenados na tabela Usuarios ou no meta\_data do usuário no Supabase Auth.  
* **Armazenamento de Dados (PostgreSQL):**  
  * Todas as entidades do sistema (Clientes, Profissionais, Agendamentos, Comandas, etc.) serão modeladas como tabelas no banco de dados PostgreSQL gerenciado pelo Supabase.  
  * O acesso aos dados será feito principalmente através do cliente JavaScript do Supabase nas API Routes do Node.js.  
  * Row Level Security (RLS) será configurado para garantir que os usuários só possam acessar/modificar os dados aos quais têm permissão.  
* **Real-time Subscriptions (Opcional para MVP):**  
  * Poderia ser utilizado para atualizar UIs em tempo real (ex: notificar outros profissionais sobre um novo agendamento). Para o MVP, esta funcionalidade pode ser postergada ou implementada via polling simples para manter a complexidade baixa.  
* **Supabase Storage:**  
  * Utilizado para armazenar arquivos como logos da empresa e, futuramente, fotos de perfil de profissionais ou clientes.

## Integração com Google Agenda

* **Estratégia de Integração:**

  **Consentimento e Autenticação (OAuth 2.0):**

  * O profissional, através da interface do sistema, iniciará o fluxo OAuth 2.0 para autorizar o sistema a acessar sua Google Agenda.  
    * O backend (API Route) gerenciará o redirecionamento para a tela de consentimento do Google e o callback para receber o código de autorização.  
    * Este código será trocado por um access\_token e um refresh\_token.  
    * Os tokens (access\_token e refresh\_token criptografado) serão armazenados de forma segura no Supabase, associados ao registro do profissional.

    **APIs do Google Agenda a serem Consumidas:**

    * Google Calendar API v3:  
      * Events: insert: Para criar novos agendamentos na agenda do profissional.  
      * Events: list: Para buscar agendamentos existentes e verificar disponibilidade (sincronização Google \-\> Sistema).  
      * Events: update: Para modificar agendamentos existentes.  
      * Events: delete: Para remover agendamentos.

    **Fluxo de Sincronização Bidirecional:**

    * **Sistema \-\> Google Agenda:** Quando um agendamento é criado, editado ou excluído no sistema, uma API Route no backend usará o access\_token (e o refresh\_token se necessário) do profissional para realizar a operação correspondente na Google Agenda dele.  
    * **Google Agenda \-\> Sistema (Para MVP, pode ser simplificado):**  
      * **Abordagem Recomendada para MVP (Polling):** Uma função serverless agendada (ex: via Vercel Cron Jobs ou um trigger no Supabase) periodicamente buscará eventos das agendas dos profissionais conectados (usando Events: list) e conciliará com os agendamentos no sistema. Isso introduz um pequeno delay, mas é mais simples de implementar.  
      * **Abordagem Ideal (Push Notifications \-**  Configurar um canal de notificação com a API do Google Calendar (Events: watch). Isso requer um endpoint HTTPS público e estável no nosso backend para receber notificações do Google quando eventos mudam. É mais complexo e pode ser uma evolução pós-MVP.  
    * **Conflitos:** Definir uma estratégia para lidar com conflitos (ex: qual fonte tem prioridade, ou notificar o profissional). Para MVP, a criação/modificação no nosso sistema pode ter prioridade.

## Modelo de Dados (Entidades UML \- Descrição Textual para PlantUML)

A seguir, a descrição das entidades e seus relacionamentos, que pode ser usada para gerar um diagrama UML.

[Link](https://www.plantuml.com/plantuml/png/lLZDRjj64BxhAQQwM49bnovwQ7KA8z496vjIAAa840J4Y1p9sv9SPdTfk0doC4KFGP_3BrOkgRLMDEK8YT1BHExCxFpCDzymVYuL2bMaIUS7TKCfGOgA1CDEXpB5r5_WfhaWYV2f0_0Zi7W8YuKtXjxqTRywoNXAuGepXPBX47vtWj4h9wX40ZyY3oMF62QxaYZB_zWzKPJGYcUqUqfPJ88YldkQy3KF2x5pv-bfVR5W6FEGqY7ClMjtDdUkfvK0LO49-_XO-FaXquKiK33UbcbvFGIq8a5Pn10ubESnXrcHun8bWLEecphW5DasBkWjVE_DmhKg5V4qJqZnHlOiBpEg_G_1zHVNlHDdVEtvtcmUEED9S3A0asamkVHcCs_YErSdLKYy08LBIX1YWXnpOl8ufHWbh7oY9vj-KFzQop40daUCPvZKjyMeCCnGHYobJ9TcxCnTwEqgyQKaSOiH9rd6xBwTDnLO75ADLHFjvMjGt02uVvpAJ0LVCIahl_kGCkKnWIG175AIAOSF1HbqdR5Ojwr8qRHEKeu2OuI4hVKF6bMJbS65dPNH6O11s64bq3sHEUc9P376ffRltZUhUSE5lb-6Ik0IavlI_M-pYVz2v-VU3U4JT2MjkqDurpt_TNX-VdhnK_blTm3TYv-hrr_qw_i1d9sTmUVgoZNdwuJ221FAOXGXYxV8iBnRgbYELQZudvH9uxuN2POhlXQumfXRIDA12Le9aXkJ0M0KaPJr6_JeBcVYM32ObLXaKIjN7DQ9zYcAIPPHHSZR8HuN0ajXI5An56CCKvOLYfV5yVov-zAjBybhnXox8-_QkJeQxED2_Q_vcap2g91gcq-xpgs6b9spnhdYvU25LNPMXInHMJwMSYEpKNYSgZbh7LPAsTELYsgstQcSeU07fTmYdbrDcv8ExOPXNJtc8SjOcNOZFqk-OdP-Xx6nLAWAQNRPrFN7RbbalSP64__I2wxBhLQzEVx8lQfVj6XqjV3AbnqQeBAxgeKkpDZNoxZIuf1nU5cPmMX3D4VlPNFuGzpAjkqTG5rqo_2XExAweKLvStMDFti6-5Bew8oXGNgrRWJTVwaIJtcDjPY35PAzrv7TuVSDSGEA8Iv9g4BWVamsIFfDGIdWKh2YzRuLHJTMAG--KTlnOejS4rSRh2qdblWHX369UJqScDZSOaGhfWEEC8cA1EFz56Lhisp5HRfF-nj6otdX1lDgUYxTSZRqx1pf6v2dcCNuhSIrxH7aA10ske2tHIAv_KLS2y9Qq3RZhJWH97EUIRobG-Wmqi1lnAcF3WV-iL1rYmaNeU8A4pFDqW9NGoElzswhXbwUN3lRRuthXZGbnMEk1NMW1aLZpt_bUi66aeEvCmb7WJlsvlR9s7snEPXwR_NFP34lJVhR507L_RzGrK7i1Qkp1QjZhm3dMCZr5AM7eBTMQQ2YFjp7r3iiFO0sYCP52tNfmwRwXm8pLNs5jto_XKN650h6Gq5h9fN0-AkiZr1z1ZsZEugA-o_t_t3hlXeHJ55g8Q9bhYfZXPcYG_Xt098WPYiIrN3773PpUVztEPYGKuAmgVDtDHVW12AUwJgmJ0rXzCeTlORUja7WpS2VpC5VN5t19B1wOKlw5agk-ItJXSC8-RwzU01_702cnhgQ4Qou046cQWX5kkdTzgy1gHMU6H_NdmURePavdddmNmPUzHYubvDWD3cnY6RRwvRFxSDvzP05B4YtZXU0835R2uRF19M9bYZTKgITbTNVTcZOetq20ILO-QpGBZiRSeRkHLV7q3q_E_Exvl_5xLApc_P8xGpRLSpajqlDeBTBxG_1TeqQKkqoWwLEPvEXBRxOZHs6q2jfk4ZxdOvzlZyURL7t3_jxJEmWQdLxphbes6c3nxbfGrmAUbQjYA-Oj4oe7MPdqyodiv8yOH5Js3VgnarhKgXAOnPp85qx-ohZvABfP8C8RHtnh5n_fMMBkEiRh_ecowYcWLD9e7CoiUowinUQxSS-rmxERKIq-tZQo22uQVGuBgkX3miAwxBLWkxNMvbpAGlMRpKmS7zEMLoaoNy0)

@startuml  
\!theme plain

entity Empresa {  
  \+ id: UUID (PK)  
  \+ nome\_fantasia: VARCHAR  
  \+ razao\_social: VARCHAR  
  \+ cnpj: VARCHAR  
  \+ telefone: VARCHAR  
  \+ endereco: VARCHAR  
  \+ logo\_url: VARCHAR  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Usuario {  
  \+ id: UUID (PK) \-- Referencia o ID do Supabase Auth  
  \+ email: VARCHAR (UNIQUE)  
  \+ nome\_completo: VARCHAR  
  \+ tipo\_usuario: ENUM('ADMINISTRADOR', 'PROFISSIONAL') \-- ou tabela de papeis  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Cliente {  
  \+ id: UUID (PK)  
  \+ nome: VARCHAR  
  \+ telefone: VARCHAR  
  \+ email: VARCHAR (UNIQUE, opcional)  
  \+ data\_nascimento: DATE (opcional)  
  \+ observacoes: TEXT (opcional)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Profissional {  
  \+ id: UUID (PK) \-- Pode ser o mesmo que Usuario.id ou uma tabela separada ligada a Usuario  
  \+ id\_usuario: UUID (FK to Usuario, UNIQUE)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \+ especialidades: TEXT\[\] (opcional)  
  \+ horarios\_trabalho: JSONB \-- Ex: { "seg": \["09:00-12:00", "14:00-18:00"\], ... }  
  \+ google\_calendar\_id: VARCHAR (opcional)  
  \+ google\_auth\_tokens: JSONB (criptografado, opcional) \-- refresh\_token, access\_token (expira)  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Servico {  
  \+ id: UUID (PK)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \+ nome: VARCHAR  
  \+ descricao: TEXT (opcional)  
  \+ duracao\_estimada\_minutos: INTEGER  
  \+ preco: DECIMAL  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Produto {  
  \+ id: UUID (PK)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \+ nome: VARCHAR  
  \+ descricao: TEXT (opcional)  
  \+ preco\_custo: DECIMAL (opcional)  
  \+ preco\_venda: DECIMAL  
  \+ estoque\_atual: INTEGER  
  \+ estoque\_minimo: INTEGER (opcional)  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Agendamento {  
  \+ id: UUID (PK)  
  \+ id\_cliente: UUID (FK to Cliente)  
  \+ id\_profissional: UUID (FK to Profissional)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \+ data\_hora\_inicio: TIMESTAMP  
  \+ data\_hora\_fim: TIMESTAMP  
  \+ observacoes: TEXT (opcional)  
  \+ status: ENUM('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO')  
  \+ google\_event\_id: VARCHAR (opcional) \-- ID do evento no Google Calendar  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity AgendamentoServico {  
  \+ id\_agendamento: UUID (PK, FK to Agendamento)  
  \+ id\_servico: UUID (PK, FK to Servico)  
  \--  
  \+ preco\_cobrado\_servico: DECIMAL \-- Preço no momento do agendamento  
}

entity Caixa {  
  \+ id: UUID (PK)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \+ id\_profissional\_abertura: UUID (FK to Profissional, opcional) \-- Quem abriu  
  \+ id\_profissional\_fechamento: UUID (FK to Profissional, opcional) \-- Quem fechou  
  \+ data\_abertura: TIMESTAMP  
  \+ data\_fechamento: TIMESTAMP (opcional)  
  \+ saldo\_inicial: DECIMAL  
  \+ saldo\_final\_calculado: DECIMAL (opcional)  
  \+ saldo\_final\_informado: DECIMAL (opcional)  
  \+ observacoes: TEXT (opcional)  
  \+ status: ENUM('ABERTO', 'FECHADO')  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity Comanda {  
  \+ id: UUID (PK)  
  \+ id\_cliente: UUID (FK to Cliente, opcional para cliente avulso)  
  \+ nome\_cliente\_avulso: VARCHAR (opcional)  
  \+ id\_profissional\_responsavel: UUID (FK to Profissional)  
  \+ id\_caixa: UUID (FK to Caixa)  
  \+ id\_empresa: UUID (FK to Empresa)  
  \+ data\_abertura: TIMESTAMP  
  \+ data\_fechamento: TIMESTAMP (opcional)  
  \+ valor\_total\_servicos: DECIMAL  
  \+ valor\_total\_produtos: DECIMAL  
  \+ valor\_desconto: DECIMAL  
  \+ valor\_total\_pago: DECIMAL  
  \+ metodo\_pagamento: ENUM('DINHEIRO', 'CARTAO\_CREDITO', 'CARTAO\_DEBITO', 'PIX', 'OUTRO') (opcional até fechar)  
  \+ status: ENUM('ABERTA', 'FECHADA', 'CANCELADA')  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
}

entity ItemComanda {  
  \+ id: UUID (PK)  
  \+ id\_comanda: UUID (FK to Comanda)  
  \+ id\_servico: UUID (FK to Servico, opcional)  
  \+ id\_produto: UUID (FK to Produto, opcional)  
  \+ quantidade: INTEGER  
  \+ preco\_unitario\_registrado: DECIMAL \-- Preço no momento da venda/execução  
  \+ preco\_total\_item: DECIMAL  
  \+ id\_profissional\_executante: UUID (FK to Profissional, opcional, se diferente do responsável pela comanda)  
  \--  
  \+ criado\_em: TIMESTAMP  
  \+ atualizado\_em: TIMESTAMP  
  ' constraint: CHECK (id\_servico IS NOT NULL OR id\_produto IS NOT NULL)  
}

entity MovimentacaoCaixa {  
  \+ id: UUID (PK)  
  \+ id\_caixa: UUID (FK to Caixa)  
  \+ id\_comanda: UUID (FK to Comanda, opcional) \-- Se for referente a uma venda  
  \+ tipo\_movimentacao: ENUM('ENTRADA', 'SAIDA', 'SANGRIA', 'REFORCO')  
  \+ valor: DECIMAL  
  \+ descricao: TEXT  
  \+ id\_profissional\_responsavel: UUID (FK to Profissional, opcional) \-- Quem realizou a sangria/reforço  
  \+ data\_movimentacao: TIMESTAMP  
  \--  
  \+ criado\_em: TIMESTAMP  
}

' Relacionamentos  
Empresa "1" \-- "0..N" Usuario  
Empresa "1" \-- "0..N" Cliente  
Empresa "1" \-- "0..N" Profissional  
Empresa "1" \-- "0..N" Servico  
Empresa "1" \-- "0..N" Produto  
Empresa "1" \-- "0..N" Agendamento  
Empresa "1" \-- "0..N" Caixa  
Empresa "1" \-- "0..N" Comanda

Usuario "1" \-- "0..1" Profissional : (é um)

Profissional "1" \-- "0..N" Agendamento : (realiza)  
Profissional "1" \-- "0..N" Comanda : (responsável por)  
Profissional "0..1" \-- "0..N" Caixa : (abre/fecha)  
Profissional "0..1" \-- "0..N" MovimentacaoCaixa : (realiza)

Cliente "1" \-- "0..N" Agendamento : (solicita)  
Cliente "0..1" \-- "0..N" Comanda : (atendido em)

Agendamento "1" \-- "1..N" AgendamentoServico : (contém)  
AgendamentoServico "N..1" \-- "1" Servico : (refere-se a)

Comanda "1" \-- "1..N" ItemComanda : (contém)  
ItemComanda "N..0" \-- "0..1" Servico : (refere-se a)  
ItemComanda "N..0" \-- "0..1" Produto : (refere-se a)  
Comanda "1" \-- "1" Caixa : (registrada em)

Caixa "1" \-- "0..N" MovimentacaoCaixa : (possui)  
Caixa "1" \-- "0..N" Comanda  
@enduml

**Principais Entidades e Relacionamentos Chave:**

* **Empresa:** Entidade central que agrupa todos os outros dados.  
* **Usuario:** Base para login, com diferenciação de papéis (Admin, Profissional).  
* **Profissional:** Estende Usuario, armazena informações específicas do profissional, incluindo tokens do Google Agenda.  
* **Cliente:** Cadastrado pela empresa.  
* **Servico / Produto:** Catálogo oferecido pela empresa.  
* **Agendamento:** Vincula Cliente, Profissional, e um ou mais Serviços (via AgendamentoServico).  
* **Comanda:** Representa a "conta" do cliente, vinculada a um Cliente (ou avulso), Profissional, Caixa e contém Item Comandas.  
* **ItemComanda:** Detalha os Serviços ou Produtos de uma Comanda.  
* **Caixa:** Controle diário de fluxo financeiro da empresa.  
* **MovimentacaoCaixa:** Registra todas as entradas e saídas do Caixa, incluindo pagamentos de Comandas.

## Fluxos de Dados Principais

**Realizar um Agendamento com Sincronização Google Agenda:**

* **Frontend:** Profissional/Admin preenche formulário de agendamento (cliente, serviços, data/hora, profissional).  
  * **API Route (**  
    1. Valida dados.  
    2. Salva Agendamento e AgendamentoServico no Supabase DB.  
    3. Recupera google\_auth\_tokens do Profissional (associado ao agendamento) do Supabase DB.  
    4. Usa access\_token para criar evento na Google Agenda do profissional via API do Google.  
    5. Salva google\_event\_id no registro do Agendamento.  
    6. Responde sucesso ao Frontend.  
  * **Sincronização Google \-\> Sistema (Polling):**  
    1. **Job Agendado (Vercel Cron/Supabase Function):** Periodicamente, para cada profissional com integração ativa:  
    2. Busca eventos da Google Agenda do profissional.  
    3. Compara com agendamentos no sistema (usando google\_event\_id ou data/hora/profissional).  
    4. Cria/atualiza/remove agendamentos no sistema conforme necessário (ou notifica para ação manual em caso de conflitos complexos).

  **Abrir Comanda:**

  * **Frontend:** Profissional seleciona cliente (ou informa "avulso") e inicia nova comanda.  
  * **API Route (**  
    1. Valida dados (profissional, cliente se houver).  
    2. Identifica o Caixa aberto do dia/empresa.  
    3. Cria registro de Comanda no Supabase DB (status ABERTA, associa profissional, cliente, caixa).  
    4. Responde com dados da comanda criada.

  **Lançar Serviço/Produto na Comanda:**

  * **Frontend:** Profissional seleciona comanda aberta, adiciona um serviço ou produto.  
  * **API Route (**  
    1. Valida dados (item, quantidade, preço).  
    2. Cria ItemComanda no Supabase DB, associado à Comanda.  
    3. Atualiza valores totais na Comanda.  
    4. Se for Produto, atualiza estoque\_atual do Produto.  
    5. Responde sucesso.

  **Fechar uma Comanda:**

  * **Frontend:** Profissional visualiza comanda, insere informações de pagamento e clica "Fechar Comanda".  
  * **API Route (**  
    1. Valida se a comanda pode ser fechada.  
    2. Atualiza Comanda no Supabase DB (status FECHADA, método de pagamento, valor pago).  
    3. Cria MovimentacaoCaixa (tipo ENTRADA) no Caixa associado, registrando o valor recebido.  
    4. Responde sucesso.

  **Cadastrar um Profissional:**

  * **Frontend:** Admin preenche formulário de cadastro de profissional (dados pessoais, email, etc.).  
  * **API Route (**  
    1. Valida dados.  
    2. Cria um usuário no Supabase Auth com o email e senha fornecidos (ou gerados).  
    3. Salva dados do Profissional no Supabase DB, associando o id\_usuario do Supabase Auth.  
    4. Associa o profissional à Empresa.  
    5. Responde sucesso.

  **Abrir Caixa:**

  * **Frontend:** Profissional/Admin informa saldo inicial.  
  * **API Route (**  
    1. Valida se já existe um caixa aberto para o dia/empresa.  
    2. Cria registro de Caixa no Supabase DB (status ABERTO, data\_abertura, saldo\_inicial, profissional\_abertura, id\_empresa).  
    3. Responde sucesso.

## Estratégia de Autenticação e Autorização

* **Autenticação (Supabase Auth):**  
  * O Supabase Auth será o provedor de identidade. Usuários (Administradores, Profissionais) farão login com email e senha.  
  * O Supabase Auth gerencia sessões e emite JSON Web Tokens (JWTs) que serão enviados pelo frontend em cada requisição às API Routes.  
* **Autorização:**  
  * **Papéis (Roles):**  
    * Será utilizada uma tabela Usuario no banco de dados, referenciando o user\_id do Supabase Auth e contendo um campo tipo\_usuario (ENUM: ADMINISTRADOR, PROFISSIONAL).  
    * Alternativamente, o papel pode ser armazenado no user\_metadata do Supabase Auth. A tabela Usuario oferece mais flexibilidade para adicionar outros atributos ao usuário do sistema.  
  * **Aplicação de Permissões:**  
    * **API Routes (Backend):** Um middleware em cada API Route (ou um wrapper) verificará a validade do JWT e extrairá o user\_id. Com o user\_id, o papel do usuário será consultado na tabela Usuario. A lógica da rota então decidirá se o usuário tem permissão para realizar a ação.  
      * Exemplo: Apenas usuários com papel ADMINISTRADOR podem acessar endpoints de cadastro da Empresa.  
    * **Frontend:** A UI será adaptada dinamicamente com base no papel do usuário logado, ocultando ou desabilitando funcionalidades não permitidas. Essa é uma conveniência de UX, a segurança real é garantida no backend.  
    * **Supabase Row Level Security (RLS):** Políticas de RLS serão implementadas no Supabase para garantir que as consultas diretas ao banco (se houver alguma do frontend, ou mesmo no backend) respeitem as permissões. Por exemplo, um profissional só pode ver seus próprios agendamentos ou comandas que ele atendeu, a menos que seja um administrador. Para o MVP, focaremos na autorização via API Routes, usando RLS como uma camada adicional de segurança, especialmente se o frontend precisar ler alguns dados diretamente (o que deve ser evitado para dados sensíveis).

## Estratégia de Deploy na Vercel

* **Frontend React (Next.js):**  
  * O código-fonte será hospedado em um repositório GitHub.  
  * A Vercel será conectada a este repositório.  
  * A cada push para branches específicas (ex: main para produção, develop para staging/preview), a Vercel automaticamente fará o build do Next.js (gerando assets estáticos, funções serverless para SSR/ISR, e API Routes) e o deploy.  
* **Backend Node.js (Next.js API Routes):**  
  * As API Routes definidas na estrutura de pastas do Next.js (app/api/) serão automaticamente compiladas e implantadas pela Vercel como funções serverless individuais.  
  * A Vercel gerencia a execução e escalabilidade dessas funções.  
* **Variáveis de Ambiente:**  
  * Chaves de API do Supabase (SUPABASE\_URL, SUPABASE\_ANON\_KEY para o frontend, SUPABASE\_SERVICE\_ROLE\_KEY para o backend), credenciais da API do Google (GOOGLE\_CLIENT\_ID, GOOGLE\_CLIENT\_SECRET), e outras configurações sensíveis serão gerenciadas como Environment Variables nas configurações do projeto na Vercel.  
  * Diferentes conjuntos de variáveis de ambiente podem ser configurados para os ambientes de Produção, Preview (branches) e Desenvolvimento Local.  
  * Para desenvolvimento local, um arquivo .env.local será utilizado (e adicionado ao .gitignore).

## Considerações Adicionais

* **Segurança:**  
  * **Comunicação:** HTTPS será forçado pela Vercel e Supabase.  
  * **OWASP Top 10:**  
    * Validação de entrada em todas as API Routes.  
    * Uso de queries parametrizadas (o cliente Supabase já ajuda nisso).  
    * Proteção contra XSS (Next.js/React ajudam, mas atenção à renderização de HTML dinâmico).  
    * CSRF: Next.js tem algumas mitigações, mas se formulários tradicionais forem usados, considerar tokens CSRF. Para APIs JSON com JWT, o risco é menor se os tokens forem bem gerenciados.  
  * **LGPD:**  
    * Armazenar dados de forma segura. Tokens do Google devem ser criptografados em repouso.  
    * Garantir consentimento para uso de dados e integração com Google Agenda.  
    * Implementar mecanismos para exportação e exclusão de dados do usuário.  
  * **Segredos:** Todas as chaves de API e segredos devem ser armazenados como variáveis de ambiente seguras na Vercel, nunca hardcoded ou expostas no frontend.  
* **Escalabilidade:**  
  * A arquitetura serverless da Vercel e a infraestrutura do Supabase são projetadas para escalar horizontalmente sob demanda.  
  * O banco de dados PostgreSQL do Supabase pode ser escalado verticalmente (upgrade de plano) conforme a necessidade.  
  * O design modular das API Routes facilita a identificação de gargalos e otimizações futuras.  
* **Manutenibilidade:**  
  * A estrutura do Next.js e a separação de responsabilidades (Frontend, API Routes, Supabase) promovem um código mais organizado.  
  * O uso de TypeScript (altamente recomendado) melhorará a manutenibilidade e reduzirá erros em tempo de desenvolvimento.  
  * Boas práticas de Git (feature branches, pull requests, code reviews) serão essenciais.  
* **Monitoramento e Logs:**  
  * **Vercel:** Oferece logging para as funções serverless (API Routes) e analytics de uso do frontend.  
  * **Supabase:** Provê logs de acesso ao banco e uso da API.  
  * **Frontend/Backend Error Tracking:** Considerar a integração com serviços como Sentry ou LogRocket para monitoramento de erros em tempo real e diagnósticos mais detalhados, especialmente pós-MVP.  
* **Repositório de Código:**  
  * O código será versionado utilizando **Git** e hospedado no **GitHub**.  
  * Será adotado um fluxo de trabalho com branches (ex: main, develop, feature/nome-da-feature), Pull Requests para revisão de código e integração contínua via Vercel.

