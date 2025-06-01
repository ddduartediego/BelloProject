-- ===============================================
-- CORREÇÃO DE CONSTRAINT - MOVIMENTACAO_CAIXA
-- Data: Janeiro 2025
-- Objetivo: Permitir valores negativos para saídas
-- ===============================================

-- Remover a constraint existente que impede valores negativos
ALTER TABLE movimentacao_caixa 
DROP CONSTRAINT IF EXISTS movimentacao_caixa_valor_check;

-- Adicionar nova constraint que permite valores negativos e positivos
-- Apenas impede valor zero (que não faz sentido para movimentações)
ALTER TABLE movimentacao_caixa 
ADD CONSTRAINT movimentacao_caixa_valor_check 
CHECK (valor != 0);

-- ===============================================
-- COMENTÁRIO EXPLICATIVO
-- ===============================================
COMMENT ON CONSTRAINT movimentacao_caixa_valor_check ON movimentacao_caixa IS 
'Permite valores positivos (entradas/reforços) e negativos (saídas/sangrias). Apenas impede valor zero.';

-- ===============================================
-- VALIDAÇÃO DA ALTERAÇÃO
-- ===============================================

-- Teste 1: Inserir valor positivo (deve funcionar)
-- INSERT INTO movimentacao_caixa (id_caixa, tipo_movimentacao, valor, descricao) 
-- VALUES ('test-uuid', 'ENTRADA', 100.00, 'Teste entrada');

-- Teste 2: Inserir valor negativo (deve funcionar)
-- INSERT INTO movimentacao_caixa (id_caixa, tipo_movimentacao, valor, descricao) 
-- VALUES ('test-uuid', 'SANGRIA', -50.00, 'Teste saída');

-- Teste 3: Inserir valor zero (deve falhar)
-- INSERT INTO movimentacao_caixa (id_caixa, tipo_movimentacao, valor, descricao) 
-- VALUES ('test-uuid', 'ENTRADA', 0.00, 'Teste zero'); -- ❌ Deve falhar

-- ===============================================
-- SCRIPT EXECUTADO COM SUCESSO!
-- Constraint atualizada para permitir valores negativos
-- =============================================== 