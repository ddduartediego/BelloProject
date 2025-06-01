# 🔍 Debug - Constraint de Valores Positivos no Banco

## **Data:** Janeiro 2025
## **Tipo:** Bug Fix / Constraint de Banco

---

## 🎯 **PROBLEMA IDENTIFICADO**

### **Sintomas:**
- **Erro 400 (Bad Request)** persistente ao tentar criar saídas de caixa
- **Falta de conformidade** entre lógica do código e schema do banco
- **Constraint violada** na tabela `movimentacao_caixa`

### **Logs de Erro:**
```
POST /movimentacao_caixa 400 (Bad Request)
Failed to load resource: the server responded with a status of 400 ()
```

### **Causa Raiz Descoberta:**
```sql
-- Schema do banco (linha 216)
CREATE TABLE movimentacao_caixa (
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0), -- ❌ CONSTRAINT IMPEDITIVA
    ...
);
```

---

## 🔍 **ANÁLISE TÉCNICA**

### **Conflito Identificado:**
1. **Código tentava:** Salvar valores negativos para saídas (`valor: -100`)
2. **Banco rejeitava:** Constraint `CHECK (valor > 0)` impede valores ≤ 0  
3. **Resultado:** Erro 400 Bad Request em todas as tentativas

### **Problema na Abordagem:**
```typescript
// TENTATIVA INICIAL (Falhava)
async criarSangria(valor: number) {
  return this.create({
    tipo_movimentacao: 'SANGRIA',
    valor: -Math.abs(valor), // ❌ Violava constraint do banco
  })
}
```

### **Consulta Schema:**
```sql
-- CONSTRAINT ENCONTRADA:
valor DECIMAL(10,2) NOT NULL CHECK (valor > 0)
-- Significa: valor deve ser maior que zero (sempre positivo)
```

---

## ✅ **SOLUÇÃO IMPLEMENTADA**

### **Estratégia Adotada:**
**Usar tipo de movimentação** para determinar entrada/saída ao invés de sinal do valor

### **1. Correção no Service de Movimentações**

#### **Arquivo:** `src/services/movimentacoesCaixa.service.ts`

**Método `criarSangria` corrigido:**
```typescript
// SOLUÇÃO FINAL (Funciona)
async criarSangria(
  caixaId: string,
  valor: number,
  descricao: string,
  profissionalId?: string
): Promise<ServiceResponse<MovimentacaoCaixa>> {
  return this.create({
    id_caixa: caixaId,
    tipo_movimentacao: 'SANGRIA', // ← Tipo determina se é saída
    valor: Math.abs(valor), // ✅ Sempre positivo para o banco
    descricao: descricao || 'Sangria',
    id_profissional_responsavel: profissionalId
  })
}
```

**Método `getRelatorioPeriodo` corrigido:**
```typescript
// Lógica baseada em tipo, não em sinal
case 'SAIDA':
case 'SANGRIA':
  acc.total_saidas += mov.valor // ✅ Valor já positivo
  break
case 'ENTRADA':
case 'REFORCO':
  acc.total_entradas += mov.valor // ✅ Valor já positivo
  break
```

### **2. Correção no Service de Caixa**

#### **Arquivo:** `src/services/caixa.service.ts`

**Cálculos corrigidos:**
```typescript
// Entradas baseadas em tipo
const totalEntradas = caixa.movimentacoes
  ?.filter(mov => mov.tipo_movimentacao === 'ENTRADA' || mov.tipo_movimentacao === 'REFORCO')
  .reduce((total, mov) => total + mov.valor, 0) || 0

// Saídas baseadas em tipo  
const totalSaidas = caixa.movimentacoes
  ?.filter(mov => mov.tipo_movimentacao === 'SAIDA' || mov.tipo_movimentacao === 'SANGRIA')
  .reduce((total, mov) => total + mov.valor, 0) || 0

// Saldo correto
const saldoCalculado = saldo_inicial + totalEntradas - totalSaidas
```

### **3. Correção no Frontend**

#### **Arquivo:** `src/app/caixa/page.tsx`

**Interface corrigida:**
```tsx
// Ícones baseados em tipo de movimentação
{(mov.tipo_movimentacao === 'ENTRADA' || mov.tipo_movimentacao === 'REFORCO') ? (
  <EntradaIcon sx={{ color: 'success.main' }} />
) : (
  <SaidaIcon sx={{ color: 'error.main' }} />
)}

// Sinais baseados em tipo de movimentação
{(mov.tipo_movimentacao === 'ENTRADA' || mov.tipo_movimentacao === 'REFORCO') ? '+' : '-'} 
R$ {mov.valor.toFixed(2)}
```

---

## 📊 **REGRA DE NEGÓCIO FINAL**

### **Armazenamento no Banco:**
```sql
-- TODOS os valores são POSITIVOS
INSERT INTO movimentacao_caixa (tipo_movimentacao, valor) VALUES 
('ENTRADA', 100.00),  -- Entrada: +100 
('REFORCO', 50.00),   -- Reforço: +50
('SANGRIA', 30.00),   -- Sangria: +30 (positivo no banco)
('SAIDA', 20.00);     -- Saída: +20 (positivo no banco)
```

### **Interpretação por Tipo:**
```typescript
// Lógica de cálculo
const isEntrada = ['ENTRADA', 'REFORCO'].includes(mov.tipo_movimentacao)
const contribuicao = isEntrada ? +mov.valor : -mov.valor

// Resultado visual
const sinal = isEntrada ? '+' : '-'
const cor = isEntrada ? 'success.main' : 'error.main'
```

---

## 🧪 **VALIDAÇÃO**

### **✅ Cenários Testados:**
- [x] **Criação de sangria** - Valor positivo aceito pelo banco
- [x] **Criação de reforço** - Valor positivo aceito pelo banco
- [x] **Cálculo de saldo** - Matemática correta baseada em tipos
- [x] **Interface** - Sinais e cores corretos baseados em tipos
- [x] **Relatórios** - Totais calculados corretamente
- [x] **Build** - Compilação sem erros

### **📈 Resultado dos Testes:**
```
ANTES: 400 Bad Request - Constraint violada
DEPOIS: 200 OK - Movimentação criada com sucesso
```

---

## 🔧 **VANTAGENS DA SOLUÇÃO**

### **✅ Benefícios:**
1. **Compatibilidade total** com constraint existente do banco
2. **Dados consistentes** - Todos valores positivos
3. **Lógica clara** - Tipo determina comportamento
4. **Facilidade de auditoria** - Valores sempre legíveis
5. **Escalabilidade** - Fácil adicionar novos tipos

### **📊 Comparação:**

| Aspecto | Valores Negativos | **Tipos + Valores Positivos** |
|---------|-------------------|--------------------------------|
| Constraint | ❌ Conflito | ✅ Compatível |
| Legibilidade | ❌ Confuso | ✅ Clara |
| Auditoria | ❌ Difícil | ✅ Fácil |
| Manutenção | ❌ Complexa | ✅ Simples |

---

## 🔄 **ARQUIVOS MODIFICADOS**

### **Services:**
1. **`src/services/movimentacoesCaixa.service.ts`**
   - `criarSangria()` - Valores positivos
   - `getRelatorioPeriodo()` - Lógica por tipo

2. **`src/services/caixa.service.ts`**
   - `fechar()` - Cálculos por tipo
   - `getRelatorioFechamento()` - Totais por tipo

### **Frontend:**
3. **`src/app/caixa/page.tsx`**
   - Exibição baseada em tipo de movimentação
   - Sinais e cores corretos

---

## ✅ **RESULTADO FINAL**

**Status:** 🟢 **PROBLEMA RESOLVIDO DEFINITIVAMENTE**

**Impacto:** 🎯 **Sistema de movimentações 100% funcional e conforme schema do banco**

### **Resumo da Correção:**
- **Problema:** Constraint `CHECK (valor > 0)` impedia valores negativos
- **Solução:** Usar tipos de movimentação + valores sempre positivos
- **Resultado:** Sistema funcional e compatível com banco existente

---

### **Lições Aprendidas:**
1. **Sempre verificar constraints** do banco antes de implementar lógica
2. **Schemas de banco** são autoridade final sobre regras de dados
3. **Tipos de dados semânticos** são preferíveis a sinais matemáticos
4. **Debugging systematic** previne re-trabalho desnecessário 