-- ===============================================
-- SCHEMA DO BANCO DE DADOS - SISTEMA BELLO MVP
-- Data: 29/05/2025
-- Desenvolvedor: Claude Sonnet
-- ===============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE tipo_usuario AS ENUM ('ADMINISTRADOR', 'PROFISSIONAL');
CREATE TYPE status_agendamento AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO');
CREATE TYPE status_comanda AS ENUM ('ABERTA', 'FECHADA', 'CANCELADA');
CREATE TYPE status_caixa AS ENUM ('ABERTO', 'FECHADO');
CREATE TYPE tipo_movimentacao AS ENUM ('ENTRADA', 'SAIDA', 'SANGRIA', 'REFORCO');
CREATE TYPE metodo_pagamento AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'OUTRO');

-- ===============================================
-- TABELA: empresa
-- ===============================================
CREATE TABLE empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT NOT NULL,
    logo_url VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TABELA: usuario (referencia Supabase Auth)
-- ===============================================
CREATE TABLE usuario (
    id UUID PRIMARY KEY, -- Mesmo ID do Supabase Auth
    email VARCHAR(255) NOT NULL UNIQUE,
    nome_completo VARCHAR(255) NOT NULL,
    tipo_usuario tipo_usuario NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TABELA: cliente
-- ===============================================
CREATE TABLE cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE,
    data_nascimento DATE,
    observacoes TEXT,
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TABELA: profissional
-- ===============================================
CREATE TABLE profissional (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL UNIQUE REFERENCES usuario(id) ON DELETE CASCADE,
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    especialidades TEXT[],
    horarios_trabalho JSONB, -- Ex: { "seg": ["09:00-12:00", "14:00-18:00"] }
    google_calendar_id VARCHAR(255),
    google_auth_tokens JSONB, -- Tokens criptografados
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TABELA: servico
-- ===============================================
CREATE TABLE servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    duracao_estimada_minutos INTEGER NOT NULL CHECK (duracao_estimada_minutos > 0),
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TABELA: produto
-- ===============================================
CREATE TABLE produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_custo DECIMAL(10,2) CHECK (preco_custo >= 0),
    preco_venda DECIMAL(10,2) NOT NULL CHECK (preco_venda >= 0),
    estoque_atual INTEGER NOT NULL DEFAULT 0 CHECK (estoque_atual >= 0),
    estoque_minimo INTEGER DEFAULT 0 CHECK (estoque_minimo >= 0),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TABELA: agendamento
-- ===============================================
CREATE TABLE agendamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    id_profissional UUID NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    data_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    observacoes TEXT,
    status status_agendamento NOT NULL DEFAULT 'PENDENTE',
    google_event_id VARCHAR(255),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT agendamento_data_valida CHECK (data_hora_fim > data_hora_inicio)
);

-- ===============================================
-- TABELA: agendamento_servico (relação many-to-many)
-- ===============================================
CREATE TABLE agendamento_servico (
    id_agendamento UUID NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,
    id_servico UUID NOT NULL REFERENCES servico(id) ON DELETE CASCADE,
    preco_cobrado_servico DECIMAL(10,2) NOT NULL CHECK (preco_cobrado_servico >= 0),
    PRIMARY KEY (id_agendamento, id_servico)
);

-- ===============================================
-- TABELA: caixa
-- ===============================================
CREATE TABLE caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_profissional_abertura UUID REFERENCES profissional(id),
    id_profissional_fechamento UUID REFERENCES profissional(id),
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (saldo_inicial >= 0),
    saldo_final_calculado DECIMAL(10,2) CHECK (saldo_final_calculado >= 0),
    saldo_final_informado DECIMAL(10,2) CHECK (saldo_final_informado >= 0),
    observacoes TEXT,
    status status_caixa NOT NULL DEFAULT 'ABERTO',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT caixa_fechamento_valido CHECK (
        (status = 'ABERTO' AND data_fechamento IS NULL) OR
        (status = 'FECHADO' AND data_fechamento IS NOT NULL)
    )
);

-- ===============================================
-- TABELA: comanda
-- ===============================================
CREATE TABLE comanda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID REFERENCES cliente(id),
    nome_cliente_avulso VARCHAR(255),
    id_profissional_responsavel UUID NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    id_caixa UUID NOT NULL REFERENCES caixa(id) ON DELETE CASCADE,
    id_empresa UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    valor_total_servicos DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_total_servicos >= 0),
    valor_total_produtos DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_total_produtos >= 0),
    valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_desconto >= 0),
    valor_total_pago DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_total_pago >= 0),
    metodo_pagamento metodo_pagamento,
    status status_comanda NOT NULL DEFAULT 'ABERTA',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT comanda_cliente_valido CHECK (
        (id_cliente IS NOT NULL AND nome_cliente_avulso IS NULL) OR
        (id_cliente IS NULL AND nome_cliente_avulso IS NOT NULL)
    ),
    CONSTRAINT comanda_fechamento_valido CHECK (
        (status = 'ABERTA' AND data_fechamento IS NULL AND metodo_pagamento IS NULL) OR
        (status = 'FECHADA' AND data_fechamento IS NOT NULL AND metodo_pagamento IS NOT NULL) OR
        (status = 'CANCELADA')
    )
);

-- ===============================================
-- TABELA: item_comanda
-- ===============================================
CREATE TABLE item_comanda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_comanda UUID NOT NULL REFERENCES comanda(id) ON DELETE CASCADE,
    id_servico UUID REFERENCES servico(id),
    id_produto UUID REFERENCES produto(id),
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario_registrado DECIMAL(10,2) NOT NULL CHECK (preco_unitario_registrado >= 0),
    preco_total_item DECIMAL(10,2) NOT NULL CHECK (preco_total_item >= 0),
    id_profissional_executante UUID REFERENCES profissional(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT item_comanda_tipo_valido CHECK (
        (id_servico IS NOT NULL AND id_produto IS NULL) OR
        (id_servico IS NULL AND id_produto IS NOT NULL)
    ),
    CONSTRAINT item_comanda_preco_valido CHECK (
        preco_total_item = preco_unitario_registrado * quantidade
    )
);

-- ===============================================
-- TABELA: movimentacao_caixa
-- ===============================================
CREATE TABLE movimentacao_caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_caixa UUID NOT NULL REFERENCES caixa(id) ON DELETE CASCADE,
    id_comanda UUID REFERENCES comanda(id),
    tipo_movimentacao tipo_movimentacao NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    descricao TEXT NOT NULL,
    id_profissional_responsavel UUID REFERENCES profissional(id),
    data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- TRIGGERS PARA UPDATED_AT
-- ===============================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_empresa
    BEFORE UPDATE ON empresa
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_usuario
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_cliente
    BEFORE UPDATE ON cliente
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_profissional
    BEFORE UPDATE ON profissional
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_servico
    BEFORE UPDATE ON servico
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_produto
    BEFORE UPDATE ON produto
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_agendamento
    BEFORE UPDATE ON agendamento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_caixa
    BEFORE UPDATE ON caixa
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_comanda
    BEFORE UPDATE ON comanda
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_item_comanda
    BEFORE UPDATE ON item_comanda
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================
CREATE INDEX idx_cliente_empresa ON cliente(id_empresa);
CREATE INDEX idx_profissional_usuario ON profissional(id_usuario);
CREATE INDEX idx_profissional_empresa ON profissional(id_empresa);
CREATE INDEX idx_servico_empresa ON servico(id_empresa);
CREATE INDEX idx_produto_empresa ON produto(id_empresa);
CREATE INDEX idx_agendamento_cliente ON agendamento(id_cliente);
CREATE INDEX idx_agendamento_profissional ON agendamento(id_profissional);
CREATE INDEX idx_agendamento_empresa ON agendamento(id_empresa);
CREATE INDEX idx_agendamento_data ON agendamento(data_hora_inicio, data_hora_fim);
CREATE INDEX idx_caixa_empresa ON caixa(id_empresa);
CREATE INDEX idx_caixa_status ON caixa(status);
CREATE INDEX idx_comanda_profissional ON comanda(id_profissional_responsavel);
CREATE INDEX idx_comanda_caixa ON comanda(id_caixa);
CREATE INDEX idx_comanda_empresa ON comanda(id_empresa);
CREATE INDEX idx_comanda_status ON comanda(status);
CREATE INDEX idx_item_comanda_comanda ON item_comanda(id_comanda);
CREATE INDEX idx_movimentacao_caixa_caixa ON movimentacao_caixa(id_caixa);
CREATE INDEX idx_movimentacao_caixa_data ON movimentacao_caixa(data_movimentacao);

-- ===============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ===============================================
COMMENT ON TABLE empresa IS 'Dados da empresa dona do salão';
COMMENT ON TABLE usuario IS 'Usuários do sistema, referencia Supabase Auth';
COMMENT ON TABLE cliente IS 'Clientes da empresa';
COMMENT ON TABLE profissional IS 'Profissionais que trabalham na empresa';
COMMENT ON TABLE servico IS 'Catálogo de serviços oferecidos';
COMMENT ON TABLE produto IS 'Catálogo de produtos com controle de estoque';
COMMENT ON TABLE agendamento IS 'Agendamentos dos clientes';
COMMENT ON TABLE agendamento_servico IS 'Serviços incluídos em cada agendamento';
COMMENT ON TABLE caixa IS 'Controle diário de caixa da empresa';
COMMENT ON TABLE comanda IS 'Comandas de atendimento dos clientes';
COMMENT ON TABLE item_comanda IS 'Itens (serviços/produtos) de cada comanda';
COMMENT ON TABLE movimentacao_caixa IS 'Todas as movimentações do caixa';

-- ===============================================
-- DADOS SEED - EMPRESA INICIAL
-- ===============================================
INSERT INTO empresa (nome_fantasia, razao_social, cnpj, telefone, endereco) 
VALUES (
    'Bolzan Estetic Hair',
    'Bolzan Estetic Hair Ltda',
    '12.345.678/0001-90',
    '(11) 99999-9999',
    'Rua das Flores, 123 - Centro - São Paulo/SP'
);

-- ===============================================
-- SCHEMA CRIADO COM SUCESSO!
-- Total de tabelas: 13
-- Total de índices: 18
-- Total de triggers: 10
-- =============================================== 