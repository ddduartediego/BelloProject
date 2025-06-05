import { useState, useEffect, useCallback } from 'react'
import { 
  DashboardModularMetrics, 
  DashboardConfig, 
  UseDashboardModularReturn,
  TabDashboard,
  MetricasExecutivas,
  MetricasProfissionais,
  MetricasComparativos,
  AlertasInteligentes,
  FiltroAvancado,
  FiltroComparativo
} from '@/types/dashboard'
import dashboardExecutivoService from '@/services/dashboardExecutivoService'
import alertasInteligentesService from '@/services/alertasInteligentesService'
import { profissionaisAnalyticsRealService } from '@/services/profissionaisAnalyticsRealService'
import { estatisticasPrincipaisService } from '@/services/estatisticasPrincipaisService'
import { analisesTemporaisService } from '@/services/analisesTemporaisService'
import { ComparativosDataAdapter } from '@/services/comparativosDataAdapter'
import { comandasService } from '@/services'
import useDashboardCache from './useDashboardCache'

// ============================================================================
// CONFIGURAÇÃO PADRÃO
// ============================================================================

const DEFAULT_CONFIG: DashboardConfig = {
  autoRefresh: {
    enabled: true,
    interval: 5, // 5 minutos
    ultimaAtualizacao: new Date().toISOString()
  },
  alertas: {
    criticos: true,
    atencao: true,
    insights: true
  },
  metas: {
    // Será configurado pelo usuário
  },
  profissionais: {
    mostrarInativos: false,
    ordenacao: 'VENDAS'
  }
}

// Filtros padrão para profissionais (últimos 7 dias)
const getDefaultFiltersProfissionais = (): FiltroAvancado => {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 7)
  
  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString()
  }
}

// Filtros padrão para executivos (sempre hoje)
const getDefaultFiltersExecutivos = (): FiltroAvancado => {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  
  return {
    inicio: inicio.toISOString(),
    fim: hoje.toISOString()
  }
}

// Filtros padrão para comparativos (hoje vs ontem)
const getDefaultFiltersComparativos = (): FiltroComparativo => {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  
  return {
    inicio: inicio.toISOString(),
    fim: hoje.toISOString(),
    tipoComparacao: 'PERIODO_ANTERIOR',
    metricas: ['vendas', 'comandas']
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useDashboardModular(): UseDashboardModularReturn {
  // Estados principais
  const [metrics, setMetrics] = useState<DashboardModularMetrics | null>(null)
  const [loading, setLoading] = useState({
    geral: true,
    executivas: false,
    profissionais: false,
    comparativos: false,
    alertas: false
  })
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG)
  
  // Estados de filtros separados
  const [filtrosProfissionais, setFiltrosProfissionais] = useState<FiltroAvancado>(getDefaultFiltersProfissionais())
  const [filtrosComparativos, setFiltrosComparativos] = useState<FiltroComparativo>(getDefaultFiltersComparativos())

  // Filtros executivos fixos (sempre "hoje")
  const filtrosExecutivos = getDefaultFiltersExecutivos()

  // Cache com configurações específicas por aba
  const cache = useDashboardCache({
    defaultTTL: 3 * 60 * 1000, // 3 minutos por padrão
    maxEntries: 100
  })

  // ============================================================================
  // FUNÇÕES DE CARREGAMENTO POR ABA
  // ============================================================================

  /**
   * Carrega métricas executivas usando novo serviço especializado
   */
  const loadMetricasExecutivas = useCallback(async (): Promise<MetricasExecutivas> => {
    try {
      const filtroEstatisticas = {
        periodo: filtrosExecutivos,
        metaDiaria: config.metas.vendaDiaria
      }

      return await estatisticasPrincipaisService.calcularMetricasExecutivas(filtroEstatisticas)
    } catch (error) {
      console.error('Erro ao carregar métricas executivas:', error)
      // Fallback para serviço anterior
      return await dashboardExecutivoService.carregarMetricasExecutivas(config.metas.vendaDiaria)
    }
  }, [filtrosExecutivos, config.metas.vendaDiaria])

  /**
   * Carrega métricas de profissionais com dados reais
   */
  const loadMetricasProfissionais = useCallback(async (): Promise<MetricasProfissionais> => {
    try {
      console.log('🔄 Carregando métricas de profissionais...', {
        filtros: filtrosProfissionais,
        inicio: new Date(filtrosProfissionais.inicio).toLocaleDateString(),
        fim: new Date(filtrosProfissionais.fim).toLocaleDateString()
      })

      // Usar serviço real com filtros de profissionais
      const analyticsReais = await profissionaisAnalyticsRealService.calcularAnalyticsCompleto(filtrosProfissionais)

      console.log('✅ Analytics reais carregados:', {
        totalProfissionais: analyticsReais.estatisticas.totalProfissionais,
        rankingLength: analyticsReais.ranking.length,
        primeiroProfissional: analyticsReais.ranking[0]?.nome
      })

      return {
        ranking: [], // Manter compatibilidade com tipo original
        individual: {}, // Será preenchido conforme necessário
        estatisticas: analyticsReais.estatisticas,
        // Adicionar dados reais em propriedade customizada
        analyticsReais
      }
    } catch (error) {
      console.error('Erro ao carregar métricas de profissionais:', error)
      // Retornar dados padrão em caso de erro
      return {
        ranking: [],
        individual: {},
        estatisticas: {
          totalProfissionais: 0,
          mediaVendasDia: 0,
          mediaTicket: 0,
          ocupacaoGeral: 0
        }
      }
    }
  }, [filtrosProfissionais])

  /**
   * Carrega métricas comparativas com dados reais do analisesTemporaisService
   */
  const loadMetricasComparativos = useCallback(async (): Promise<MetricasComparativos> => {
    try {
      // Usar período dos filtros comparativos específicos
      const dataInicio = new Date(filtrosComparativos.inicio)
      const dataFim = new Date(filtrosComparativos.fim)
      
      // Gerar chave para cache específico incluindo tipo de comparação e métricas
      const cacheKey = `comparativos-${filtrosComparativos.inicio}-${filtrosComparativos.fim}-${filtrosComparativos.tipoComparacao}-${filtrosComparativos.metricas.join(',')}`
      
      // Verificar cache primeiro
      const cached = cache.get(cacheKey)
      if (cached) {
        console.log('📦 Comparativos carregados do cache')
        return cached as MetricasComparativos
      }

      console.log('🔄 Carregando métricas comparativas com dados reais...', {
        periodo: `${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()}`,
        tipoComparacao: filtrosComparativos.tipoComparacao,
        metricas: filtrosComparativos.metricas
      })

      // Carregar dados em paralelo usando analisesTemporaisService
      const [
        comparativoSemana,
        comparativoMes,
        rankingServicos,
        analyticsClientes,
        estatisticasProfissionais
      ] = await Promise.allSettled([
        // Comparativo baseado no tipo selecionado
        analisesTemporaisService.criarComparativoTemporal(dataInicio, dataFim, filtrosComparativos.tipoComparacao === 'PERIODO_ANTERIOR' ? 'PERIODO_ANTERIOR' : 'PERIODO_ANTERIOR'),
        // Comparativo do mês atual vs mês anterior  
        analisesTemporaisService.criarComparativoTemporal(
          new Date(dataFim.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
          dataFim,
          'PERIODO_ANTERIOR'
        ),
        // Ranking de serviços do período (apenas se métricas incluem serviços)
        filtrosComparativos.metricas.includes('vendas') || filtrosComparativos.metricas.includes('comandas') ?
          analisesTemporaisService.gerarRankingServicos({
            inicio: dataInicio,
            fim: dataFim,
            descricao: 'Período atual',
            totalDias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
          }) : Promise.resolve(null),
        // Analytics de clientes do período (apenas se métricas incluem clientes)
        filtrosComparativos.metricas.includes('clientes') ?
          analisesTemporaisService.gerarAnalyticsClientes({
            inicio: dataInicio,
            fim: dataFim,
            descricao: 'Período atual',
            totalDias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
          }) : Promise.resolve(null),
        // Estatísticas de profissionais (apenas se métricas incluem profissionais)
        filtrosComparativos.metricas.includes('profissionais') ?
          comandasService.getEstatisticasAvancadas({
            inicio: filtrosComparativos.inicio,
            fim: filtrosComparativos.fim
          }) : Promise.resolve(null)
      ])

      // Extrair dados das promises settled
      const comparativoSemanaData = comparativoSemana.status === 'fulfilled' ? comparativoSemana.value : null
      const comparativoMesData = comparativoMes.status === 'fulfilled' ? comparativoMes.value : null
      const rankingServicosData = rankingServicos.status === 'fulfilled' ? rankingServicos.value : null
      const analyticsClientesData = analyticsClientes.status === 'fulfilled' ? analyticsClientes.value : null
      const estatisticasProfissionaisData = estatisticasProfissionais.status === 'fulfilled' ? 
        estatisticasProfissionais.value?.data : null

      // Usar o adaptador para converter dados para formato MetricasComparativos
      const metricasComparativos = ComparativosDataAdapter.adaptarAnaliseCompleta(
        {
          semanaAtual: comparativoSemanaData || undefined,
          mesAtual: comparativoMesData || undefined
        },
        rankingServicosData || undefined,
        analyticsClientesData || undefined,
        estatisticasProfissionaisData || undefined
      )

      console.log('✅ Métricas comparativas carregadas com sucesso', {
        temComparativoSemana: !!comparativoSemanaData,
        temComparativoMes: !!comparativoMesData,
        temRankingServicos: !!rankingServicosData,
        temAnalyticsClientes: !!analyticsClientesData,
        totalServicos: metricasComparativos.servicos.topPorQuantidade.length,
        metricasSelecionadas: filtrosComparativos.metricas
      })

      // Salvar no cache por 5 minutos
      cache.set(cacheKey, metricasComparativos, 5 * 60 * 1000, ['comparativos'])

      return metricasComparativos

    } catch (error) {
      console.error('Erro ao carregar métricas comparativas:', error)
      
      // Fallback: retornar dados básicos em caso de erro
      return ComparativosDataAdapter.gerarMetricasVazias()
    }
  }, [filtrosComparativos, cache, analisesTemporaisService])

  /**
   * Carrega alertas inteligentes usando serviço especializado
   */
  const loadAlertasInteligentes = useCallback(async (): Promise<AlertasInteligentes> => {
    return await alertasInteligentesService.carregarAlertas(config)
  }, [config])

  // ============================================================================
  // FUNÇÕES DE FILTROS
  // ============================================================================

  /**
   * Atualiza filtros de profissionais e recarrega métricas
   */
  const updateFiltrosProfissionais = useCallback(async (novosFiltros: Partial<FiltroAvancado>) => {
    const filtrosAtualizados = { ...filtrosProfissionais, ...novosFiltros }
    setFiltrosProfissionais(filtrosAtualizados)
    
    // Limpar cache de profissionais
    cache.invalidateByTag('profissionais', true)
    
    // Recarregar aba de profissionais automaticamente
    refreshTab('profissionais')
  }, [filtrosProfissionais, cache])

  /**
   * Atualiza filtros de comparativos e recarrega métricas
   */
  const updateFiltrosComparativos = useCallback(async (novosFiltros: Partial<FiltroComparativo>) => {
    const filtrosAtualizados = { ...filtrosComparativos, ...novosFiltros }
    setFiltrosComparativos(filtrosAtualizados)
    
    // Limpar cache comparativos
    cache.invalidateByTag('comparativos', true)
    
    // Recarregar aba comparativos
    refreshTab('comparativos')
  }, [filtrosComparativos, cache])

  /**
   * Atualiza meta diária e recarrega métricas executivas
   */
  const updateMetaDiaria = useCallback(async (meta: number) => {
    const novaConfig = {
      ...config,
      metas: {
        ...config.metas,
        vendaDiaria: meta
      }
    }
    setConfig(novaConfig)
    
    // Limpar cache executivos
    cache.invalidateByTag('visao-geral', true)
    
    // Recarregar aba de visão geral automaticamente
    refreshTab('visao-geral')
  }, [config, cache])

  // ============================================================================
  // FUNÇÕES DE REFRESH
  // ============================================================================

  /**
   * Atualiza uma aba específica
   */
  const refreshTab = useCallback(async (tab: TabDashboard['id']) => {
    try {
      setLoading(prev => ({ ...prev, [tab]: true }))
      setError(null)

      const cacheKey = `${tab}-${Date.now()}`
      
      let newData: Partial<DashboardModularMetrics> = {}

      switch (tab) {
        case 'visao-geral':
          const executivas = await loadMetricasExecutivas()
          newData = { executivas }
          break
        case 'profissionais':
          const profissionais = await loadMetricasProfissionais()
          newData = { profissionais }
          break
        case 'comparativos':
          const comparativos = await loadMetricasComparativos()
          newData = { comparativos }
          break
        case 'alertas':
          const alertas = await loadAlertasInteligentes()
          newData = { alertas }
          break
      }

      // Atualizar métricas
      setMetrics(prev => prev ? { ...prev, ...newData } : null)
      
      // Salvar no cache com tipo correto
      cache.set(cacheKey, newData, 3 * 60 * 1000, [tab])

    } catch (err) {
      console.error(`Erro ao atualizar aba ${tab}:`, err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }))
    }
  }, [loadMetricasExecutivas, loadMetricasProfissionais, loadMetricasComparativos, loadAlertasInteligentes, cache])

  /**
   * Atualiza todas as métricas
   */
  const refreshAll = useCallback(async () => {
    try {
      setLoading({
        geral: true,
        executivas: true,
        profissionais: true,
        comparativos: true,
        alertas: true
      })
      setError(null)

      // Limpar cache
      cache.invalidateByTag('dashboard', true)

      // Carregar todas as métricas em paralelo
      const [executivas, profissionais, comparativos, alertas] = await Promise.all([
        loadMetricasExecutivas(),
        loadMetricasProfissionais(),
        loadMetricasComparativos(),
        loadAlertasInteligentes()
      ])

      const newMetrics: DashboardModularMetrics = {
        executivas,
        profissionais,
        comparativos,
        alertas
      }

      setMetrics(newMetrics)

      // Atualizar configuração com timestamp
      setConfig(prev => ({
        ...prev,
        autoRefresh: {
          ...prev.autoRefresh,
          ultimaAtualizacao: new Date().toISOString()
        }
      }))

    } catch (err) {
      console.error('Erro ao atualizar todas as métricas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading({
        geral: false,
        executivas: false,
        profissionais: false,
        comparativos: false,
        alertas: false
      })
    }
  }, [loadMetricasExecutivas, loadMetricasProfissionais, loadMetricasComparativos, loadAlertasInteligentes, cache])

  /**
   * Atualiza configuração
   */
  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
    
    // Salvar no localStorage
    try {
      const updatedConfig = { ...config, ...newConfig }
      localStorage.setItem('dashboard_config', JSON.stringify(updatedConfig))
    } catch (error) {
      console.warn('Erro ao salvar configuração:', error)
    }
  }, [config])

  // ============================================================================
  // EFEITOS
  // ============================================================================

  /**
   * Carregamento inicial
   */
  useEffect(() => {
    // Carregar configuração salva
    try {
      const savedConfig = localStorage.getItem('dashboard_config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setConfig(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.warn('Erro ao carregar configuração:', error)
    }

    // Carregar filtros salvos
    try {
      const savedFiltersProfissionais = localStorage.getItem('dashboard_filters_profissionais')
      if (savedFiltersProfissionais) {
        const parsed = JSON.parse(savedFiltersProfissionais)
        setFiltrosProfissionais(prev => ({ ...prev, ...parsed }))
      }

      const savedFiltersComparativos = localStorage.getItem('dashboard_filters_comparativos')
      if (savedFiltersComparativos) {
        const parsed = JSON.parse(savedFiltersComparativos)
        setFiltrosComparativos(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros:', error)
    }

    // Carregar métricas iniciais
    refreshAll()
  }, [])

  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!config.autoRefresh.enabled) return

    const interval = setInterval(() => {
      refreshAll()
    }, config.autoRefresh.interval * 60 * 1000)

    return () => clearInterval(interval)
  }, [config.autoRefresh.enabled, config.autoRefresh.interval, refreshAll])

  /**
   * Salvar filtros no localStorage quando mudarem
   */
  useEffect(() => {
    try {
      localStorage.setItem('dashboard_filters_profissionais', JSON.stringify(filtrosProfissionais))
    } catch (error) {
      console.warn('Erro ao salvar filtros de profissionais:', error)
    }
  }, [filtrosProfissionais])

  useEffect(() => {
    try {
      localStorage.setItem('dashboard_filters_comparativos', JSON.stringify(filtrosComparativos))
    } catch (error) {
      console.warn('Erro ao salvar filtros comparativos:', error)
    }
  }, [filtrosComparativos])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    metrics,
    loading,
    error,
    config,
    refreshTab,
    refreshAll,
    updateConfig,
    // Filtros separados por contexto
    filtros: filtrosProfissionais, // Manter compatibilidade
    updateFiltros: updateFiltrosProfissionais, // Manter compatibilidade
    // Novos filtros executivos
    filtrosExecutivos,
    updateMetaDiaria,
    // Novos filtros comparativos
    filtrosComparativos,
    updateFiltrosComparativos
  }
}

export default useDashboardModular