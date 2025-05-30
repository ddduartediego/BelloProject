import { useState, useEffect } from 'react'
import { 
  clientesService, 
  agendamentosService, 
  profissionaisService,
  servicosService
} from '@/services'

export interface DashboardMetrics {
  vendas: {
    totalDia: number
    totalMes: number
    totalAno: number
    percentualCrescimento: number
  }
  agendamentos: {
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
}

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null
  loading: boolean
  error: string | null
  refreshMetrics: () => Promise<void>
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar todas as métricas em paralelo para melhor performance
      const [
        clientesStats,
        agendamentosStats,
        profissionaisStats,
        servicosStats
      ] = await Promise.all([
        clientesService.getEstatisticas(),
        agendamentosService.getEstatisticas(),
        profissionaisService.getEstatisticas(),
        servicosService.getEstatisticas()
      ])

      // Verificar se houve erros
      if (clientesStats.error) throw new Error(clientesStats.error)
      if (agendamentosStats.error) throw new Error(agendamentosStats.error)
      if (profissionaisStats.error) throw new Error(profissionaisStats.error)
      if (servicosStats.error) throw new Error(servicosStats.error)

      // Calcular métricas de vendas (por enquanto mockadas até implementar comandas)
      // TODO: Implementar quando tiver service de comandas/vendas
      const vendas = {
        totalDia: 850.00,
        totalMes: 12500.00,
        totalAno: 98500.00,
        percentualCrescimento: 15.8
      }

      // Montar objeto de métricas
      const dashboardMetrics: DashboardMetrics = {
        vendas,
        agendamentos: agendamentosStats.data!,
        clientes: clientesStats.data!,
        profissionais: profissionaisStats.data!,
        servicos: servicosStats.data!
      }

      setMetrics(dashboardMetrics)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar métricas'
      setError(errorMessage)
      console.error('Erro ao buscar métricas do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshMetrics = async () => {
    await fetchMetrics()
  }

  // Carregar métricas na inicialização
  useEffect(() => {
    fetchMetrics()
  }, [])

  return {
    metrics,
    loading,
    error,
    refreshMetrics
  }
}

export default useDashboardMetrics 