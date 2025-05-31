-- ===============================================
-- MIGRAÇÃO: Suporte a Serviços Avulsos
-- Data: Janeiro 2025
-- ===============================================

-- 1. Adicionar campos para serviços avulsos na tabela item_comanda
ALTER TABLE item_comanda 
ADD COLUMN nome_servico_avulso VARCHAR(255),
ADD COLUMN descricao_servico_avulso TEXT;

-- 2. Remover constraint que obriga ter id_servico OU id_produto
ALTER TABLE item_comanda 
DROP CONSTRAINT item_comanda_tipo_valido;

-- 3. Criar nova constraint que permite serviços avulsos
ALTER TABLE item_comanda 
ADD CONSTRAINT item_comanda_tipo_valido CHECK (
    -- Serviço cadastrado
    (id_servico IS NOT NULL AND id_produto IS NULL AND nome_servico_avulso IS NULL) OR
    -- Produto cadastrado  
    (id_servico IS NULL AND id_produto IS NOT NULL AND nome_servico_avulso IS NULL) OR
    -- Serviço avulso
    (id_servico IS NULL AND id_produto IS NULL AND nome_servico_avulso IS NOT NULL)
);

-- 4. Comentários para documentação
COMMENT ON COLUMN item_comanda.nome_servico_avulso IS 'Nome do serviço avulso (quando não é um serviço cadastrado)';
COMMENT ON COLUMN item_comanda.descricao_servico_avulso IS 'Descrição adicional do serviço avulso';

-- ===============================================
-- MIGRAÇÃO CONCLUÍDA
-- ===============================================
-- Agora a tabela item_comanda suporta:
-- 1. Serviços cadastrados (id_servico)
-- 2. Produtos cadastrados (id_produto) 
-- 3. Serviços avulsos (nome_servico_avulso)
-- =============================================== 