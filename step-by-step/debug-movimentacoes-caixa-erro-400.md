# 🐛 Debug - Erro 400 nas Movimentações de Caixa

## **Data:** Janeiro 2025
## **Tipo:** Bug Fix / Debug

---

## 🎯 **PROBLEMA IDENTIFICADO**

### **Sintomas:**
- **Erro 400 (Bad Request)** ao tentar criar nova entrada/saída no caixa
- **URL da requisição com erro:**
```
POST /movimentacao_caixa?columns=... 400 (Bad Request)
```

### **Log do Navegador:**
```javascript
Failed to load resource: the server responded with a status of 400 ()
POST https://lbjwsczusoozacknrxbh.supabase.co/rest/v1/movimentacao_caixa 400 (Bad Request)
```

---

## 🔍 **DIAGNÓSTICO**

### **Análise do Código:**
No arquivo `src/app/caixa/page.tsx`, linha 253 e 260:

```tsx
// ANTES - Código com erro
result = await movimentacoesCaixaService.criarReforco(
  caixaAtivo.id, 
  valor, 
  descricao, 
  'user-default' // ❌ PROBLEMA: String inválida como UUID
)

result = await movimentacoesCaixaService.criarSangria(
  caixaAtivo.id, 
  valor, 
  descricao, 
  'user-default' // ❌ PROBLEMA: String inválida como UUID
)
```

### **Causa Raiz:**
- **Campo `id_profissional_responsavel`** espera um UUID válido ou `null`/`undefined`
- **Valor enviado:** `'user-default'` (string inválida como UUID)
- **Supabase rejeitou** a requisição com 400 Bad Request

---

## ✅ **SOLUÇÃO IMPLEMENTADA**

### **Correção Aplicada:**
```tsx
// DEPOIS - Código corrigido
result = await movimentacoesCaixaService.criarReforco(
  caixaAtivo.id, 
  valor, 
  descricao, 
  undefined // ✅ CORRIGIDO: Campo opcional como undefined
)

result = await movimentacoesCaixaService.criarSangria(
  caixaAtivo.id, 
  valor, 
  descricao, 
  undefined // ✅ CORRIGIDO: Campo opcional como undefined
)
```

### **Arquivo Modificado:**
- **`src/app/caixa/page.tsx`** - Método `handleAdicionarMovimentacao`
- **Linhas alteradas:** 253 e 260
- **Mudança:** `'user-default'` → `undefined`

---

## 🧪 **VALIDAÇÃO**

### **Teste Funcional:**
- [x] **Entrada de dinheiro** - Funciona sem erro
- [x] **Saída de dinheiro** - Funciona sem erro  
- [x] **Histórico atualizado** - Movimentações aparecem corretamente
- [x] **Build sem erros** - Compilação limpa

### **Comportamento Esperado:**
1. **Usuário clica em "Entrada"** 
2. **Preenche valor e descrição**
3. **Submete o formulário**
4. **✅ Movimentação é criada com sucesso**
5. **Histórico é atualizado automaticamente**

---

## 🔧 **DETALHES TÉCNICOS**

### **Interface do Service:**
```typescript
export interface CreateMovimentacaoData {
  id_caixa: string
  id_comanda?: string
  tipo_movimentacao: TipoMovimentacao
  valor: number
  descricao: string
  id_profissional_responsavel?: string // ← Campo OPCIONAL
}
```

### **Métodos Afetados:**
```typescript
async criarReforco(
  caixaId: string,
  valor: number,
  descricao: string,
  profissionalId?: string // ← Opcional, pode ser undefined
): Promise<ServiceResponse<MovimentacaoCaixa>>

async criarSangria(
  caixaId: string,
  valor: number,
  descricao: string,
  profissionalId?: string // ← Opcional, pode ser undefined
): Promise<ServiceResponse<MovimentacaoCaixa>>
```

---

## 📊 **IMPACTO DA CORREÇÃO**

### **✅ Benefícios:**
1. **Funcionalidade restaurada** - Movimentações funcionam novamente
2. **Compatibilidade mantida** - Campo permanece opcional como projetado
3. **Código mais limpo** - Remove valor hardcoded inválido
4. **Base para evolução** - Preparado para implementar usuário logado

### **📈 Resultado:**
- **Antes:** Erro 400 em todas as tentativas de movimentação
- **Depois:** Criação de movimentações funcionando 100%

---

## 🚀 **PRÓXIMOS PASSOS**

### **Melhorias Futuras:**
1. **Implementar autenticação completa**
   - Buscar profissional logado do contexto de auth
   - Passar ID real do usuário responsável
   
2. **Auditoria melhorada**
   - Rastrear quem fez cada movimentação
   - Relatórios por responsável
   
3. **Validação aprimorada**
   - Validar UUIDs no frontend antes de enviar
   - Mensagens de erro mais específicas

### **Arquivo de Referência:**
```typescript
// TODO: Implementar busca do usuário atual
// const { usuario } = useAuth()
// const profissionalId = usuario?.profissional?.id

// Por enquanto: undefined (funcional)
// Futuro: profissionalId (com rastreabilidade completa)
```

---

## ✅ **RESULTADO FINAL**

**Status:** 🟢 **RESOLVIDO**

**Funcionalidade:** ✅ **100% Funcional**

**Impacto:** 🎯 **Crítico - Sistema de caixa operacional novamente**

---

### **Resumo da Correção:**
- **Problema:** Campo UUID inválido causando erro 400
- **Solução:** Usar `undefined` para campo opcional  
- **Resultado:** Movimentações de caixa funcionando perfeitamente 