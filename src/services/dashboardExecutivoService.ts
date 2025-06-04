import { 
  comandasService, 
  caixaService, 
  clientesService, 
  profissionaisService 
} from '@/services'
import { MetricasExecutivas } from '@/types/dashboard'

// ============================================================================
// SERVIÇO ESPECIALIZADO PARA MÉTRICAS EXECUTIVAS
// ============================================================================

export class DashboardExecutivoService {
  
  /**
   * Calcula métricas do caixa com comparativos
   */
  async calcularMetricasCaixa() {
    try {
      const caixaAtivo = await caixaService.getCaixaAtivo()
      const hoje = new Date()
      
      if (!caixaAtivo.data) {
        // Retornar dados padrão se não há caixa ativo
        return {
          status: 'FECHADO' as 'ABERTO' | 'FECHADO',
          saldoAtual: 0,
          tempoAberto: 0,
          comparativoOntem: 0,
          ultimaMovimentacao: hoje.toISOString()
        }
      }

      // Buscar o caixa com movimentações para calcular saldo atual
      const caixaComMovimentacoes = await caixaService.getById(caixaAtivo.data.id)
      
      let saldoAtual = caixaAtivo.data.saldo_inicial

      if (caixaComMovimentacoes.data?.movimentacoes) {
        // Calcular saldo atual usando a mesma lógica da página do caixa
        const totalEntradas = caixaComMovimentacoes.data.movimentacoes
          .filter(mov => mov.tipo_movimentacao === 'ENTRADA' || mov.tipo_movimentacao === 'REFORCO')
          .reduce((total, mov) => total + mov.valor, 0)

        const totalSaidas = caixaComMovimentacoes.data.movimentacoes
          .filter(mov => mov.tipo_movimentacao === 'SAIDA' || mov.tipo_movimentacao === 'SANGRIA')
          .reduce((total, mov) => total + Math.abs(mov.valor), 0)

        saldoAtual = caixaAtivo.data.saldo_inicial + totalEntradas - totalSaidas
      }
      
      // Buscar movimentações do caixa de hoje e ontem para comparativo
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
      const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59)
      
      // Calcular comparativo baseado em vendas do dia
      const [vendasHoje, vendasOntem] = await Promise.all([
        comandasService.getEstatisticas({
          inicio: inicioHoje.toISOString(),
          fim: hoje.toISOString()
        }),
        comandasService.getEstatisticas({
          inicio: inicioOntem.toISOString(),
          fim: inicioHoje.toISOString()
        })
      ])

      const vendaHojeTotal = vendasHoje.data?.faturamentoTotal || 0
      const vendaOntemTotal = vendasOntem.data?.faturamentoTotal || 0
      
      const comparativoOntem = vendaOntemTotal > 0 
        ? ((vendaHojeTotal - vendaOntemTotal) / vendaOntemTotal) * 100 
        : 0

      return {
        status: caixaAtivo.data.status as 'ABERTO' | 'FECHADO',
        saldoAtual: saldoAtual,
        tempoAberto: caixaAtivo.data.data_abertura 
          ? Math.floor((hoje.getTime() - new Date(caixaAtivo.data.data_abertura).getTime()) / (1000 * 60))
          : 0,
        comparativoOntem: Math.round(comparativoOntem),
        ultimaMovimentacao: caixaAtivo.data.atualizado_em || hoje.toISOString()
      }
    } catch (error) {
      console.error('Erro ao calcular métricas do caixa:', error)
      throw error
    }
  }

  /**
   * Calcula métricas de vendas com comparativos detalhados
   */
  async calcularMetricasVendas(metaDiaria?: number) {
    try {
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
      
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
      const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59)

      // Buscar vendas com mais detalhamento
      const [estatisticasHoje, estatisticasOntem, comandasRecentes] = await Promise.all([
        comandasService.getEstatisticas({
          inicio: inicioHoje.toISOString(),
          fim: fimHoje.toISOString()
        }),
        comandasService.getEstatisticas({
          inicio: inicioOntem.toISOString(),
          fim: fimOntem.toISOString()
        }),
        // Buscar comandas recentes para última venda
        comandasService.getAll({ page: 1, limit: 1 })
      ])

      const vendaHojeTotal = estatisticasHoje.data?.faturamentoTotal || 0
      const vendaOntemTotal = estatisticasOntem.data?.faturamentoTotal || 0
      
      const percentualVsOntem = vendaOntemTotal > 0 
        ? ((vendaHojeTotal - vendaOntemTotal) / vendaOntemTotal) * 100 
        : 0

      const percentualMeta = metaDiaria ? (vendaHojeTotal / metaDiaria) * 100 : 0

      // Usar timestamp da última comanda ou agora
      const ultimaVenda = comandasRecentes.data?.data?.[0]?.criado_em || hoje.toISOString()

      return {
        totalDia: vendaHojeTotal,
        percentualVsOntem: Math.round(percentualVsOntem),
        percentualMeta: Math.round(percentualMeta),
        ultimaVenda,
        metaDiaria
      }
    } catch (error) {
      console.error('Erro ao calcular métricas de vendas:', error)
      throw error
    }
  }

  /**
   * Calcula métricas de comandas com análise detalhada
   */
  async calcularMetricasComandas() {
    try {
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
      
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
      const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59)

      // Buscar comandas detalhadas
      const [comandasHoje, comandasOntem, estatisticasHoje, comandasRecentes] = await Promise.all([
        comandasService.getAll({}, {
          data_inicio: inicioHoje.toISOString(),
          data_fim: fimHoje.toISOString()
        }),
        comandasService.getAll({}, {
          data_inicio: inicioOntem.toISOString(),
          data_fim: fimOntem.toISOString()
        }),
        comandasService.getEstatisticas({
          inicio: inicioHoje.toISOString(),
          fim: fimHoje.toISOString()
        }),
        comandasService.getAll({ page: 1, limit: 1 })
      ])

      const quantidadeHoje = comandasHoje.data?.data?.length || 0
      const quantidadeOntem = comandasOntem.data?.data?.length || 0
      const faturamentoHoje = estatisticasHoje.data?.faturamentoTotal || 0
      
      const ticketMedio = quantidadeHoje > 0 ? faturamentoHoje / quantidadeHoje : 0
      const comparativoOntem = quantidadeHoje - quantidadeOntem
      
      // Usar timestamp da última comanda
      const ultimaComandaTimestamp = comandasRecentes.data?.data?.[0]?.criado_em || hoje.toISOString()

      return {
        quantidadeHoje,
        ticketMedio,
        comparativoOntem,
        ultimaComanda: ultimaComandaTimestamp
      }
    } catch (error) {
      console.error('Erro ao calcular métricas de comandas:', error)
      throw error
    }
  }

  /**
   * Calcula métricas de profissionais com ranking
   */
  async calcularMetricasProfissionais() {
    try {
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)

      const [estatisticasProfissionais, vendasHoje] = await Promise.all([
        profissionaisService.getEstatisticas(),
        comandasService.getEstatisticasAvancadas({
          inicio: inicioHoje.toISOString(),
          fim: fimHoje.toISOString()
        })
      ])

      const totalAtivos = estatisticasProfissionais.data?.total || 0
      const vendas = vendasHoje.data?.porProfissional || []
      
      // Encontrar top profissional do dia
      const topProfissional = vendas.length > 0 ? vendas[0] : {
        profissional: 'N/A',
        vendas: 0,
        comandas: 0
      }

      // Calcular ocupação média do dia (baseada na quantidade de comandas vs profissionais ativos)
      // Assumindo uma média de 6-8 comandas por profissional como ocupação ideal
      const totalComandas = vendas.reduce((acc, prof) => acc + prof.comandas, 0)
      const comandasMediaPorProfissional = totalAtivos > 0 ? totalComandas / totalAtivos : 0
      const ocupacaoMedia = Math.min(Math.round((comandasMediaPorProfissional / 6) * 100), 100)

      return {
        totalAtivos,
        topProfissional: {
          nome: topProfissional.profissional,
          vendas: topProfissional.vendas
        },
        ocupacaoMedia,
        avaliacaoMedia: 4.5 // TODO: Implementar sistema de avaliações
      }
    } catch (error) {
      console.error('Erro ao calcular métricas de profissionais:', error)
      throw error
    }
  }

  /**
   * Calcula métricas da semana com análise temporal
   */
  async calcularMetricasSemana() {
    try {
      const hoje = new Date()
      const inicioSemanaAtual = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
      const inicioSemanaPassada = new Date(hoje.getTime() - 14 * 24 * 60 * 60 * 1000)
      const fimSemanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [semanaAtual, semanaPassada] = await Promise.all([
        comandasService.getEstatisticas({
          inicio: inicioSemanaAtual.toISOString(),
          fim: hoje.toISOString()  
        }),
        comandasService.getEstatisticas({
          inicio: inicioSemanaPassada.toISOString(),
          fim: fimSemanaPassada.toISOString()
        })
      ])

      const vendasSemanaAtual = semanaAtual.data?.faturamentoTotal || 0
      const vendasSemanaPassada = semanaPassada.data?.faturamentoTotal || 0

      const percentualVsSemanaPassada = vendasSemanaPassada > 0 
        ? ((vendasSemanaAtual - vendasSemanaPassada) / vendasSemanaPassada) * 100 
        : 0

      return {
        vendas: vendasSemanaAtual,
        percentualVsSemanaPassada: Math.round(percentualVsSemanaPassada)
      }
    } catch (error) {
      console.error('Erro ao calcular métricas da semana:', error)
      throw error
    }
  }

  /**
   * Calcula métricas de clientes com análise de comportamento
   */
  async calcularMetricasClientes() {
    try {
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

      const [estatisticasClientes, clientesHoje] = await Promise.all([
        clientesService.getEstatisticas(),
        // TODO: Implementar busca de clientes novos hoje
        Promise.resolve({ data: { novosHoje: 0 } })
      ])

      const totalAtivos = estatisticasClientes.data?.total || 0
      const novosHoje = 0 // TODO: Implementar contagem real
      const taxaRetorno = 68 // TODO: Implementar cálculo real
      const satisfacaoMedia = 4.7 // TODO: Implementar sistema de avaliações

      return {
        novosHoje,
        taxaRetorno,
        totalAtivos,
        satisfacaoMedia
      }
    } catch (error) {
      console.error('Erro ao calcular métricas de clientes:', error)
      throw error
    }
  }

  /**
   * Carrega todas as métricas executivas em paralelo
   */
  async carregarMetricasExecutivas(metaDiaria?: number): Promise<MetricasExecutivas> {
    try {
      const [
        caixa,
        vendas,
        comandas,
        profissionaisAtivos,
        semanaAtual,
        clientes
      ] = await Promise.all([
        this.calcularMetricasCaixa(),
        this.calcularMetricasVendas(metaDiaria),
        this.calcularMetricasComandas(),
        this.calcularMetricasProfissionais(),
        this.calcularMetricasSemana(),
        this.calcularMetricasClientes()
      ])

      return {
        caixa,
        vendas,
        comandas,
        profissionaisAtivos,
        semanaAtual,
        clientes
      }
    } catch (error) {
      console.error('Erro ao carregar métricas executivas:', error)
      throw error
    }
  }
}

// Instância singleton
export const dashboardExecutivoService = new DashboardExecutivoService()
export default dashboardExecutivoService 