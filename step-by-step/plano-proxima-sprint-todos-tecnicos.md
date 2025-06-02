# 📋 **PLANO PRÓXIMA SPRINT - TODOs Técnicos**

## **Data:** Janeiro 2025
## **Tipo:** Otimizações e Melhorias Técnicas
## **Prioridade:** Média (Pós-Funcionalidades Críticas)

---

## 🎯 **OBJETIVOS DA SPRINT**

### **Meta Principal:**
Resolver pendências técnicas identificadas durante a implementação das novas regras de caixa, melhorando a qualidade do código e performance da aplicação.

### **Resultados Esperados:**
- **Código mais limpo** sem TODOs críticos
- **Performance melhorada** com dados completos
- **Type Safety** aumentada com remoção de `any` types
- **Arquitetura consistente** em todos os componentes

---

## 🔧 **TAREFAS TÉCNICAS IDENTIFICADAS**

### **📊 PRIORIDADE ALTA**

#### **1. Buscar Dados Completos do Caixa Selecionado** ⚡ **[PLANO CRIADO]**
- **Localização:** `src/app/caixa/page.tsx` linhas 757-758, 390
- **Problema Atual:** EditarCaixaDialog recebe objeto temporário com campos vazios
- **Solução Proposta:**
  ```typescript
  // Criar nova função para buscar caixa completo
  const buscarCaixaCompleto = async (caixaId: string): Promise<Caixa>
  
  // Implementar cache local para dados do caixa
  const [dadosCompletosCache, setDadosCompletosCache] = useState<Map<string, Caixa>>()
  ```
- **📋 Plano Detalhado:** `step-by-step/plano-implementacao-caixa-dados-completos-saldo-dinamico.md`

#### **2. Melhorar Cálculo de Saldo Baseado no Caixa Selecionado** ⚡ **[PLANO CRIADO]**
- **Localização:** `src/app/caixa/page.tsx` linha 390
- **Problema Atual:** Usa sempre `caixaAtivo` para calcular saldo
- **Solução Proposta:**
  ```typescript
  // Função dinâmica baseada no caixa visualizado
  const calcularSaldo = (caixa: Caixa | CaixaFiltro, estatisticas: Estatisticas) => {
    const saldoInicial = 'saldo_inicial' in caixa ? caixa.saldo_inicial : 0
    return saldoInicial + estatisticas.totalEntradas - estatisticas.totalSaidas
  }
  ```
- **📋 Plano Detalhado:** `step-by-step/plano-implementacao-caixa-dados-completos-saldo-dinamico.md`

#### **3. Remover Referencias Restantes a caixaAtivo**
- **Localização:** `src/app/caixa/page.tsx` várias linhas
- **Problema Atual:** Lógica mista entre `caixaAtivo` e `caixaSelecionado`
- **Solução Proposta:**
  ```typescript
  // Unificar em uma única fonte de verdade
  const caixaAtual = caixaSelecionado || caixaAbertoDaEmpresa
  
  // Remover estado caixaAtivo
  // Usar apenas caixaSelecionado + hook useCaixas
  ```

### **📈 PRIORIDADE MÉDIA**

#### **4. Implementar Service de Desconto em Comandas**
- **Localização:** `src/components/comandas/ComandaDetalhes.tsx` linha 527
- **Funcionalidade:** Sistema de desconto percentual e valor fixo
- **Escopo:**
  ```typescript
  interface DescontoData {
    tipo: 'PERCENTUAL' | 'VALOR_FIXO'
    valor: number
    motivo?: string
  }
  
  // comandaService.aplicarDesconto(comandaId, desconto)
  ```

#### **5. Otimizar Dashboard Metrics**
- **Localização:** `src/hooks/useDashboardMetrics.ts` linha 78
- **Implementação:** Integrar com comandas service existente
- **Métricas:**
  - Vendas do período
  - Comandas abertas/fechadas
  - Ticket médio
  - Métodos de pagamento

#### **6. Melhorar Integração Serviços-Agendamentos**
- **Localização:** `src/services/servicos.service.ts` linha 246
- **Funcionalidade:** Estatísticas de serviços mais utilizados
- **Implementação:** Query join com tabela de agendamentos

### **🔍 PRIORIDADE BAIXA**

#### **7. Corrigir Hook Dependencies Warnings**
- **Localização:** Vários arquivos
- **Problema:** `useEffect` com dependências faltantes
- **Estratégia:** 
  - Extrair funções para `useCallback` quando necessário
  - Verificar se dependências são realmente necessárias
  - Usar `eslint-disable` justificado quando apropriado

#### **8. Migrar Any Types para Types Específicos**
- **Localização:** Vários arquivos
- **Estratégia:**
  - Criar interfaces específicas para objetos complexos
  - Usar Generic Types onde apropriado
  - Manter compatibilidade com Supabase

---

## 📅 **CRONOGRAMA SUGERIDO**

### **Semana 1: Fundações**
- **Dia 1-2:** Tarefa #1 (Buscar Dados Completos)
- **Dia 3-4:** Tarefa #2 (Melhorar Cálculo de Saldo)
- **Dia 5:** Tarefa #3 (Remover Referencias caixaAtivo)

### **Semana 2: Features**
- **Dia 1-2:** Tarefa #4 (Service de Desconto)
- **Dia 3-4:** Tarefa #5 (Dashboard Metrics)
- **Dia 5:** Tarefa #6 (Serviços-Agendamentos)

### **Semana 3: Polimento**
- **Dia 1-3:** Tarefa #7 (Hook Dependencies)
- **Dia 4-5:** Tarefa #8 (Any Types)

---

## 🔧 **IMPLEMENTAÇÃO DETALHADA**

### **Tarefa #1: Dados Completos do Caixa**

#### **Passo 1: Criar Service Method**
```typescript
// src/services/caixa.service.ts
async getCaixaCompleto(caixaId: string): Promise<ServiceResponse<Caixa>> {
  const query = this.supabase
    .from('caixa')
    .select(`
      *,
      profissional_abertura:id_profissional_abertura(
        id,
        usuario_responsavel:id_usuario(nome_completo)
      ),
      profissional_fechamento:id_profissional_fechamento(
        id,
        usuario_responsavel:id_usuario(nome_completo)
      )
    `)
    .eq('id', caixaId)
    .single()
    
  return this.handleRequest(query)
}
```

#### **Passo 2: Atualizar Página Caixa**
```typescript
// src/app/caixa/page.tsx
const [caixaCompletoCache, setCaixaCompletoCache] = useState<Map<string, Caixa>>(new Map())

const buscarCaixaCompletoSeMecessario = async (caixaFiltro: CaixaFiltro): Promise<Caixa> => {
  if (caixaCompletoCache.has(caixaFiltro.id)) {
    return caixaCompletoCache.get(caixaFiltro.id)!
  }
  
  const { data } = await caixaService.getCaixaCompleto(caixaFiltro.id)
  if (data) {
    setCaixaCompletoCache(prev => new Map(prev).set(caixaFiltro.id, data))
    return data
  }
  
  // Fallback para objeto temporário
  return {
    ...caixaFiltro,
    id_empresa: '',
    saldo_inicial: 0,
    criado_em: caixaFiltro.data_abertura,
    atualizado_em: caixaFiltro.data_abertura,
  } as Caixa
}
```

### **Tarefa #2: Cálculo Dinâmico de Saldo**

```typescript
// src/app/caixa/page.tsx
const calcularSaldoCaixa = useCallback((
  caixa: Caixa | CaixaFiltro | null,
  estatisticas: typeof estatisticas
) => {
  if (!caixa) return 0
  
  const saldoInicial = 'saldo_inicial' in caixa 
    ? caixa.saldo_inicial || 0
    : caixa.saldo_final_calculado || 0
    
  return saldoInicial + estatisticas.totalEntradas - estatisticas.totalSaidas
}, [])

// Usar função dinâmica
const saldoCalculado = calcularSaldoCaixa(caixaVisualizado, estatisticas)
```

### **Tarefa #4: Service de Desconto**

```typescript
// src/services/comandas.service.ts
async aplicarDesconto(
  comandaId: string, 
  desconto: { tipo: 'PERCENTUAL' | 'VALOR_FIXO', valor: number, motivo?: string }
): Promise<ServiceResponse<ComandaComDetalhes>> {
  
  // 1. Buscar comanda atual
  const { data: comanda } = await this.getById(comandaId)
  if (!comanda) return { data: null, error: 'Comanda não encontrada' }
  
  // 2. Calcular desconto
  const valorTotal = comanda.valor_total_servicos + comanda.valor_total_produtos
  const valorDesconto = desconto.tipo === 'PERCENTUAL' 
    ? (valorTotal * desconto.valor) / 100
    : desconto.valor
    
  // 3. Validar desconto
  if (valorDesconto > valorTotal) {
    return { data: null, error: 'Desconto não pode ser maior que o valor total' }
  }
  
  // 4. Atualizar comanda
  const { data, error } = await this.supabase
    .from('comanda')
    .update({
      valor_desconto: valorDesconto,
      observacoes_desconto: desconto.motivo,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', comandaId)
    .select()
    .single()
    
  if (error) return { data: null, error: this.handleError(error) }
  
  // 5. Retornar comanda atualizada
  return this.getById(comandaId)
}
```

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO**

### **Para Cada Tarefa:**
1. **Código compila** sem erros ou warnings
2. **Funcionalidade testada** manualmente
3. **Performance não degradada** (tempo de carregamento)
4. **Compatibilidade mantida** com funcionalidades existentes

### **Para Sprint Completa:**
1. **Todos os TODOs críticos** removidos do código
2. **Types safety aumentada** (menos `any` types)
3. **Performance melhorada** em operações de caixa
4. **Documentação atualizada** sobre novas implementações

---

## 🚀 **ENTREGÁVEIS**

### **Código:**
- [ ] Service method `getCaixaCompleto()`
- [ ] Função `calcularSaldoCaixa()` dinâmica
- [ ] Service `aplicarDesconto()` em comandas  
- [ ] Hook `useDashboardMetrics` completo
- [ ] Cache local para dados de caixa

### **Documentação:**
- [ ] README atualizado com novas funcionalidades
- [ ] Documentação das interfaces TypeScript
- [ ] Guia de troubleshooting para problemas comuns

### **Testes:**
- [ ] Testes manuais de todas as funcionalidades
- [ ] Verificação de performance
- [ ] Compatibilidade entre navegadores

---

## 🎯 **MÉTRICAS DE SUCESSO**

1. **Code Quality:**
   - TODOs críticos: 0
   - Warnings TypeScript: < 5
   - Complexidade ciclomática: Mantida

2. **Performance:**
   - Tempo carregamento página caixa: < 2s
   - Operações CRUD caixa: < 500ms
   - Cache hit rate: > 80%

3. **User Experience:**
   - Todas operações funcionam sem reload
   - Feedback visual em todas ações
   - Estados de erro tratados

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Revisar este plano** com o time
2. **Priorizar tarefas** baseado na necessidade do negócio
3. **Criar issues** no GitHub para tracking
4. **Estimar esforço** para cada tarefa
5. **Iniciar desenvolvimento** pela tarefa #1

---

**📞 Contato:** Para dúvidas sobre este plano, consulte a documentação técnica ou abra uma issue no repositório. 