# 👥🧳 EXPERIÊNCIA DO USUÁRIO: Cadastros de Serviços e Profissionais

**Documento**: UX Guide - Sistema de Cadastros  
**Versão**: 1.1  
**Data**: Janeiro 2025  
**Sistema**: BelloProject - Gestão para Salão de Beleza

---

## 🚀 ATUALIZAÇÃO IMPORTANTE

### ✅ Opções Adicionadas ao Menu!
As funcionalidades **Serviços** e **Profissionais** foram **adicionadas ao menu lateral** do sistema:

```
📍 Menu Principal (Sidebar):
├── 📊 Dashboard
├── 👥 Clientes  
├── 📅 Agendamentos
├── ✂️ Serviços        ← 🆕 NOVO!
├── 👤 Profissionais   ← 🆕 NOVO!
├── 🧾 Comandas
├── 💰 Caixa
├── 📦 Produtos
├── 📊 Relatórios
└── ⚙️ Configurações
```

### 🎯 Como Acessar
- **Serviços**: Clique em "✂️ Serviços" no menu lateral
- **Profissionais**: Clique em "👤 Profissionais" no menu lateral

---

## 🎯 Visão Geral

O BelloProject oferece uma experiência intuitiva e profissional para gerenciar o **catálogo de serviços** e a **equipe de profissionais** do salão. Ambos os fluxos foram projetados para máxima facilidade de uso, com validações inteligentes e feedback visual em tempo real.

---

## 🧳 EXPERIÊNCIA: Cadastro de Serviços

### 📍 Acesso ao Sistema
**Navegação**: `Menu Principal → ✂️ Serviços`  
**URL**: `/servicos`  
**Ícone**: ✂️ (ContentCut)

### 🎨 Interface Principal (ServiçosPage)

#### **Header Profissional**
```
🎨 Gestão de Serviços
   Gerencie o catálogo de serviços do seu salão
                                    [+ Novo Serviço]
```

#### **Visualização em Grid**
- **Layout**: Cards organizados em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
- **Informações por Card**:
  - 📝 Nome do serviço (destaque)
  - 📄 Descrição (truncada em 100 chars)
  - 💰 Preço (formato monetário BRL)
  - ⏱️ Duração (chip colorido)
  - ⚙️ Menu de ações (3 pontos)

#### **Controles de Navegação**
- 🔍 **Busca**: Campo de pesquisa por nome ou descrição
- 📊 **Ordenação**: Nome, Preço, Duração, Data de Cadastro
- 🔢 **Paginação**: 10 itens por página
- 🔄 **Refresh**: Botão para atualizar lista
- 📈 **Contador**: "Total: X serviços"

### ✨ Fluxo de Cadastro (ServicoForm)

#### **Passo 1: Clique em "Novo Serviço"**
- Modal full-screen se abre com animação suave
- Header personalizado com ícone ✂️
- Título: "Novo Serviço" (ou "Editar Serviço")

#### **Passo 2: Formulário Inteligente**

**📝 Informações Básicas**
```
Nome do Serviço* (obrigatório)
├─ Placeholder: "Ex: Corte Feminino, Manicure, Coloração..."
├─ Validação: 2-255 caracteres
└─ Foco automático

Descrição (opcional)
├─ Campo de texto multilinha (3 linhas)
├─ Placeholder: "Descreva o serviço, incluindo o que está incluso..."
└─ Limite: 1000 caracteres
```

**💰 Configurações Financeiras**
```
Preço* (obrigatório)
├─ Ícone: 💰 AttachMoney
├─ Formato automático: R$ 0,00
├─ Validação: R$ 0,01 - R$ 9.999,99
├─ Conversão vírgula→ponto automática
└─ Preview em tempo real
```

**⏱️ Configurações de Tempo**
```
Duração (minutos)* (obrigatório)
├─ Ícone: ⏱️ AccessTime
├─ Campo numérico com step de 5
├─ Validação: 5-1440 minutos (24h max)
├─ Helper text: "Duração: 30 minutos"
└─ Preview em tempo real
```

#### **Passo 3: Preview Inteligente**
```
📋 Preview do Serviço:
    Preço: R$ 50,00    Duração: 1h 30min
```
- Aparece automaticamente quando preço > 0 ou duração > 0
- Formatação profissional em tempo real

#### **Passo 4: Validação & Salvamento**
- ✅ Validação em tempo real com Zod
- 🚨 Alert de erros com mensagens específicas
- 💾 Botão inteligente: "Salvando..." → "Salvar" → "Atualizar"
- 🔄 Loading state com CircularProgress

### 🎉 Feedback de Sucesso
```
✅ Notificação: "Serviço [Nome] foi cadastrado com sucesso!"
📱 Snackbar verde no canto inferior direito
🔄 Lista atualizada automaticamente
📝 Modal fecha automaticamente
```

---

## 👥 EXPERIÊNCIA: Cadastro de Profissionais

### 📍 Acesso ao Sistema
**Navegação**: `Menu Principal → 👤 Profissionais`  
**URL**: `/profissionais`  
**Ícone**: 👤 (Work)

### 🎨 Interface Principal (ProfissionaisPage)

#### **Header Profissional**
```
👤 Gestão de Profissionais
   Gerencie sua equipe de profissionais e especialidades
                                    [+ Novo Profissional]
```

#### **Visualização em Tabela**
- **Layout**: Tabela responsiva com colunas organizadas
- **Colunas**:
  - 👤 **Profissional**: Avatar + Nome + Tipo de usuário
  - 📞 **Contato**: Email (com ícone)
  - 🎯 **Especialidades**: Chips coloridos (máx 3 visíveis)
  - ⏰ **Horários**: "Em desenvolvimento" ou configurados
  - ⚙️ **Ações**: Menu dropdown

#### **Recursos Avançados**
- 🎨 **Avatars coloridos**: Cores baseadas em hash do nome
- 🏷️ **Chips especializados**: Cores específicas por especialidade
- 📱 **Design responsivo**: Adapta para mobile/tablet
- 🔍 **Busca avançada**: Nome, email ou especialidade

### ✨ Fluxo de Cadastro (ProfissionalForm)

#### **Passo 1: Clique em "Novo Profissional"**
- Modal extra-large com layout organizacional
- Header com ícone 👤 Person
- Estrutura em seções bem definidas

#### **Passo 2: Informações Pessoais**

**📝 Dados Básicos**
```
Nome Completo* (obrigatório)
├─ Foco automático
├─ Validação: 2-255 caracteres
└─ Usado para avatar e identificação

Email* (obrigatório)
├─ Validação de formato email
├─ Campo tipo email para teclado otimizado
└─ Único no sistema

Telefone* (obrigatório)
├─ Formatação automática: (11) 99999-9999
├─ Máscara dinâmica para 10/11 dígitos
├─ Helper text: "Ex: (11) 99999-9999"
└─ Validação: 10-15 caracteres
```

#### **Passo 3: Especialidades**

**🎯 Seleção Múltipla Inteligente**
```
Especialidades* (obrigatório)
├─ Autocomplete com opções pré-definidas:
│   • Corte, Coloração, Manicure, Pedicure
│   • Depilação, Estética, Massagem
│   • Sobrancelha, Maquiagem, Escova
│   • Hidratação, Relaxamento
├─ Chips coloridos para selecionados
├─ Busca dinâmica nas opções
└─ Mínimo: 1 especialidade
```

**📋 Preview Dinâmico**
```
🎯 Especialidades Selecionadas:
    [Corte] [Coloração] [Manicure]
```
- Aparece conforme seleção
- Chips coloridos por especialidade
- Feedback visual imediato

#### **Passo 4: Horários de Trabalho**

**⏰ Configuração (Em Desenvolvimento)**
```
📅 Horários de Trabalho (Opcional)
   Configure os horários para facilitar agendamentos

ℹ️ Funcionalidade em desenvolvimento:
   A configuração detalhada será implementada na próxima versão.
   Por enquanto, pode ser configurado posteriormente.
```

#### **Passo 5: Validação & Salvamento**
- ✅ Validação em tempo real com Zod
- 🚨 Alert consolidado de erros
- 💾 Estados: "Salvando..." → "Salvar" → "Atualizar"
- 🔄 Loading states específicos

### 🎉 Feedback de Sucesso
```
✅ Notificação: "Profissional [Nome] foi cadastrado com sucesso!"
📱 Snackbar verde no canto inferior direito
🔄 Lista atualizada automaticamente
📝 Modal fecha automaticamente
```

---

## 🔗 Integração com Agendamentos

### 🎯 Como os Cadastros se Conectam

#### **No Formulário de Agendamento**
```
Passo 1: Cliente
Passo 2: → Serviço (dropdown com serviços cadastrados)
Passo 3: → Profissional (dropdown filtrado por especialidade)
Passo 4: Data e Hora
```

#### **Lógica Inteligente**
- 🔍 **Serviços**: Lista todos os serviços ativos
- 👥 **Profissionais**: Filtra por especialidade do serviço selecionado
- ⏱️ **Duração**: Puxada automaticamente do serviço
- 💰 **Preço**: Calculado com base no serviço

---

## 🎨 Design System & UX

### **🎨 Padrões Visuais**

#### **Cores & Estados**
- 🟢 **Sucesso**: Verde (#4CAF50) - Confirmações e sucessos
- 🔴 **Erro**: Vermelho (#F44336) - Validações e erros  
- 🟡 **Warning**: Laranja (#FF9800) - Alertas e avisos
- 🔵 **Primary**: Azul (#2196F3) - Ações principais
- ⚫ **Chips**: Cores específicas por especialidade/status

#### **Iconografia Consistente**
- ✂️ **Serviços**: ContentCut (tesoura)
- 👤 **Profissionais**: Person
- 💰 **Preços**: AttachMoney
- ⏱️ **Tempo**: AccessTime/Schedule
- 🎯 **Especialidades**: Work

### **📱 Responsividade**

#### **Breakpoints**
- 📱 **Mobile** (xs): Cards 1 coluna, formulários stack
- 📟 **Tablet** (md): Cards 2 colunas, formulários 2 colunas
- 💻 **Desktop** (lg+): Cards 3 colunas, formulários completos

#### **Comportamentos Adaptativos**
- 📝 **Formulários**: Campos reorganizados por linha
- 📊 **Listas**: Tabela → Cards no mobile
- 🎛️ **Controles**: Filtros verticais no mobile

---

## ⚡ Performance & Otimizações

### **🔄 Loading States**

#### **Lista de Serviços/Profissionais**
- 💀 **Skeleton**: Cards com animação shimmer
- 🔄 **Progressive**: 6 skeletons → dados reais
- ⏱️ **Debounce**: Busca com 500ms delay

#### **Formulários**
- 🎯 **Smart Validation**: Validação apenas em onChange
- 💾 **Submit States**: Botão com loading e disabled
- 🔄 **Auto-refresh**: Lista atualizada após save

### **📊 Paginação & Filtros**
- 📄 **Chunking**: 10 itens por página (otimizado)
- 🔍 **Search**: Busca client-side para performance
- 📈 **Metrics**: Contador total em tempo real

---

## 🏗️ Arquitetura Técnica

### **🗂️ Estrutura de Arquivos**
```
src/
├── app/
│   ├── servicos/page.tsx      # Página principal serviços
│   └── profissionais/page.tsx # Página principal profissionais
├── components/
│   ├── servicos/
│   │   ├── ServicoForm.tsx    # Modal de cadastro
│   │   ├── ServicosList.tsx   # Lista com grid
│   │   └── ConfirmDeleteDialog.tsx
│   └── profissionais/
│       ├── ProfissionalForm.tsx # Modal de cadastro
│       ├── ProfissionaisList.tsx # Lista tabular
│       └── ConfirmDeleteDialog.tsx
└── services/
    ├── servicos.service.ts    # CRUD serviços
    └── profissionais.service.ts # CRUD profissionais
```

### **🔧 Stack Tecnológico**
- ⚛️ **Frontend**: React 18 + TypeScript
- 🎨 **UI**: Material-UI (MUI) v5
- 📝 **Forms**: React Hook Form + Zod validation
- 🗄️ **Backend**: Supabase (PostgreSQL)
- 🔗 **API**: RESTful com TypeScript interfaces

### **🛡️ Validações & Segurança**
- 🔒 **Frontend**: Zod schemas com TypeScript
- 🔒 **Backend**: Supabase RLS (Row Level Security)
- 🏢 **Multi-tenant**: Isolamento por empresa
- ✅ **Sanitização**: Inputs sanitizados automaticamente

---

## 🎯 Próximas Melhorias (Roadmap)

### **⭐ Fase 7: Categorização de Serviços**
- 🏷️ **Categorias**: Cabelo, Unha, Estética, etc.
- 🔍 **Filtros**: Por categoria na lista
- 📊 **Analytics**: Relatórios por categoria

### **⭐ Fase 8: Horários de Trabalho**
- 📅 **Configuração**: Interface visual para horários
- 🗓️ **Dias específicos**: Segunda a domingo
- ⏰ **Intervalos**: Múltiplos horários por dia
- 🚫 **Indisponibilidades**: Férias, folgas, etc.

### **⭐ Fase 9: Comissões & Metas**
- 💰 **Comissões**: % por serviço para profissionais
- 🎯 **Metas**: Objetivos mensais/semanais
- 📈 **Dashboard**: Performance da equipe

---

## 📋 Checklist de Teste

### **✅ Serviços**
- [ ] Criar serviço com dados mínimos
- [ ] Criar serviço com todos os campos
- [ ] Editar serviço existente
- [ ] Validar preços extremos (R$ 0,01 e R$ 9.999,99)
- [ ] Validar durações extremas (5min e 1440min)
- [ ] Testar busca por nome e descrição
- [ ] Testar ordenação por todas as opções
- [ ] Excluir serviço com confirmação

### **✅ Profissionais**
- [ ] Criar profissional com dados básicos
- [ ] Selecionar múltiplas especialidades
- [ ] Editar profissional existente
- [ ] Validar formatos de email e telefone
- [ ] Testar busca por nome e especialidade
- [ ] Testar filtros de ordenação
- [ ] Verificar integração com agendamentos
- [ ] Excluir profissional com confirmação

### **✅ Integração**
- [ ] Serviços aparecem no formulário de agendamento
- [ ] Profissionais filtrados por especialidade
- [ ] Duração e preço carregados automaticamente
- [ ] Validação de conflitos funcionando
- [ ] Performance adequada com 50+ registros

---

**🎉 CONCLUSÃO**: O sistema oferece uma experiência profissional e intuitiva para gerenciar serviços e profissionais, com validações robustas, feedback visual excelente e integração perfeita com o sistema de agendamentos. 