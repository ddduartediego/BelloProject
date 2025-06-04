// Tipos para o Dashboard Modular v3.0 - Sistema Bello

// ============================================================================
// INTERFACES PRINCIPAIS MODULARES
// ============================================================================

export interface DashboardModularMetrics {
  executivas: MetricasExecutivas
  profissionais: MetricasProfissionais
  comparativos: MetricasComparativos
  alertas: AlertasInteligentes
}

// ============================================================================
// MÉTRICAS EXECUTIVAS (ABA VISÃO GERAL)
// ============================================================================

export interface MetricasExecutivas {
  caixa: {
    status: 'ABERTO' | 'FECHADO'
    saldoAtual: number
    tempoAberto: number // em minutos
    comparativoOntem: number // percentual
    ultimaMovimentacao: string // ISO timestamp
  }
  vendas: {
    totalDia: number
    percentualVsOntem: number
    percentualMeta: number // se meta estiver configurada
    ultimaVenda: string // ISO timestamp
    metaDiaria?: number
  }
  comandas: {
    quantidadeHoje: number
    ticketMedio: number
    comparativoOntem: number // diferença absoluta
    ultimaComanda: string // ISO timestamp
  }
  profissionaisAtivos: {
    totalAtivos: number
    topProfissional: {
      nome: string
      vendas: number
    }
    ocupacaoMedia: number
    avaliacaoMedia: number
  }
  semanaAtual: {
    vendas: number
    percentualVsSemanaPassada: number
  }
  clientes: {
    novosHoje: number
    taxaRetorno: number
    totalAtivos: number
    satisfacaoMedia: number
  }
}

// ============================================================================
// MÉTRICAS DE PROFISSIONAIS (ABA PROFISSIONAIS)
// ============================================================================

export interface MetricasProfissionais {
  ranking: ProfissionalRanking[]
  individual: { [profissionalId: string]: ProfissionalDetalhado }
  estatisticas: {
    totalProfissionais: number
    mediaVendasDia: number
    mediaTicket: number
    ocupacaoGeral: number
  }
  comparativas?: MetricasComparativasProfissionais
  analyticsReais?: ProfissionaisAnalytics
}

// ============================================================================
// MÉTRICAS COMPARATIVAS (ABA COMPARATIVOS)
// ============================================================================

export interface MetricasComparativos {
  periodos: {
    ultimaSemana: PeriodoComparativo
    ultimoMes: PeriodoComparativo
    semanaVsSemanaPassada: ComparativoDetalhado
    mesVsMesPassado: ComparativoDetalhado
  }
  clientes: {
    novos: { quantidade: number; percentual: number; comparativo: number }
    retorno: { taxa: number; comparativo: number }
    vips: { quantidade: number; ticketMedio: number; comparativo: number }
  }
  servicos: {
    topPorQuantidade: Array<{ nome: string; quantidade: number; crescimento: number }>
    topPorValor: Array<{ nome: string; valor: number; crescimento: number }>
  }
  profissionais: {
    topVendas: Array<{ nome: string; vendas: number; crescimento: number }>
    topServicos: Array<{ nome: string; servicos: number; crescimento: number }>
  }
}

export interface PeriodoComparativo {
  inicio: string
  fim: string
  vendas: number
  comandas: number
  ticketMedio: number
  clientesUnicos: number
}

export interface ComparativoDetalhado {
  atual: PeriodoComparativo
  anterior: PeriodoComparativo
  crescimento: {
    vendas: number
    comandas: number
    ticketMedio: number
    clientes: number
  }
  crescimentoPercentual: {
    vendas: number
    comandas: number
    ticketMedio: number
    clientes: number
  }
}

// ============================================================================
// ALERTAS INTELIGENTES (ABA ALERTAS)
// ============================================================================

export interface AlertasInteligentes {
  criticos: Alerta[]
  atencao: Alerta[]
  insights: Alerta[]
  resumo: {
    totalCriticos: number
    totalAtencao: number
    totalInsights: number
    ultimaAtualizacao: string
  }
}

export interface Alerta {
  id: string
  tipo: 'CRITICO' | 'ATENCAO' | 'INSIGHT'
  categoria: 'CAIXA' | 'VENDAS' | 'PROFISSIONAIS' | 'CLIENTES' | 'SISTEMA'
  titulo: string
  descricao: string
  valor?: number
  comparativo?: number
  sugestao?: string
  timestamp: string
  acionavel: boolean
  acao?: {
    tipo: 'NAVEGACAO' | 'ACAO_DIRETA'
    destino?: string
    funcao?: string
  }
}

// ============================================================================
// CONFIGURAÇÕES E CONTEXTO
// ============================================================================

export interface DashboardConfig {
  autoRefresh: {
    enabled: boolean
    interval: number // em minutos
    ultimaAtualizacao: string
  }
  alertas: {
    criticos: boolean
    atencao: boolean
    insights: boolean
  }
  metas: {
    vendaDiaria?: number
    ticketMedio?: number
    comandasDia?: number
  }
  profissionais: {
    mostrarInativos: boolean
    ordenacao: 'VENDAS' | 'COMANDAS' | 'TICKET_MEDIO'
  }
}

export interface TabDashboard {
  id: 'visao-geral' | 'profissionais' | 'comparativos' | 'alertas'
  label: string
  icon: string
  carregada: boolean
  ultimaAtualizacao?: string
}

// ============================================================================
// HOOKS E CONTEXTO
// ============================================================================

export interface UseDashboardModularReturn {
  metrics: DashboardModularMetrics | null
  loading: {
    geral: boolean
    executivas: boolean
    profissionais: boolean
    comparativos: boolean
    alertas: boolean
  }
  error: string | null
  config: DashboardConfig
  refreshTab: (tab: TabDashboard['id']) => Promise<void>
  refreshAll: () => Promise<void>
  updateConfig: (newConfig: Partial<DashboardConfig>) => void
  filtros?: FiltroAvancado
  updateFiltros?: (novosFiltros: Partial<FiltroAvancado>) => Promise<void>
  filtrosExecutivos?: FiltroAvancado
  updateFiltrosExecutivos?: (novosFiltros: Partial<FiltroAvancado>) => Promise<void>
  updateMetaDiaria?: (meta: number) => Promise<void>
  filtrosComparativos?: FiltroComparativo
  updateFiltrosComparativos?: (novosFiltros: Partial<FiltroComparativo>) => Promise<void>
}

export interface DashboardContextValue {
  activeTab: TabDashboard['id']
  setActiveTab: (tab: TabDashboard['id']) => void
  tabs: TabDashboard[]
  metrics: DashboardModularMetrics | null
  loading: UseDashboardModularReturn['loading']
  error: string | null
  config: DashboardConfig
  refreshTab: (tab: TabDashboard['id']) => Promise<void>
  refreshAll: () => Promise<void>
  updateConfig: (newConfig: Partial<DashboardConfig>) => void
}

// ============================================================================
// UTILITÁRIOS E HELPERS
// ============================================================================

export interface ComparativoVisual {
  valor: number
  percentual: number
  tipo: 'CRESCIMENTO' | 'QUEDA' | 'ESTAVEL'
  cor: 'success' | 'error' | 'info'
  icone: 'trending_up' | 'trending_down' | 'trending_flat'
}

export interface CardExecutivo {
  id: string
  titulo: string
  icone: string
  valor: string | number
  comparativo: ComparativoVisual
  info?: string
  acao?: {
    label: string
    destino: string
  }
}

// ============================================================================
// CACHE E PERFORMANCE
// ============================================================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  key: string
}

export interface CacheConfig {
  executivas: number // tempo em minutos
  profissionais: number
  comparativos: number
  alertas: number
}

// ============================================================================
// COMPATIBILIDADE COM VERSÃO ANTERIOR
// ============================================================================

// Manter compatibilidade com DashboardMetrics existente
export interface DashboardMetrics {
  vendas: {
    totalDia: number
    totalMes: number
    totalAno: number
    percentualCrescimento: number
    totalComandas: number
    ticketMedio: number
  }
  agendamentos?: {
    total: number
    pendentes: number
    confirmados: number
    concluidos: number
    cancelados: number
    hojeTotal: number
    proximaSemana: number
  }
  clientes: {
    total: number
    novosEsseMes: number
    aniversariantesEssaSemana: number
  }
  profissionais: {
    total: number
    porEspecialidade: Record<string, number>
  }
  servicos: {
    total: number
    precoMedio: number
    duracaoMedia: number
    porCategoria: Record<string, number>
  }
  vendaDetalhada?: {
    porDia: Array<{ data: string; vendas: number; comandas: number }>
    porProfissional: Array<{ profissional: string; vendas: number; comandas: number; ticketMedio: number }>
    servicosPopulares: Array<{ servico: string; quantidade: number; valor: number }>
  }
  performance?: {
    taxaRetorno: {
      percentual: number
      clientesTotais: number
      clientesRecorrentes: number
    }
    ocupacao: {
      media: number
      profissionais: Array<{
        nome: string
        ocupacao: number
        horasAgendadas: number
        totalAgendamentos: number
      }>
    }
    horariosPico: {
      horarios: Array<{ hora: string; agendamentos: number; percentual: number }>
      diasSemana: Array<{ diaSemana: string; agendamentos: number; percentual: number }>
    }
  }
  comparacao?: {
    vendas: {
      anterior: number
      crescimento: number
      crescimentoPercentual: number
    }
    agendamentos?: {
      anterior: number
      crescimento: number
      crescimentoPercentual: number
    }
  }
}

// ============================================================================
// INTERFACES DE ANALYTICS DE PROFISSIONAIS (SPRINT 2)
// ============================================================================

export interface ProfissionalRanking {
  id: string
  nome: string
  posicao: number
  avatar?: string
  status: 'ATIVO' | 'INATIVO' | 'LICENCA'
  metricas: {
    vendas: {
      hoje: number
      semana: number
      mes: number
      crescimentoSemanal: number
      crescimentoMensal: number
    }
    comandas: {
      hoje: number
      semana: number
      mes: number
      ticketMedio: number
      crescimentoTicket: number
    }
    ocupacao: {
      percentual: number
      horasAgendadas: number
      horasDisponiveis: number
      eficiencia: number
    }
    satisfacao: {
      media: number
      totalAvaliacoes: number
      tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL'
    }
  }
  comparativos: {
    ontem: {
      vendas: number
      comandas: number
      crescimentoVendas: number
      crescimentoComandas: number
    }
    semanaPassada: {
      vendas: number
      comandas: number
      crescimentoVendas: number
      crescimentoComandas: number
    }
  }
}

export interface ProfissionalDetalhado {
  id: string
  nome: string
  informacoes: {
    especialidades: string[]
    dataAdmissao: string
    telefone?: string
    email?: string
  }
  historico: {
    ultimosSete: Array<{
      data: string
      vendas: number
      comandas: number
      horasAgendadas: number
      avaliacaoMedia: number
    }>
    ultimosTrinta: {
      vendas: number[]
      comandas: number[]
      ocupacao: number[]
    }
  }
  tendencias: {
    vendas: {
      direcao: 'CRESCENDO' | 'DECRESCENDO' | 'ESTAVEL'
      percentual: number
      predicao: number
    }
    ocupacao: {
      direcao: 'CRESCENDO' | 'DECRESCENDO' | 'ESTAVEL'
      percentual: number
      otimizacao: string[]
    }
    satisfacao: {
      direcao: 'CRESCENDO' | 'DECRESCENDO' | 'ESTAVEL'
      percentual: number
      pontosMelhoria: string[]
    }
  }
  insights: {
    pontosFortes: string[]
    areasMelhoria: string[]
    recomendacoes: string[]
    alertas: string[]
  }
}

export interface MetricasComparativasProfissionais {
  periodo: {
    inicio: string
    fim: string
    descricao: string
  }
  estatisticas: {
    vendasMedia: number
    comandasMedia: number
    ocupacaoMedia: number
    satisfacaoMedia: number
  }
  distribuicao: {
    faixaVendas: Array<{
      faixa: string
      quantidade: number
      percentual: number
      profissionais: string[]
    }>
    faixaOcupacao: Array<{
      faixa: string
      quantidade: number
      percentual: number
      profissionais: string[]
    }>
  }
  correlacoes: {
    vendasVsOcupacao: number
    vendasVsSatisfacao: number
    ocupacaoVsSatisfacao: number
  }
}

// ============================================================================
// FILTROS AVANÇADOS
// ============================================================================

export interface FiltroAvancado {
  inicio: string // ISO timestamp
  fim: string // ISO timestamp
  profissionalId?: string
}

export interface FiltroComparativo extends FiltroAvancado {
  tipoComparacao: 'PERIODO_ANTERIOR' | 'SEMANA_PASSADA' | 'MES_PASSADO' | 'ANO_PASSADO' | 'PERSONALIZADO'
  periodoComparacao?: {
    inicio: string
    fim: string
  }
  metricas: ('vendas' | 'comandas' | 'clientes' | 'profissionais')[]
}

// ============================================================================
// ANALYTICS DE PROFISSIONAIS (VERSÃO REAL)
// ============================================================================

export interface ProfissionaisAnalytics {
  estatisticas: {
    totalProfissionais: number
    mediaVendasDia: number
    mediaTicket: number
    ocupacaoGeral: number
  }
  ranking: ProfissionalRankingReal[]
}

// Versão simplificada do ranking para dados reais
export interface ProfissionalRankingReal {
  id: string
  nome: string
  vendas: {
    periodo: number
    crescimento: number
    ticketMedio: number
  }
  performance: {
    comandas: number
    ocupacao: number
    eficiencia: number
  }
} 