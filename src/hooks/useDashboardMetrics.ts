import { useState, useEffect } from 'react'
import { 
  clientesService, 
  agendamentosService, 
  profissionaisService,
  servicosService,
  comandasService
} from '@/services'
import { DashboardFilters, PeriodoCalculado } from '@/contexts/DashboardFiltersContext'

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
  // Métricas de performance avançadas
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
  // Dados de comparação
  comparacao?: {
    vendas: {
      anterior: number
      crescimento: number
      crescimentoPercentual: number
    }
    agendamentos: {
      anterior: number
      crescimento: number
      crescimentoPercentual: number
    }
  }
}

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null
  loading: boolean
  error: string | null
  refreshMetrics: () => Promise<void>
}

interface UseDashboardMetricsProps {
  filters?: Partial<DashboardFilters>
  periodoAtual?: PeriodoCalculado
  periodoComparacao?: PeriodoCalculado | null
}

export function useDashboardMetrics(options?: {
  filters?: any
  periodoAtual?: any
  periodoComparacao?: any
}): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Determinar período a usar (filtros ou padrão)
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

      const periodoInicio = options?.periodoAtual?.inicio || inicioMes
      const periodoFim = options?.periodoAtual?.fim || fimMes

      // Buscar todas as métricas em paralelo para melhor performance
      const [
        clientesStats,
        agendamentosStats,
        profissionaisStats,
        servicosStats,
        vendasHoje,
        vendasPeriodo,
        vendasAno
      ] = await Promise.all([
        clientesService.getEstatisticas(),
        agendamentosService.getEstatisticas(),
        profissionaisService.getEstatisticas(),
        servicosService.getEstatisticas(),
        comandasService.getMetricasPeriodo('hoje'),
        comandasService.getEstatisticas({
          inicio: periodoInicio.toISOString(),
          fim: periodoFim.toISOString()
        }),
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
        totalMes: vendasPeriodo.data?.faturamentoTotal || 0,
        totalAno: vendasAno.data?.faturamento || 0, // Por enquanto usa o mês
        percentualCrescimento: 0, // Calcularemos com comparação
        totalComandas: vendasPeriodo.data?.totalComandas || 0,
        ticketMedio: vendasPeriodo.data?.ticketMedio || 0
      }

      // Buscar dados detalhados para o período filtrado
      const { data: vendaDetalhada } = await comandasService.getEstatisticasAvancadas({
        inicio: periodoInicio.toISOString(),
        fim: periodoFim.toISOString(),
        ...(options?.filters?.profissionalSelecionado && { 
          profissionalId: options.filters.profissionalSelecionado 
        })
      })

      // Buscar métricas de performance avançadas
      const [
        taxaRetornoData,
        ocupacaoData,
        horariosPicoData
      ] = await Promise.all([
        agendamentosService.getTaxaRetornoClientes({
          inicio: periodoInicio.toISOString(),
          fim: periodoFim.toISOString()
        }),
        agendamentosService.getOcupacaoProfissionais({
          inicio: periodoInicio.toISOString(),
          fim: periodoFim.toISOString()
        }),
        agendamentosService.getHorariosPico({
          inicio: periodoInicio.toISOString(),
          fim: periodoFim.toISOString()
        })
      ])

      // Buscar dados de comparação se período de comparação existe
      let comparacao: DashboardMetrics['comparacao'] | undefined
      if (options?.periodoComparacao) {
        const [vendasComparacao, agendamentosComparacao] = await Promise.all([
          comandasService.getEstatisticas({
            inicio: options.periodoComparacao.inicio.toISOString(),
            fim: options.periodoComparacao.fim.toISOString()
          }),
          agendamentosService.getAll(
            { page: 1, limit: 1 }, // Só precisamos do count
            {
              dataInicio: options.periodoComparacao.inicio.toISOString(),
              dataFim: options.periodoComparacao.fim.toISOString()
            }
          )
        ])

        const vendasAtual = vendasPeriodo.data?.faturamentoTotal || 0
        const vendasAnterior = vendasComparacao.data?.faturamentoTotal || 0
        const agendamentosAtual = agendamentosStats.data?.total || 0
        const agendamentosAnterior = agendamentosComparacao.data?.total || 0

        comparacao = {
          vendas: {
            anterior: vendasAnterior,
            crescimento: vendasAtual - vendasAnterior,
            crescimentoPercentual: vendasAnterior > 0 ? ((vendasAtual - vendasAnterior) / vendasAnterior) * 100 : 0
          },
          agendamentos: {
            anterior: agendamentosAnterior,
            crescimento: agendamentosAtual - agendamentosAnterior,
            crescimentoPercentual: agendamentosAnterior > 0 ? ((agendamentosAtual - agendamentosAnterior) / agendamentosAnterior) * 100 : 0
          }
        }
      }

      // Montar objeto de métricas de performance
      const performance = {
        taxaRetorno: {
          percentual: taxaRetornoData.data?.taxaRetorno || 0,
          clientesTotais: taxaRetornoData.data?.clientesTotais || 0,
          clientesRecorrentes: taxaRetornoData.data?.clientesRecorrentes || 0
        },
        ocupacao: {
          media: ocupacaoData.data?.ocupacaoMedia || 0,
          profissionais: ocupacaoData.data?.profissionais?.map(p => ({
            nome: p.nome,
            ocupacao: p.ocupacao,
            horasAgendadas: p.horasAgendadas,
            totalAgendamentos: p.totalAgendamentos
          })) || []
        },
        horariosPico: {
          horarios: horariosPicoData.data?.horariosPopulares || [],
          diasSemana: horariosPicoData.data?.diasSemanaPopulares || []
        }
      }

      // Montar objeto de métricas
      const dashboardMetrics: DashboardMetrics = {
        vendas,
        agendamentos: agendamentosStats.data!,
        clientes: clientesStats.data!,
        profissionais: profissionaisStats.data!,
        servicos: servicosStats.data!,
        vendaDetalhada: vendaDetalhada || undefined,
        performance,
        comparacao
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

  // Carregar métricas na inicialização ou quando filtros mudarem
  useEffect(() => {
    fetchMetrics()
  }, [options?.filters, options?.periodoAtual, options?.periodoComparacao])

  return {
    metrics,
    loading,
    error,
    refreshMetrics
  }
}

export default useDashboardMetrics 