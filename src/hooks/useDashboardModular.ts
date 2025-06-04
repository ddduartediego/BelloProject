import { useState, useEffect, useCallback } from 'react'
import { 
  DashboardModularMetrics, 
  DashboardConfig, 
  UseDashboardModularReturn,
  TabDashboard,
  MetricasExecutivas,
  MetricasProfissionais,
  MetricasComparativos,
  AlertasInteligentes
} from '@/types/dashboard'
import dashboardExecutivoService from '@/services/dashboardExecutivoService'
import alertasInteligentesService from '@/services/alertasInteligentesService'
import profissionaisAnalyticsService from '@/services/profissionaisAnalyticsService'
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

  // Cache com configurações específicas por aba
  const cache = useDashboardCache({
    defaultTTL: 3 * 60 * 1000, // 3 minutos por padrão
    maxEntries: 100
  })

  // ============================================================================
  // FUNÇÕES DE CARREGAMENTO POR ABA
  // ============================================================================

  /**
   * Carrega métricas executivas usando serviço especializado
   */
  const loadMetricasExecutivas = useCallback(async (): Promise<MetricasExecutivas> => {
    return await dashboardExecutivoService.carregarMetricasExecutivas(config.metas.vendaDiaria)
  }, [config.metas.vendaDiaria])

  /**
   * Carrega métricas de profissionais
   */
  const loadMetricasProfissionais = useCallback(async (): Promise<MetricasProfissionais> => {
    try {
      const [ranking, estatisticas] = await Promise.all([
        profissionaisAnalyticsService.carregarRankingProfissionais(),
        // Manter estatísticas simples por enquanto
        Promise.resolve({
          totalProfissionais: 8,
          mediaVendasDia: 650,
          mediaTicket: 92,
          ocupacaoGeral: 78
        })
      ])

      return {
        ranking,
        individual: {}, // Será preenchido conforme necessário
        estatisticas
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
  }, [])

  /**
   * Carrega métricas comparativas
   */
  const loadMetricasComparativos = useCallback(async (): Promise<MetricasComparativos> => {
    // TODO: Implementar métricas comparativas
    return {
      periodos: {
        ultimaSemana: {
          inicio: '',
          fim: '',
          vendas: 0,
          comandas: 0,
          ticketMedio: 0,
          clientesUnicos: 0
        },
        ultimoMes: {
          inicio: '',
          fim: '',
          vendas: 0,
          comandas: 0,
          ticketMedio: 0,
          clientesUnicos: 0
        },
        semanaVsSemanaPassada: {
          atual: {
            inicio: '',
            fim: '',
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientesUnicos: 0
          },
          anterior: {
            inicio: '',
            fim: '',
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientesUnicos: 0
          },
          crescimento: {
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientes: 0
          },
          crescimentoPercentual: {
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientes: 0
          }
        },
        mesVsMesPassado: {
          atual: {
            inicio: '',
            fim: '',
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientesUnicos: 0
          },
          anterior: {
            inicio: '',
            fim: '',
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientesUnicos: 0
          },
          crescimento: {
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientes: 0
          },
          crescimentoPercentual: {
            vendas: 0,
            comandas: 0,
            ticketMedio: 0,
            clientes: 0
          }
        }
      },
      clientes: {
        novos: { quantidade: 0, percentual: 0, comparativo: 0 },
        retorno: { taxa: 0, comparativo: 0 },
        vips: { quantidade: 0, ticketMedio: 0, comparativo: 0 }
      },
      servicos: {
        topPorQuantidade: [],
        topPorValor: []
      },
      profissionais: {
        topVendas: [],
        topServicos: []
      }
    }
  }, [])

  /**
   * Carrega alertas inteligentes usando serviço especializado
   */
  const loadAlertasInteligentes = useCallback(async (): Promise<AlertasInteligentes> => {
    return await alertasInteligentesService.carregarAlertas(config)
  }, [config])

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
    updateConfig
  }
}

export default useDashboardModular