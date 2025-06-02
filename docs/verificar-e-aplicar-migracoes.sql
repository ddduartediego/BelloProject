-- ===============================================
-- SCRIPT DE VERIFICAÇÃO E APLICAÇÃO DE MIGRAÇÕES
-- Data: Janeiro 2025
-- ===============================================

-- Verificar se as colunas de serviços avulsos existem
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'item_comanda' 
    AND column_name IN ('nome_servico_avulso', 'descricao_servico_avulso')
ORDER BY column_name;

-- Verificar quantos itens existem na comanda da Carol
SELECT 
    c.id as comanda_id,
    c.nome_cliente_avulso,
    c.valor_total_servicos,
    COUNT(ic.id) as total_itens,
    SUM(ic.preco_total_item) as soma_itens
FROM comanda c
LEFT JOIN item_comanda ic ON ic.id_comanda = c.id
WHERE c.nome_cliente_avulso = 'Carol'
GROUP BY c.id, c.nome_cliente_avulso, c.valor_total_servicos
ORDER BY c.criado_em DESC;

-- Verificar detalhes dos itens existentes
SELECT 
    ic.id,
    ic.id_comanda,
    ic.id_servico,
    ic.id_produto,
    ic.quantidade,
    ic.preco_unitario_registrado,
    ic.preco_total_item,
    s.nome as nome_servico,
    p.nome as nome_produto
FROM item_comanda ic
LEFT JOIN servico s ON s.id = ic.id_servico
LEFT JOIN produto p ON p.id = ic.id_produto
WHERE ic.id_comanda IN (
    SELECT id FROM comanda WHERE nome_cliente_avulso = 'Carol'
);

-- ===============================================
-- SE AS COLUNAS NÃO EXISTIREM, APLICAR MIGRAÇÃO
-- ===============================================

-- Verificar se migração já foi aplicada
DO $$ 
BEGIN
    -- Verificar se as colunas existem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'item_comanda' 
        AND column_name = 'nome_servico_avulso'
    ) THEN
        -- Aplicar migração
        RAISE NOTICE 'Aplicando migração de serviços avulsos...';
        
        -- 1. Adicionar campos para serviços avulsos
        ALTER TABLE item_comanda 
        ADD COLUMN nome_servico_avulso VARCHAR(255),
        ADD COLUMN descricao_servico_avulso TEXT;
        
        -- 2. Remover constraint antiga
        ALTER TABLE item_comanda 
        DROP CONSTRAINT IF EXISTS item_comanda_tipo_valido;
        
        -- 3. Criar nova constraint
        ALTER TABLE item_comanda 
        ADD CONSTRAINT item_comanda_tipo_valido CHECK (
            -- Serviço cadastrado
            (id_servico IS NOT NULL AND id_produto IS NULL AND nome_servico_avulso IS NULL) OR
            -- Produto cadastrado  
            (id_servico IS NULL AND id_produto IS NOT NULL AND nome_servico_avulso IS NULL) OR
            -- Serviço avulso
            (id_servico IS NULL AND id_produto IS NULL AND nome_servico_avulso IS NOT NULL)
        );
        
        -- 4. Comentários
        COMMENT ON COLUMN item_comanda.nome_servico_avulso IS 'Nome do serviço avulso (quando não é um serviço cadastrado)';
        COMMENT ON COLUMN item_comanda.descricao_servico_avulso IS 'Descrição adicional do serviço avulso';
        
        RAISE NOTICE 'Migração aplicada com sucesso!';
    ELSE
        RAISE NOTICE 'Migração já foi aplicada anteriormente.';
    END IF;
END $$; 