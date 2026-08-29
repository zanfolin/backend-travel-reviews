# Prompt de Especificação e Prototipagem de Telas: AccessTrip (Mobile & Web)

Instruções para a IA Executora: Você é um especialista sênior em Arquitetura de Informação, UX/UI e Engenharia de Software. Sua missão é criar a especificação funcional completa e agnóstica de telas (wireframes estruturais, fluxos e regras de interação) para as duas interfaces da plataforma **AccessTrip**:

1. **App Mobile** voltado para Viajantes (`TRAVELER`).
2. **Web Dashboard** voltado para Estabelecimentos / Parceiros (`BUSINESS`).

---

## 🧭 1. Visão Geral do Sistema e Contratos da API

O **AccessTrip** é uma plataforma de turismo acessível onde estabelecimentos divulgam suas instalações inclusivas e viajantes avaliam a infraestrutura de acessibilidade.

### 1.1 Regras Centrais de Acesso e Negócio

1. **Dois Perfis Estritamente Isolados**:
   - `TRAVELER`: Utiliza o App Mobile. Busca estabelecimentos, filtra por recursos de acessibilidade, visualiza e posta avaliações/fotos de perfil.
   - `BUSINESS`: Utiliza o Web Dashboard. Gerencia seus estabelecimentos (CRUD), responde avaliações recebidas e analisa métricas consolidadas.
   - *Regra de Isolamento*: Um perfil não acessa o ambiente do outro (validação obrigatória via `expected_role` no login).

2. **Ativação Obrigatória por Código de 4 Dígitos via E-mail**:
   - Todo cadastro inicia com `email_verified = 0`.
   - Um código numérico de 4 dígitos é gerado com validade estrita de **24 horas**.
   - O usuário só pode efetuar login e navegar após validar o código (`email_verified = 1`).
   - Existe ação de reenvio de código caso expire ou seja perdido.

3. **Contratos de Dados e Enums**:
   - `user_type`: `'TRAVELER'` | `'BUSINESS'`
   - `category`: `'ACCOMMODATION'` (Hospedagem), `'GASTRONOMY'` (Gastronomia), `'TOURIST_ATTRACTION'` (Ponto Turístico), `'OTHERS'` (Outros)
   - `accessibility_level`: `'POOR'` (Ruim), `'GOOD'` (Bom), `'EXCELLENT'` (Excelente)
   - `experience_rating`: Número inteiro de `1` a `5` estrelas.
   - `price`: Número decimal / valor em centavos (ex: `15000` = R$ 150,00; `0` = Gratuito).
   - **6 Flags de Acessibilidade (Booleanas `true`/`false` ou `1`/`0`)**:
     1. `has_access_ramp` (Rampa de acesso)
     2. `has_adapted_bathroom` (Banheiro adaptado)
     3. `allows_guide_dog` (Permite cão-guia)
     4. `has_braille_signage` (Sinalização em Braille)
     5. `has_sign_language_interpreter` (Intérprete de Libras)
     6. `has_asd_friendly_space` (Espaço adaptado para pessoas com TEA)

---

## 📱 PARTE 1: Especificação das Telas do App Mobile (Perfil TRAVELER)

### 📲 Tela M1: Boas-vindas & Onboarding

- **Objetivo**: Apresentar o propósito inclusivo do app e direcionar para Login ou Cadastro.
- **Componentes**:
  - Apresentação em carrossel ou cards explicativos sobre busca de locais acessíveis e avaliações da comunidade.
  - Botão de Ação Primária: "Criar Conta de Viajante".
  - Botão de Ação Secundária: "Já tenho uma conta (Entrar)".
- **Regras e Fluxos**:
  - Se o usuário já tiver um token JWT válido armazenado localmente (`TRAVELER`), redireciona direto para a Tela M5 (Home Feed).

---

### 📲 Tela M2: Cadastro de Viajante (Register)

- **Objetivo**: Registrar um novo usuário `TRAVELER`.
- **Componentes**:
  - Campo de Entrada: Nome Completo (`full_name`) - *preenchimento inicial*.
  - Campo de Entrada: E-mail (`email`) - *obrigatório, validação de formato*.
  - Campo de Entrada: Senha (`password`) - *obrigatório, mínimo 6 caracteres, visualização alternável de senha*.
  - Campo de Entrada: Confirmação de Senha.
  - Botão: "Cadastrar e Receber Código".
  - Link de navegação: "Já tem uma conta? Faça Login".
- **Comportamento e Regras da API**:
  - Dispara `POST /api/auth/register` com `user_type: "TRAVELER"`.
  - Em caso de sucesso: Redireciona imediatamente para a **Tela M3 (Verificação de E-mail)** passando o e-mail cadastrado.
  - Em caso de erro 409: Alerta que o e-mail já existe.

---

### 📲 Tela M3: Verificação de E-mail (Código de 4 Dígitos)

- **Objetivo**: Validar a posse do e-mail para liberar o acesso ao aplicativo.
- **Componentes**:
  - Texto de instrução informando o e-mail para o qual o código foi enviado.
  - Mensagem de aviso: "O código expira em 24 horas".
  - 4 Campos individuais para inserção de cada dígito numérico (com autofoco sequencial e suporte a colagem de código).
  - Botão Primário: "Verificar Código".
  - Botão/Link Secundário com temporizador: "Não recebeu? Reenviar código" (`POST /api/auth/resend-code`).
  - Link: "Voltar para o Login / Alterar E-mail".
- **Comportamento e Regras da API**:
  - Dispara `POST /api/auth/verify-email` com `{ email, code }`.
  - Sucesso: Armazena o token JWT retornado, atualiza estado global e redireciona para a **Tela M5 (Home Feed)**.
  - Erro de código inválido ou expirado (> 24h): Exibe mensagem clara permitindo solicitar novo código.

---

### 📲 Tela M4: Login do Viajante

- **Objetivo**: Autenticar o viajante existente.
- **Componentes**:
  - Campo de Entrada: E-mail.
  - Campo de Entrada: Senha.
  - Botão: "Entrar".
  - Link de recuperação / Reenvio de verificação.
  - Link: "Não possui cadastro? Crie sua conta".
- **Comportamento e Regras da API**:
  - Dispara `POST /api/auth/login` com `{ email, password, expected_role: "TRAVELER" }`.
  - Se retornar `403` com `requiresVerification: true`: Redireciona para a **Tela M3** para inserção do código.
  - Se retornar `403` com perfil incompatível (ex: usuário é `BUSINESS`): Exibe alerta informando que a conta é corporativa e deve ser acessada via Web.
  - Sucesso: Salva token JWT e direciona para a **Tela M5 (Home Feed)**.

---

### 📲 Tela M5: Home / Feed de Estabelecimentos Acessíveis

- **Objetivo**: Lista interativa de locais com busca rápida, chips de categoria e paginação infinita.
- **Componentes**:
  - Barra de Busca Superior: Campo de texto livre para busca por nome, endereço ou cidade (`search`).
  - Botão de Atalho para Filtros Avançados (abre Tela M6).
  - Seletor Horizontal de Categorias (Chips): "Todos", "Hospedagem", "Gastronomia", "Pontos Turísticos", "Outros".
  - Seletor de Ordenação rápida (`sort_by`): "Mais Recentes", "Melhor Avaliados", "Menor Preço", "Maior Preço", "Ordem Alfabética".
  - Lista de Cards de Estabelecimentos:
    - Foto principal (`main_image`) com placeholder acessível.
    - Nome do local (`establishment_name`) e Categoria.
    - Localização (`city`, `state`).
    - Faixa de preço / Preço formatado em Reais (`price`).
    - Média de avaliações em estrelas (`average_rating`) e contador (`total_reviews`).
    - Barra de Ícones com as 6 tags de acessibilidade (destacando ativas/inativas).
  - Controle de Paginação: Rolagem infinita (*Infinite Scroll*) ou Botão "Carregar Mais" usando `page` e `limit`.
  - Estados: Indicador de carregamento (Skeleton), Estado Vazio ("Nenhum local encontrado com estes filtros") com botão para limpar filtros.
  - Barra de Navegação Inferior (Bottom Bar):
    - Aba 1: Explorar (Home).
    - Aba 2: Meu Perfil.
- **Regras de API**:
  - `GET /api/places?page=1&limit=10&search=...&category=...&sort_by=...`

---

### 📲 Tela M6: Modal / Painel de Filtros de Acessibilidade

- **Objetivo**: Refinar a busca com múltiplos critérios de acessibilidade e geolocalização.
- **Componentes**:
  - Filtros de Acessibilidade com switches (Liga/Desliga):
    - Rampa de acesso (`has_access_ramp`)
    - Banheiro adaptado (`has_adapted_bathroom`)
    - Permite cão-guia (`allows_guide_dog`)
    - Sinalização em Braille (`has_braille_signage`)
    - Intérprete de Libras (`has_sign_language_interpreter`)
    - Espaço adaptado para TEA (`has_asd_friendly_space`)
  - Filtros de Localização: Campo de Cidade (`city`) e Estado (`state`).
  - Filtro de Faixa de Preço: Slider ou campos de Preço Mínimo (`min_price`) e Máximo (`max_price`).
  - Botão Secundário: "Limpar Filtros".
  - Botão Primário: "Aplicar Filtros (Ver Resultados)".

---

### 📲 Tela M7: Detalhes do Estabelecimento

- **Objetivo**: Apresentação profunda do local, infraestrutura, métricas de acessibilidade e comentários.
- **Componentes**:
  - Galeria / Foto de Destaque com botão de voltar e botão de compartilhar.
  - Cabeçalho com Nome, Categoria, Cidade/UF e Endereço Completo.
  - Preço do serviço / entrada.
  - Descrição detalhada do local.
  - Bloco em Destaque: **Recursos de Acessibilidade Confirmados** (Grade com os 6 itens indicando presença `true` ou ausência `false`).
  - Bloco de Métricas de Avaliação:
    - Nota média geral (ex: 4.8 / 5.0).
    - Distribuição do nível de acessibilidade percebido pela comunidade: contadores de `EXCELLENT`, `GOOD` e `POOR`.
  - Botão Flutuante ou de Destaque: "Avaliar este Local" (Abre Tela M8 - exclusivo para viajantes logados).
  - Lista de Avaliações dos Viajantes:
    - Avatar e Nome do Viajante.
    - Data da publicação.
    - Nota de experiência (1 a 5 estrelas).
    - Badge do Nível de Acessibilidade atribuído (`EXCELLENT` / `GOOD` / `POOR`).
    - Texto do comentário (`comment_text`).
    - **Resposta do Estabelecimento** (caso exista `owner_reply_text`, exibida em bloco destacado "Resposta do Proprietário").
    - Se a avaliação pertencer ao viajante logado: Botões de ação "Editar" e "Excluir".
- **Regras de API**:
  - `GET /api/places/:id` (inclui estatísticas e lista aninhada de reviews).

---

### 📲 Tela M8: Formulário de Avaliação (Criar / Editar Avaliação)

- **Objetivo**: Permitir ao viajante registrar ou atualizar sua experiência no estabelecimento.
- **Componentes**:
  - Identificação do local sendo avaliado (Nome e Cidade).
  - Seletor de Nota de Experiência: 1 a 5 estrelas interativas (`experience_rating`).
  - Seletor de Nível Geral de Acessibilidade (`accessibility_level`):
    - Opções: `POOR` (Ruim) | `GOOD` (Bom) | `EXCELLENT` (Excelente).
  - Área de Texto: Comentário detalhado sobre a acessibilidade encontrada (`comment_text`).
  - Botão de Submissão: "Publicar Avaliação" (ou "Salvar Alterações").
- **Comportamento e Regras da API**:
  - Criação: `POST /api/places/:placeId/reviews` (Requer token de `TRAVELER`).
  - Edição: `PUT /api/reviews/:id`.
  - Exclusão: Modal de confirmação com `DELETE /api/reviews/:id`.

---

### 📲 Tela M9: Perfil do Viajante

- **Objetivo**: Gestão de dados pessoais e foto de perfil.
- **Componentes**:
  - Avatar atual com botão de sobreposição para alteração de foto (Câmera / Galeria via Multer `POST /api/users/avatar`).
  - Nome completo (`full_name`) com opção de edição inline.
  - E-mail (somente leitura, com selo "Verificado").
  - Tipo de conta: Viajante (`TRAVELER`).
  - Botão: "Salvar Alterações do Perfil" (`PUT /api/users/profile`).
  - Botão: "Sair da Conta (Logout)" (Limpa token local e redireciona para Tela M1).

---

## 💻 PARTE 2: Especificação das Telas do Web Dashboard (Perfil BUSINESS)

### 🖥 Tela W1: Autenticação da Empresa (Login & Registro Web)

- **Objetivo**: Acesso exclusivo de estabelecimentos e parceiros comerciais.
- **Componentes**:
  - Alternador de Abas: "Entrar" e "Cadastrar Empresa".
  - **Formulário de Entrada**:
    - E-mail Corporativo e Senha.
    - Botão "Acessar Painel".
    - Validação de `expected_role: "BUSINESS"`.
  - **Formulário de Cadastro**:
    - Razão Social / Nome da Empresa (`full_name`).
    - E-mail Comercial (`email`).
    - Senha e Confirmação de Senha (mínimo 6 dígitos).
    - Botão "Cadastrar Estabelecimento".
- **Regras da API**:
  - Login dispara `POST /api/auth/login` com `expected_role: "BUSINESS"`.
  - Se `email_verified = 0`, direciona para a Tela W2 (Verificação de E-mail Web).
  - Se um usuário `TRAVELER` tentar logar nesta tela, o backend retornará `403`, exibindo mensagem de que o acesso Web é restrito a empresas.

---

### 🖥 Tela W2: Verificação de E-mail Web

- **Objetivo**: Tela de digitação do código de 4 dígitos enviado ao e-mail comercial.
- **Componentes**:
  - Indicador do e-mail de destino.
  - Aviso de expiração de 24 horas.
  - Campo centralizado para digitação dos 4 dígitos.
  - Botão: "Validar e Liberar Acesso ao Dashboard".
  - Botão de Reenvio: "Reenviar Código".
- **Regras da API**:
  - Dispara `POST /api/auth/verify-email`. Sucesso direciona para Tela W3.

---

### 🖥 Tela W3: Dashboard Principal (Visão Geral & Indicadores)

- **Objetivo**: Painel de inteligência de dados e controle das avaliações do estabelecimento.
- **Componentes**:
  - Barra Superior (Header): Identificação do estabelecimento logado, foto/logo e botão de Logout.
  - Menu de Navegação Lateral (Sidebar):
    - Visão Geral (Dashboard)
    - Meus Locais
    - Cadastrar Novo Local
    - Central de Avaliações
    - Perfil da Empresa
  - **Cards de Métricas Principais (KPIs)**:
    - Card 1: Total de Estabelecimentos Cadastrados (`total_places`).
    - Card 2: Total de Avaliações Recebidas (`total_reviews`).
    - Card 3: Nota Média de Satisfação (`average_rating` de 1 a 5).
    - Card 4 (Alerta de Ação): Avaliações Aguardando Resposta (`pending_replies_count`).
  - **Painel Gráfico**: Distribuição de estabelecimentos por categoria (`category_distribution`).
  - **Tabela de Avaliações Recentes**:
    - Nome do Local avaliado.
    - Nome e foto do viajante.
    - Nota de experiência e nível de acessibilidade atribuído.
    - Trecho do comentário.
    - Status de resposta: Badge "Respondido" ou "Pendente".
    - Botão de Ação Rápida: "Responder" (Abre modal de resposta imediata).
- **Regras de API**:
  - `GET /api/business/stats`

---

### 🖥 Tela W4: Meus Estabelecimentos (Listagem e Gestão)

- **Objetivo**: Tabela completa com todos os estabelecimentos pertencentes ao usuário logado.
- **Componentes**:
  - Botão de Ação Primária: "+ Novo Estabelecimento" (leva à Tela W5).
  - Barra de filtro/busca local por nome da unidade.
  - Tabela / Grade de Estabelecimentos:
    - Miniatura da Imagem Principal (`main_image`).
    - Nome do Estabelecimento (`establishment_name`).
    - Categoria (`category`).
    - Cidade / UF (`city`, `state`).
    - Preço Base (`price`).
    - Nota Média (`average_rating`) e Total de Reviews (`total_reviews`).
    - Resumo dos 6 itens de acessibilidade habilitados (ícones de status).
    - Contador de Respostas Pendentes (`pending_replies`).
    - Coluna de Ações:
      - Botão "Ver no App / Detalhes".
      - Botão "Editar" (leva à Tela W5 preenchida).
      - Botão "Excluir" (Modal de confirmação com `DELETE /api/places/:id`).
- **Regras de API**:
  - `GET /api/business/places`

---

### 🖥 Tela W5: Cadastro e Edição de Estabelecimento (Formulário Completo)

- **Objetivo**: Formulário para criar ou atualizar dados e itens de acessibilidade de um local.
- **Componentes**:
  - **Seção 1: Dados Gerais**:
    - Nome do Estabelecimento (`establishment_name`) - *Obrigatório*.
    - Categoria (`category`) - *Select com ACCOMMODATION, GASTRONOMY, TOURIST_ATTRACTION, OTHERS*.
    - Preço principal / Ingresso em Reais (`price`) - *Conversão automática para centavos no envio*.
    - Descrição detalhada (`description`) - *Textarea para informações adicionais e serviços oferecidos*.
  - **Seção 2: Localização**:
    - Endereço Completo em texto único (`full_address`) - *Obrigatório*.
    - Cidade (`city`) e Estado (`state`) - *Obrigatórios*.
  - **Seção 3: Imagem do Local**:
    - Componente de upload de imagem (`multipart/form-data` no campo `image` via Multer) com pré-visualização ou campo de URL de imagem externa (`main_image`).
  - **Seção 4: Infraestrutura de Acessibilidade (Checkboxes / Switches obrigatórios)**:
    - Possui Rampa de Acesso (`has_access_ramp`)
    - Possui Banheiro Adaptado (`has_adapted_bathroom`)
    - Permite Entrada de Cão-Guia (`allows_guide_dog`)
    - Possui Sinalização em Braille (`has_braille_signage`)
    - Possui Intérprete de Libras (`has_sign_language_interpreter`)
    - Possui Espaço Adaptado para Pessoas com TEA (`has_asd_friendly_space`)
  - **Ações**:
    - Botão "Cancelar / Voltar".
    - Botão "Salvar Estabelecimento" (`POST /api/places` na criação ou `PUT /api/places/:id` na edição).
- **Regras de Validação**:
  - Campos não podem ser enviados vazios; flags booleanas devem ser convertidas para `1`/`0` ou booleanos conforme contrato.

---

### 🖥 Tela W6: Central de Avaliações & Resposta do Proprietário

- **Objetivo**: Gerenciar o relacionamento com os viajantes e responder aos feedbacks recebidos.
- **Componentes**:
  - Filtro por Unidade / Estabelecimento e filtro por status ("Todas", "Pendentes de Resposta", "Respondidas").
  - Lista de Cards de Avaliação:
    - Cabeçalho: Nome do Estabelecimento, Data, Viajante, Nota (1-5) e Badge de Nível (`EXCELLENT`/`GOOD`/`POOR`).
    - Corpo: Comentário do Viajante (`comment_text`).
    - Bloco de Resposta:
      - Se já respondido: Exibe texto da resposta existente com data de atualização.
      - Se pendente: Campo de texto expansível (`owner_reply_text`) com botão "Enviar Resposta Oficial".
- **Regras de API**:
  - Dispara `PATCH /api/reviews/:id/reply` com `{ owner_reply_text: "..." }`.

---

### 🖥 Tela W7: Perfil Corporativo

- **Objetivo**: Visualizar e atualizar dados da conta empresarial.
- **Componentes**:
  - Upload de Logotipo da Empresa (`POST /api/users/avatar`).
  - Razão Social / Nome (`full_name`).
  - E-mail de Contato (somente leitura, verificado).
  - Botão "Salvar Alterações" (`PUT /api/users/profile`).

---

## 🎯 3. Critérios de Aceite para a IA de Prototipagem

Ao gerar os protótipos a partir deste documento, a IA deve certificar-se de:

1. **Cobrir 100% das telas descritas** tanto no Mobile (M1 a M9) quanto na Web (W1 a W7).
2. **Representar visualmente todos os 6 itens de acessibilidade** em todas as telas de exibição, filtro e formulário.
3. **Respeitar os fluxos de bloqueio por e-mail**: Nenhuma tela interna pode ser acessível sem que o usuário passe pelo estágio de validação do código de 4 dígitos.
4. **Isolar completamente os perfis**: As telas do viajante nunca exibem opções de edição de local nem formulários de resposta do proprietário; as telas de empresa nunca exibem opções para postar reviews de viajante.
5. **Apresentar todos os estados de interface**: Sucesso, Erro de Validação de Campos, Loading (Carregamento) e Estado Vazio (sem registros).
