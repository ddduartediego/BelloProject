import { useState, useEffect } from 'react'
import { 
  clientesService, 
  agendamentosService, 
  profissionaisService,
  servicosService,
  comandasService
} from '@/services'

export interface DashboardMetrics {
  vendas: {
    totalDia: number
    totalMes: number
    totalAno: number
    percentualCrescimento: number
    totalComandas: number
    ticketMedio: number
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
  // Novos dados para métricas avançadas
  vendaDetalhada?: {
    porDia: Array<{ data: string; vendas: number; comandas: number }>
    porProfissional: Array<{ profissional: string; vendas: number; comandas: number; ticketMedio: number }>
    servicosPopulares: Array<{ servico: string; quantidade: number; valor: number }>
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
        servicosStats,
        vendasHoje,
        vendasMes,
        vendasAno
      ] = await Promise.all([
        clientesService.getEstatisticas(),
        agendamentosService.getEstatisticas(),
        profissionaisService.getEstatisticas(),
        servicosService.getEstatisticas(),
        comandasService.getMetricasPeriodo('hoje'),
        comandasService.getMetricasPeriodo('mes'),
        comandasService.getMetricasPeriodo('mes') // Para o ano, usaremos mês por enquanto
      ])

      // Verificar se houve erros
      if (clientesStats.error) throw new Error(clientesStats.error)
      if (agendamentosStats.error) throw new Error(agendamentosStats.error)
      if (profissionaisStats.error) throw new Error(profissionaisStats.error)
      if (servicosStats.error) throw new Error(servicosStats.error)

      // Calcular métricas de vendas REAIS baseadas em comandas
      const vendas = {
        totalDia: vendasHoje.data?.faturamento || 0,
        totalMes: vendasMes.data?.faturamento || 0,
        totalAno: vendasAno.data?.faturamento || 0, // Por enquanto usa o mês
        percentualCrescimento: vendasMes.data?.crescimento || 0,
        totalComandas: vendasMes.data?.comandas || 0,
        ticketMedio: vendasMes.data?.ticketMedio || 0
      }

      // Buscar dados detalhados para o mês atual
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

      const { data: vendaDetalhada } = await comandasService.getEstatisticasAvancadas({
        inicio: inicioMes.toISOString(),
        fim: fimMes.toISOString()
      })

      // Montar objeto de métricas
      const dashboardMetrics: DashboardMetrics = {
        vendas,
        agendamentos: agendamentosStats.data!,
        clientes: clientesStats.data!,
        profissionais: profissionaisStats.data!,
        servicos: servicosStats.data!,
        vendaDetalhada: vendaDetalhada || undefined
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