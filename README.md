# AccessTrip Backend API 🌍♿

Backend robusto e completo para a plataforma **AccessTrip**, projetado para conectar viajantes a estabelecimentos e atrações turísticas acessíveis, com suporte a dois frontends especializados: **App Mobile (Traveler)** e **Web Dashboard (Business)**.

Desenvolvido em **Node.js 24+**, utilizando **SQLite3** embutido gerenciado via **Knex.js**, autenticação e controle de sessão stateless com **JWT**, upload de imagens com **Multer** e envio de e-mails transacionais com **Nodemailer**.

---

## 📋 Sumário

- [Visão Geral & Regras de Negócio](#-visão-geral--regras-de-negócio)
- [Tecnologias e Componentes Utilizados](#-tecnologias-e-componentes-utilizados)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Banco de Dados: Migrations, Seeds e Triggers](#-banco-de-dados-migrations-seeds-e-triggers)
- [Execução da Aplicação](#-execução-da-aplicação)
- [Documentação das Rotas da API](#-documentação-das-rotas-da-api)
- [Segurança e Tratamento de Erros](#-segurança-e-tratamento-de-erros)
- [Licença](#-licença)

---

## 🎯 Visão Geral & Regras de Negócio

1. **Dois Frontends Distintos com Isolamento de Perfis**:
   - **App Mobile (Traveler)**: Exclusivo para viajantes buscarem locais acessíveis, filtrarem por itens específicos de acessibilidade (rampas, banheiros adaptados, cão-guia, Libras, Braille, espaço TEA), visualizarem avaliações e publicarem suas próprias experiências.
   - **Web Dashboard (Business)**: Exclusivo para estabelecimentos gerenciarem seus locais cadastrados, acompanharem métricas de avaliações, responderem a comentários de viajantes e atualizarem fotos e recursos de acessibilidade.
   - **Isolamento de Acesso**: O middleware de autorização impede que usuários `TRAVELER` acessem rotas administrativas e que usuários `BUSINESS` façam avaliações de viajantes.

2. **Liberação de Acesso por E-mail (Código de 4 Dígitos)**:
   - Ao se cadastrar, o usuário recebe um código numérico de 4 dígitos enviado para seu e-mail.
   - O código tem validade de **24 horas**.
   - Após a validação com sucesso, o campo `email_verified` é atualizado para `1` e o `email_code` é limpo do banco de dados.
   - Usuários não verificados ficam impedidos de efetuar login e acessar os recursos da plataforma.

3. **Automação de `updated_at` por Triggers SQLite**:
   - Todos os carimbos de data/hora `updated_at` das tabelas `users`, `places` e `reviews` são atualizados automaticamente a nível de banco de dados via **Triggers nativos do SQLite**.

4. **Integridade de Dados e Restrições (Checks)**:
   - Enums e valores numéricos são rigorosamente validados por `CHECK constraints` no SQLite (`user_type`, `category`, `accessibility_level`, `experience_rating` entre 1 e 5, flags binárias `0` ou `1`).

---

## 🛠 Tecnologias e Componentes Utilizados

| Componente | Repositório GitHub Oficial | Descrição e Finalidade |
| :--- | :--- | :--- |
| **Node.js 24+** | [nodejs/node](https://github.com/nodejs/node) | Ambiente de execução JavaScript server-side de alta performance. |
| **Express** | [expressjs/express](https://github.com/expressjs/express) | Framework web rápido, flexível e minimalista para criação das rotas HTTP e middlewares. |
| **Knex.js** | [knex/knex](https://github.com/knex/knex) | SQL Query Builder com suporte completo a Migrations, Seeds, transações e schema builder. |
| **SQLite3** | [TryGhost/node-sqlite3](https://github.com/TryGhost/node-sqlite3) | Driver para banco de dados relacional SQLite embutido, leve e com zero dependência de servidor externo. |
| **JSON Web Token (jsonwebtoken)** | [auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | Criação e verificação de tokens JWT criptografados para controle de sessão stateless. |
| **bcryptjs** | [dcodeIO/bcrypt.js](https://github.com/dcodeIO/bcrypt.js) | Biblioteca de hashing seguro de senhas com salting em JavaScript puro. |
| **Multer** | [expressjs/multer](https://github.com/expressjs/multer) | Middleware para tratamento de formulários `multipart/form-data` e upload de arquivos de imagem. |
| **Nodemailer** | [nodemailer/nodemailer](https://github.com/nodemailer/nodemailer) | Módulo para envio de e-mails transacionais (com fallback automático para Ethereal em dev). |
| **Helmet** | [helmetjs/helmet](https://github.com/helmetjs/helmet) | Middleware de segurança que configura diversos cabeçalhos HTTP defensivos. |
| **CORS** | [expressjs/cors](https://github.com/expressjs/cors) | Habilita o compartilhamento de recursos entre origens distintas (Mobile & Web). |
| **Morgan** | [expressjs/morgan](https://github.com/expressjs/morgan) | Logger de requisições HTTP para monitoramento das chamadas no console. |
| **Dotenv** | [motdotla/dotenv](https://github.com/motdotla/dotenv) | Carregamento dinâmico de variáveis de ambiente a partir do arquivo `.env`. |

---

## 📁 Estrutura do Projeto

```text
backend-travel-reviews/
├── AccessTripDB.dbml               # Diagrama e especificação lógica do banco
├── LICENSE                         # Licença do projeto
├── README.md                       # Documentação completa
├── package.json                    # Dependências e scripts npm
├── knexfile.js                     # Configuração do Knex e SQLite3
├── .env.example                    # Modelo de variáveis de ambiente
├── .env                            # Variáveis de ambiente locais
├── database/
│   ├── connection.js               # Instância configurada do Knex
│   ├── accesstrip.sqlite           # Arquivo do banco de dados SQLite (gerado automaticamente)
│   ├── migrations/                 # Migrations do schema do banco e triggers
│   │   ├── 20260829000001_create_users_table.js
│   │   ├── 20260829000002_create_places_table.js
│   │   └── 20260829000003_create_reviews_table.js
│   └── seeds/                      # Carga de dados inicial (Admin, Viajante, Locais, Reviews)
│       └── 01_initial_data.js
├── src/
│   ├── server.js                   # Inicialização do servidor HTTP
│   ├── app.js                      # Configuração do Express, middlewares e rotas
│   ├── config/
│   │   └── upload.js               # Configurações do Multer e diretórios de upload
│   ├── middlewares/
│   │   ├── auth.middleware.js      # Validação de JWT e autorização por papéis (Roles)
│   │   └── error.middleware.js     # Tratamento centralizado de erros e 404
│   ├── services/
│   │   └── email.service.js        # Envio de e-mails via Nodemailer
│   ├── controllers/
│   │   ├── auth.controller.js      # Cadastro, verificação de código, login, resend
│   │   ├── user.controller.js      # Perfil do usuário e avatar
│   │   ├── place.controller.js     # CRUD de locais e filtros de acessibilidade
│   │   ├── review.controller.js    # Avaliações de viajantes e respostas de empresas
│   │   └── business.controller.js  # Dashboard e métricas exclusivas para empresas
│   └── routes/
│       ├── index.js                # Agregador de rotas
│       ├── auth.routes.js          # Rotas de autenticação
│       ├── user.routes.js          # Rotas de usuário
│       ├── place.routes.js         # Rotas de locais e avaliações aninhadas
│       ├── review.routes.js        # Rotas diretas de avaliações e respostas
│       └── business.routes.js      # Rotas administrativas da empresa
└── uploads/                        # Diretório de armazenamento de imagens
    ├── avatars/
    └── places/
```

---

## ⚙ Pré-requisitos

- **Node.js** na versão **24.0.0** ou superior.
- **npm** na versão **10.0.0** ou superior.

---

## 🚀 Instalação e Configuração

1. **Clone o repositório ou acesse o diretório**:

   ```bash
   cd backend-travel-reviews
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**:
   Copie o arquivo `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

   *(No Windows PowerShell: `Copy-Item .env.example .env`)*

   Variáveis principais no `.env`:

   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_FILE=./database/accesstrip.sqlite
   JWT_SECRET=super_secret_jwt_key_accesstrip_2026_change_in_production
   JWT_EXPIRES_IN=7d
   EMAIL_FROM="AccessTrip <no-reply@accesstrip.com>"
   MAX_FILE_SIZE_MB=5

   # Se não preenchidas em desenvolvimento, o Nodemailer cria uma conta Ethereal automática
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   ```

---

## 🗄 Banco de Dados: Migrations, Seeds e Triggers

Execute as migrações para criar as tabelas e triggers no SQLite:

```bash
npm run migrate
```

Execute as seeds para popular os dados iniciais previstos no modelo:

```bash
npm run seed
```

Para reiniciar e recriar o banco de dados do zero:

```bash
npm run db:reset
```

### Contas Iniciais Disponíveis na Seed

- **Conta Business (Empresa)**:
  - **E-mail**: `admin@admin.com`
  - **Senha**: `admin123`
  - **Perfil**: `BUSINESS` (E-mail já verificado)
- **Conta Traveler (Viajante Demo)**:
  - **E-mail**: `traveler@traveler.com`
  - **Senha**: `traveler123`
  - **Perfil**: `TRAVELER` (E-mail já verificado)

---

## ▶ Execução da Aplicação

### Modo Desenvolvimento (Hot Reload nativo do Node 24)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`.

---

## 📖 Documentação das Rotas da API

### 1. Autenticação & Verificação de E-mail (`/api/auth`)

| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Público | Cadastra usuário (`TRAVELER` ou `BUSINESS`). Gera código de 4 dígitos e envia por e-mail. |
| `POST` | `/api/auth/verify-email` | Público | Valida código de 4 dígitos (válido por 24h), libera acesso (`email_verified: 1`) e retorna token JWT. |
| `POST` | `/api/auth/resend-code` | Público | Reenvia novo código de verificação para o e-mail do usuário. |
| `POST` | `/api/auth/login` | Público | Realiza login com e-mail e senha. Requer e-mail verificado. Suporta verificação de perfil via `expected_role`. |
| `GET` | `/api/auth/me` | Autenticado | Retorna os dados do usuário autenticado a partir do token JWT. |

#### Exemplo de Registro (`POST /api/auth/register`)

```json
{
  "full_name": "Maria Silva",
  "email": "maria@exemplo.com",
  "password": "senhaSegura123",
  "user_type": "TRAVELER"
}
```

#### Exemplo de Verificação (`POST /api/auth/verify-email`)

```json
{
  "email": "maria@exemplo.com",
  "code": "4819"
}
```

---

### 2. Perfil de Usuário (`/api/users`)

| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Autenticado | Obtém os dados completos do perfil do usuário logado. |
| `PUT` | `/api/users/profile` | Autenticado | Atualiza informações do perfil (`full_name`, `profile_picture`). |
| `POST` | `/api/users/avatar` | Autenticado | Faz upload de arquivo de imagem para foto de perfil (`multipart/form-data`, campo: `avatar`). |

---

### 3. Locais & Estabelecimentos (`/api/places`)

| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/places` | Público / Viajante | Lista estabelecimentos com filtros avançados, ordenação e notas médias. |
| `GET` | `/api/places/:id` | Público / Viajante | Detalhes completos do local, estatísticas agregadas e avaliações. |
| `POST` | `/api/places` | **BUSINESS** | Cadastra um novo local (`multipart/form-data` ou `application/json`). |
| `PUT` | `/api/places/:id` | **BUSINESS** | Atualiza os dados e fotos de um local do proprietário. |
| `DELETE` | `/api/places/:id` | **BUSINESS** | Exclui um local pertencente ao usuário logado. |

#### Parâmetros de Busca e Filtros (`GET /api/places`)

- `search`: termo de busca textual (nome, descrição, endereço, cidade).
- `category`: `ACCOMMODATION`, `GASTRONOMY`, `TOURIST_ATTRACTION`, `OTHERS`.
- `city`, `state`: filtros por localização geográfica.
- `min_price`, `max_price`: filtro por faixa de preço (em centavos).
- `has_access_ramp`: `1` ou `true` (rampa de acesso).
- `has_adapted_bathroom`: `1` ou `true` (banheiro adaptado).
- `allows_guide_dog`: `1` ou `true` (permite cão-guia).
- `has_braille_signage`: `1` ou `true` (sinalização em Braille).
- `has_sign_language_interpreter`: `1` ou `true` (intérprete de Libras).
- `has_asd_friendly_space`: `1` ou `true` (espaço adaptado para TEA).
- `sort_by`: `rating_desc`, `rating_asc`, `price_asc`, `price_desc`, `name_asc`, `newest`.

---

### 4. Avaliações (`/api/reviews` & `/api/places/:placeId/reviews`)

| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/places/:placeId/reviews` | Público | Lista todas as avaliações de um local. |
| `POST` | `/api/places/:placeId/reviews` | **TRAVELER** | Cria uma avaliação para o local (`experience_rating`: 1 a 5, `accessibility_level`: `POOR`, `GOOD`, `EXCELLENT`, `comment_text`). |
| `PUT` | `/api/reviews/:id` | **TRAVELER** | Edita a avaliação criada pelo próprio viajante. |
| `DELETE` | `/api/reviews/:id` | **TRAVELER** | Remove a avaliação criada pelo próprio viajante. |
| `PATCH` | `/api/reviews/:id/reply` | **BUSINESS** | O proprietário do estabelecimento responde à avaliação recebida. |

---

### 5. Área da Empresa / Business Dashboard (`/api/business`)

| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/business/places` | **BUSINESS** | Lista todos os locais de posse do empresário logado, com contagem de reviews e alertas de respostas pendentes. |
| `GET` | `/api/business/stats` | **BUSINESS** | Retorna resumo consolidado para o dashboard web: total de locais, total de reviews, nota média geral, respostas pendentes e últimas avaliações recebidas. |

---

## 🔒 Segurança e Tratamento de Erros

- **Senhas Criptografadas**: As senhas são protegidas com salt e hash via `bcryptjs`.
- **Prevenção de Ataques**: Proteção com `helmet` para segurança de cabeçalhos e `cors` configurável.
- **Validações Consistentes**: Mensagens de erro claras e padronizadas em formato JSON (`statusCode`, `error`, `message`).
- **Upload Seguro**: O `multer` filtra apenas extensões de imagem permitidas (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`) e limita o tamanho máximo dos arquivos.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
