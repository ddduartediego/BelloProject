import { MetricasComparativos, PeriodoComparativo, ComparativoDetalhado } from '@/types/dashboard'
import { ComparativoTemporal, RankingServicos, AnalyticsClientes, TendenciaAnalise } from './analisesTemporaisService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================================
// ADAPTADOR DE DADOS PARA COMPARATIVOS
// ============================================================================

export class ComparativosDataAdapter {
  
  /**
   * Converte ComparativoTemporal para MetricasComparativos
   */
  static adaptarComparativoTemporal(
    comparativo: ComparativoTemporal,
    rankingServicos?: RankingServicos,
    analyticsClientes?: AnalyticsClientes,
    estatisticasProfissionais?: any
  ): MetricasComparativos {
    
    // Adaptar período atual
    const periodoAtual: PeriodoComparativo = {
      inicio: comparativo.periodo.inicio.toISOString(),
      fim: comparativo.periodo.fim.toISOString(),
      vendas: comparativo.metricas.vendas.atual,
      comandas: comparativo.metricas.comandas.atual,
      ticketMedio: comparativo.metricas.comandas.ticketMedio.atual,
      clientesUnicos: comparativo.metricas.clientes.unicos.atual
    }

    // Adaptar período anterior
    const periodoAnterior: PeriodoComparativo = {
      inicio: comparativo.periodoAnterior.inicio.toISOString(),
      fim: comparativo.periodoAnterior.fim.toISOString(),
      vendas: comparativo.metricas.vendas.anterior,
      comandas: comparativo.metricas.comandas.anterior,
      ticketMedio: comparativo.metricas.comandas.ticketMedio.anterior,
      clientesUnicos: comparativo.metricas.clientes.unicos.anterior
    }

    // Criar comparativo detalhado
    const comparativoDetalhado: ComparativoDetalhado = {
      atual: periodoAtual,
      anterior: periodoAnterior,
      crescimento: {
        vendas: comparativo.metricas.vendas.crescimento,
        comandas: comparativo.metricas.comandas.crescimento,
        ticketMedio: comparativo.metricas.comandas.ticketMedio.crescimento,
        clientes: comparativo.metricas.clientes.unicos.crescimento
      },
      crescimentoPercentual: {
        vendas: comparativo.metricas.vendas.percentual,
        comandas: comparativo.metricas.comandas.percentual,
        ticketMedio: this.calcularPercentual(
          comparativo.metricas.comandas.ticketMedio.atual,
          comparativo.metricas.comandas.ticketMedio.anterior
        ),
        clientes: this.calcularPercentual(
          comparativo.metricas.clientes.unicos.atual,
          comparativo.metricas.clientes.unicos.anterior
        )
      }
    }

    // Gerar períodos de análise (últimas semana e mês)
    const hoje = new Date()
    const ultimaSemana = this.gerarPeriodoUltimaSemana(hoje)
    const ultimoMes = this.gerarPeriodoUltimoMes(hoje)

    return {
      periodos: {
        ultimaSemana,
        ultimoMes,
        semanaVsSemanaPassada: comparativoDetalhado,
        mesVsMesPassado: comparativoDetalhado // Será refinado se necessário
      },
      clientes: this.adaptarAnalyticsClientes(analyticsClientes, comparativo),
      servicos: this.adaptarRankingServicos(rankingServicos),
      profissionais: this.adaptarEstatisticasProfissionais(estatisticasProfissionais)
    }
  }

  /**
   * Adapta analytics de clientes para formato MetricasComparativos
   */
  private static adaptarAnalyticsClientes(
    analytics?: AnalyticsClientes,
    comparativo?: ComparativoTemporal
  ) {
    if (!analytics) {
      return {
        novos: { quantidade: 0, percentual: 0, comparativo: 0 },
        retorno: { taxa: 0, comparativo: 0 },
        vips: { quantidade: 0, ticketMedio: 0, comparativo: 0 }
      }
    }

    return {
      novos: {
        quantidade: analytics.segmentacao.novos.quantidade,
        percentual: analytics.segmentacao.novos.percentual,
        comparativo: comparativo?.metricas.clientes.novos.crescimento || 0
      },
      retorno: {
        taxa: analytics.retencao.taxa30dias,
        comparativo: 0 // Calcular se tivermos dados históricos
      },
      vips: {
        quantidade: analytics.segmentacao.vips.quantidade,
        ticketMedio: analytics.segmentacao.vips.ticketMedio,
        comparativo: 0 // Calcular se tivermos dados históricos
      }
    }
  }

  /**
   * Adapta ranking de serviços para formato MetricasComparativos
   */
  private static adaptarRankingServicos(ranking?: RankingServicos) {
    if (!ranking) {
      return {
        topPorQuantidade: [],
        topPorValor: []
      }
    }

    return {
      topPorQuantidade: ranking.topQuantidade.slice(0, 10).map(servico => ({
        nome: servico.nome,
        quantidade: servico.quantidade,
        crescimento: servico.crescimento
      })),
      topPorValor: ranking.topReceita.slice(0, 10).map(servico => ({
        nome: servico.nome,
        valor: servico.receita,
        crescimento: servico.crescimento
      }))
    }
  }

  /**
   * Adapta estatísticas de profissionais para formato MetricasComparativos
   */
  private static adaptarEstatisticasProfissionais(estatisticas?: any) {
    if (!estatisticas || !estatisticas.porProfissional) {
      return {
        topVendas: [],
        topServicos: []
      }
    }

    // Ordenar por vendas e pegar top 10
    const topVendas = [...estatisticas.porProfissional]
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 10)
      .map(prof => ({
        nome: prof.profissional,
        vendas: prof.vendas,
        crescimento: 0 // Calcular se tivermos dados de comparação
      }))

    // Ordenar por número de serviços/comandas e pegar top 10
    const topServicos = [...estatisticas.porProfissional]
      .sort((a, b) => b.comandas - a.comandas)
      .slice(0, 10)
      .map(prof => ({
        nome: prof.profissional,
        servicos: prof.comandas,
        crescimento: 0 // Calcular se tivermos dados de comparação
      }))

    return {
      topVendas,
      topServicos
    }
  }

  /**
   * Gera período da última semana completa
   */
  private static gerarPeriodoUltimaSemana(referencia: Date): PeriodoComparativo {
    const inicio = new Date(referencia)
    inicio.setDate(referencia.getDate() - 7)
    inicio.setHours(0, 0, 0, 0)

    const fim = new Date(referencia)
    fim.setHours(23, 59, 59, 999)

    return {
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      vendas: 0, // Será preenchido com dados reais se disponível
      comandas: 0,
      ticketMedio: 0,
      clientesUnicos: 0
    }
  }

  /**
   * Gera período do último mês completo
   */
  private static gerarPeriodoUltimoMes(referencia: Date): PeriodoComparativo {
    const inicio = new Date(referencia)
    inicio.setDate(referencia.getDate() - 30)
    inicio.setHours(0, 0, 0, 0)

    const fim = new Date(referencia)
    fim.setHours(23, 59, 59, 999)

    return {
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      vendas: 0, // Será preenchido com dados reais se disponível
      comandas: 0,
      ticketMedio: 0,
      clientesUnicos: 0
    }
  }

  /**
   * Calcula percentual de crescimento
   */
  private static calcularPercentual(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? 100 : 0
    return ((atual - anterior) / anterior) * 100
  }

  /**
   * Adapta múltiplos comparativos temporais para análise completa
   */
  static adaptarAnaliseCompleta(
    comparativos: {
      semanaAtual?: ComparativoTemporal
      mesAtual?: ComparativoTemporal
    },
    rankingServicos?: RankingServicos,
    analyticsClientes?: AnalyticsClientes,
    estatisticasProfissionais?: any
  ): MetricasComparativos {
    
    // Usar comparativo principal (semana atual ou mês atual)
    const comparativoPrincipal = comparativos.semanaAtual || comparativos.mesAtual

    if (!comparativoPrincipal) {
      return this.gerarMetricasVazias()
    }

    const metricas = this.adaptarComparativoTemporal(
      comparativoPrincipal,
      rankingServicos,
      analyticsClientes,
      estatisticasProfissionais
    )

    // Se temos ambos os comparativos, usar dados específicos para cada período
    if (comparativos.semanaAtual && comparativos.mesAtual) {
      metricas.periodos.semanaVsSemanaPassada = this.extrairComparativoDetalhado(comparativos.semanaAtual)
      metricas.periodos.mesVsMesPassado = this.extrairComparativoDetalhado(comparativos.mesAtual)
    }

    return metricas
  }

  /**
   * Extrai ComparativoDetalhado de ComparativoTemporal
   */
  private static extrairComparativoDetalhado(comparativo: ComparativoTemporal): ComparativoDetalhado {
    return {
      atual: {
        inicio: comparativo.periodo.inicio.toISOString(),
        fim: comparativo.periodo.fim.toISOString(),
        vendas: comparativo.metricas.vendas.atual,
        comandas: comparativo.metricas.comandas.atual,
        ticketMedio: comparativo.metricas.comandas.ticketMedio.atual,
        clientesUnicos: comparativo.metricas.clientes.unicos.atual
      },
      anterior: {
        inicio: comparativo.periodoAnterior.inicio.toISOString(),
        fim: comparativo.periodoAnterior.fim.toISOString(),
        vendas: comparativo.metricas.vendas.anterior,
        comandas: comparativo.metricas.comandas.anterior,
        ticketMedio: comparativo.metricas.comandas.ticketMedio.anterior,
        clientesUnicos: comparativo.metricas.clientes.unicos.anterior
      },
      crescimento: {
        vendas: comparativo.metricas.vendas.crescimento,
        comandas: comparativo.metricas.comandas.crescimento,
        ticketMedio: comparativo.metricas.comandas.ticketMedio.crescimento,
        clientes: comparativo.metricas.clientes.unicos.crescimento
      },
      crescimentoPercentual: {
        vendas: comparativo.metricas.vendas.percentual,
        comandas: comparativo.metricas.comandas.percentual,
        ticketMedio: this.calcularPercentual(
          comparativo.metricas.comandas.ticketMedio.atual,
          comparativo.metricas.comandas.ticketMedio.anterior
        ),
        clientes: this.calcularPercentual(
          comparativo.metricas.clientes.unicos.atual,
          comparativo.metricas.clientes.unicos.anterior
        )
      }
    }
  }

  /**
   * Gera métricas vazias para fallback
   */
  static gerarMetricasVazias(): MetricasComparativos {
    const hoje = new Date()
    const periodoVazio: PeriodoComparativo = {
      inicio: hoje.toISOString(),
      fim: hoje.toISOString(),
      vendas: 0,
      comandas: 0,
      ticketMedio: 0,
      clientesUnicos: 0
    }

    const comparativoVazio: ComparativoDetalhado = {
      atual: periodoVazio,
      anterior: periodoVazio,
      crescimento: { vendas: 0, comandas: 0, ticketMedio: 0, clientes: 0 },
      crescimentoPercentual: { vendas: 0, comandas: 0, ticketMedio: 0, clientes: 0 }
    }

    return {
      periodos: {
        ultimaSemana: periodoVazio,
        ultimoMes: periodoVazio,
        semanaVsSemanaPassada: comparativoVazio,
        mesVsMesPassado: comparativoVazio
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
  }
}

export default ComparativosDataAdapter 