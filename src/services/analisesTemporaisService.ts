import { comandasService, clientesService, profissionaisService, servicosService } from '@/services'
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, format, isWeekend, getDay, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================================
// INTERFACES DE ANÁLISES TEMPORAIS
// ============================================================================

export interface PeriodoAnalise {
  inicio: Date
  fim: Date
  descricao: string
  totalDias: number
}

export interface ComparativoTemporal {
  periodo: PeriodoAnalise
  periodoAnterior: PeriodoAnalise
  metricas: {
    vendas: {
      atual: number
      anterior: number
      crescimento: number
      percentual: number
      tendencia: 'CRESCIMENTO' | 'QUEDA' | 'ESTAVEL'
    }
    comandas: {
      atual: number
      anterior: number
      crescimento: number
      percentual: number
      ticketMedio: {
        atual: number
        anterior: number
        crescimento: number
      }
    }
    clientes: {
      unicos: {
        atual: number
        anterior: number
        crescimento: number
      }
      novos: {
        atual: number
        anterior: number
        crescimento: number
      }
      retorno: {
        atual: number
        anterior: number
        crescimento: number
      }
    }
    profissionais: {
      ocupacaoMedia: {
        atual: number
        anterior: number
        crescimento: number
      }
      satisfacaoMedia: {
        atual: number
        anterior: number
        crescimento: number
      }
    }
  }
  insights: string[]
  recomendacoes: string[]
}

export interface TendenciaAnalise {
  tipo: 'VENDAS' | 'COMANDAS' | 'CLIENTES' | 'OCUPACAO'
  periodo: string
  dados: Array<{
    data: string
    valor: number
    meta?: number
  }>
  tendencia: {
    direcao: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL' | 'VOLATIL'
    intensidade: number // 0-100
    confianca: number // 0-100
    r2: number // coeficiente de determinação
  }
  previsao: {
    proximosDias: Array<{
      data: string
      valor: number
      limite_inferior: number
      limite_superior: number
      confianca: number
    }>
  }
  padroes: {
    semanal: Array<{
      diaSemana: string
      media: number
      variacao: number
    }>
    horarios: Array<{
      hora: string
      media: number
      variacao: number
    }>
  }
}

export interface RankingServicos {
  periodo: PeriodoAnalise
  topQuantidade: Array<{
    id: string
    nome: string
    categoria: string
    quantidade: number
    crescimento: number
    percentualTotal: number
    receita: number
  }>
  topReceita: Array<{
    id: string
    nome: string
    categoria: string
    receita: number
    crescimento: number
    percentualTotal: number
    quantidade: number
  }>
  analytics: {
    servicoMaisPopular: string
    servicoMaisLucrativo: string
    categoriaDestaque: string
    crescimentoMedio: number
    diversificacao: number // índice de diversificação
  }
}

export interface AnalyticsClientes {
  periodo: PeriodoAnalise
  segmentacao: {
    novos: {
      quantidade: number
      percentual: number
      ticketMedio: number
      origem: Array<{ canal: string; quantidade: number }>
    }
    recorrentes: {
      quantidade: number
      percentual: number
      ticketMedio: number
      frequenciaMedia: number
    }
    vips: {
      quantidade: number
      percentual: number
      ticketMedio: number
      criterio: string
    }
    emRisco: {
      quantidade: number
      percentual: number
      diasSemVisita: number
      valorPerdido: number
    }
  }
  comportamento: {
    frequencia: Array<{
      faixa: string
      quantidade: number
      percentual: number
    }>
    ticketMedio: Array<{
      faixa: string
      quantidade: number
      percentual: number
    }>
    preferencias: Array<{
      servico: string
      quantidade: number
      percentual: number
    }>
  }
  retencao: {
    taxa30dias: number
    taxa60dias: number
    taxa90dias: number
    churnRate: number
    ltv: number // Lifetime Value
  }
}

// ============================================================================
// SERVIÇO DE ANÁLISES TEMPORAIS AVANÇADAS
// ============================================================================

export class AnalisesTemporaisService {

  /**
   * Cria análise comparativa entre dois períodos
   */
  async criarComparativoTemporal(
    dataInicio: Date, 
    dataFim: Date, 
    tipoComparacao: 'PERIODO_ANTERIOR' | 'ANO_ANTERIOR' = 'PERIODO_ANTERIOR'
  ): Promise<ComparativoTemporal> {
    try {
      const periodo = this.criarPeriodo(dataInicio, dataFim)
      const periodoAnterior = this.calcularPeriodoAnterior(periodo, tipoComparacao)

      // Buscar dados dos dois períodos em paralelo
      const [dadosAtual, dadosAnterior] = await Promise.all([
        this.buscarDadosPeriodo(periodo),
        this.buscarDadosPeriodo(periodoAnterior)
      ])

      // Calcular métricas comparativas
      const metricas = this.calcularMetricasComparativas(dadosAtual, dadosAnterior)

      // Gerar insights automáticos
      const insights = this.gerarInsightsTendencia(metricas)
      const recomendacoes = this.gerarRecomendacoes(metricas, insights)

      return {
        periodo,
        periodoAnterior,
        metricas,
        insights,
        recomendacoes
      }

    } catch (error) {
      console.error('Erro ao criar comparativo temporal:', error)
      throw new Error('Falha ao criar análise comparativa')
    }
  }

  /**
   * Análise de tendências com previsões
   */
  async analisarTendencias(
    tipo: TendenciaAnalise['tipo'],
    periodo: PeriodoAnalise
  ): Promise<TendenciaAnalise> {
    try {
      // Buscar dados históricos expandidos para melhor análise
      const periodoExpandido = this.expandirPeriodoParaAnalise(periodo)
      const dados = await this.buscarDadosHistoricos(tipo, periodoExpandido)

      // Calcular tendência usando regressão linear simples
      const tendencia = this.calcularTendencia(dados)

      // Gerar previsões para os próximos dias
      const previsao = this.gerarPrevisoes(dados, tendencia, 7) // 7 dias

      // Identificar padrões semanais e horários
      const padroes = await this.identificarPadroes(tipo, periodoExpandido)

      return {
        tipo,
        periodo: format(periodo.inicio, 'dd/MM/yyyy', { locale: ptBR }) + ' - ' + format(periodo.fim, 'dd/MM/yyyy', { locale: ptBR }),
        dados,
        tendencia,
        previsao,
        padroes
      }

    } catch (error) {
      console.error('Erro ao analisar tendências:', error)
      throw new Error('Falha ao analisar tendências')
    }
  }

  /**
   * Ranking de serviços com analytics
   */
  async gerarRankingServicos(periodo: PeriodoAnalise): Promise<RankingServicos> {
    try {
      // Buscar dados de serviços do período
      const comandas = await this.buscarComandasPeriodo(periodo)
      const servicos = await servicosService.getAll()

      // Simular dados para demonstração
      const topQuantidade = [
        {
          id: '1',
          nome: 'Corte Masculino',
          categoria: 'Cortes',
          quantidade: 145,
          crescimento: 12,
          percentualTotal: 28.5,
          receita: 7250
        },
        {
          id: '2', 
          nome: 'Escova Progressiva',
          categoria: 'Química',
          quantidade: 89,
          crescimento: -5,
          percentualTotal: 17.4,
          receita: 12460
        },
        {
          id: '3',
          nome: 'Coloração',
          categoria: 'Química', 
          quantidade: 72,
          crescimento: 18,
          percentualTotal: 14.1,
          receita: 9360
        },
        {
          id: '4',
          nome: 'Manicure',
          categoria: 'Estética',
          quantidade: 68,
          crescimento: 3,
          percentualTotal: 13.3,
          receita: 2380
        },
        {
          id: '5',
          nome: 'Barba',
          categoria: 'Barbearia',
          quantidade: 55,
          crescimento: 8,
          percentualTotal: 10.8,
          receita: 1650
        }
      ]

      const topReceita = [...topQuantidade].sort((a, b) => b.receita - a.receita)

      const analytics = {
        servicoMaisPopular: topQuantidade[0].nome,
        servicoMaisLucrativo: topReceita[0].nome,
        categoriaDestaque: 'Química',
        crescimentoMedio: topQuantidade.reduce((acc, s) => acc + s.crescimento, 0) / topQuantidade.length,
        diversificacao: 75 // Simulado
      }

      return {
        periodo,
        topQuantidade,
        topReceita,
        analytics
      }

    } catch (error) {
      console.error('Erro ao gerar ranking de serviços:', error)
      throw new Error('Falha ao gerar ranking de serviços')
    }
  }

  /**
   * Analytics avançados de clientes
   */
  async gerarAnalyticsClientes(periodo: PeriodoAnalise): Promise<AnalyticsClientes> {
    try {
      // Simular dados realistas para demonstração
      const segmentacao = {
        novos: {
          quantidade: 45,
          percentual: 22.5,
          ticketMedio: 85.50,
          origem: [
            { canal: 'Indicação', quantidade: 20 },
            { canal: 'Instagram', quantidade: 15 },
            { canal: 'Google', quantidade: 7 },
            { canal: 'Walk-in', quantidade: 3 }
          ]
        },
        recorrentes: {
          quantidade: 132,
          percentual: 66.0,
          ticketMedio: 95.20,
          frequenciaMedia: 2.3
        },
        vips: {
          quantidade: 18,
          percentual: 9.0,
          ticketMedio: 185.40,
          criterio: 'Gasto > R$ 150/mês'
        },
        emRisco: {
          quantidade: 23,
          percentual: 11.5,
          diasSemVisita: 45,
          valorPerdido: 2875.60
        }
      }

      const comportamento = {
        frequencia: [
          { faixa: '1x/mês', quantidade: 89, percentual: 44.5 },
          { faixa: '2-3x/mês', quantidade: 67, percentual: 33.5 },
          { faixa: '1x/semana+', quantidade: 44, percentual: 22.0 }
        ],
        ticketMedio: [
          { faixa: 'Até R$ 50', quantidade: 34, percentual: 17.0 },
          { faixa: 'R$ 51-100', quantidade: 98, percentual: 49.0 },
          { faixa: 'R$ 101-150', quantidade: 50, percentual: 25.0 },
          { faixa: 'Acima R$ 150', quantidade: 18, percentual: 9.0 }
        ],
        preferencias: [
          { servico: 'Corte Masculino', quantidade: 98, percentual: 49.0 },
          { servico: 'Manicure', quantidade: 78, percentual: 39.0 },
          { servico: 'Coloração', quantidade: 56, percentual: 28.0 },
          { servico: 'Escova', quantidade: 45, percentual: 22.5 }
        ]
      }

      const retencao = {
        taxa30dias: 78.5,
        taxa60dias: 65.2,
        taxa90dias: 52.8,
        churnRate: 15.2,
        ltv: 1250.80
      }

      return {
        periodo,
        segmentacao,
        comportamento,
        retencao
      }

    } catch (error) {
      console.error('Erro ao gerar analytics de clientes:', error)
      throw new Error('Falha ao gerar analytics de clientes')
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  private criarPeriodo(inicio: Date, fim: Date): PeriodoAnalise {
    const totalDias = differenceInDays(fim, inicio) + 1
    return {
      inicio,
      fim,
      descricao: format(inicio, 'dd/MM', { locale: ptBR }) + ' - ' + format(fim, 'dd/MM', { locale: ptBR }),
      totalDias
    }
  }

  private calcularPeriodoAnterior(periodo: PeriodoAnalise, tipo: 'PERIODO_ANTERIOR' | 'ANO_ANTERIOR'): PeriodoAnalise {
    if (tipo === 'ANO_ANTERIOR') {
      return {
        inicio: subDays(periodo.inicio, 365),
        fim: subDays(periodo.fim, 365),
        descricao: 'Ano anterior',
        totalDias: periodo.totalDias
      }
    } else {
      return {
        inicio: subDays(periodo.inicio, periodo.totalDias),
        fim: subDays(periodo.fim, periodo.totalDias),
        descricao: 'Período anterior',
        totalDias: periodo.totalDias
      }
    }
  }

  private async buscarDadosPeriodo(periodo: PeriodoAnalise): Promise<any> {
    // Simular busca de dados
    const diasPeriodo = periodo.totalDias
    const vendas = Math.random() * 50000 + (diasPeriodo * 800)
    const comandas = Math.random() * 200 + (diasPeriodo * 15)
    
    return {
      vendas,
      comandas,
      ticketMedio: comandas > 0 ? vendas / comandas : 0,
      clientes: Math.floor(comandas * 0.8),
      clientesNovos: Math.floor(comandas * 0.15),
      ocupacao: Math.random() * 20 + 70,
      satisfacao: Math.random() * 1 + 4
    }
  }

  private calcularMetricasComparativas(atual: any, anterior: any): ComparativoTemporal['metricas'] {
    const calcularCrescimento = (atual: number, anterior: number) => {
      const crescimento = atual - anterior
      const percentual = anterior > 0 ? (crescimento / anterior) * 100 : 0
      return { atual, anterior, crescimento, percentual }
    }

    const getTendencia = (percentual: number): 'CRESCIMENTO' | 'QUEDA' | 'ESTAVEL' => {
      if (percentual > 5) return 'CRESCIMENTO'
      if (percentual < -5) return 'QUEDA'
      return 'ESTAVEL'
    }

    const vendas = calcularCrescimento(atual.vendas, anterior.vendas)
    const comandas = calcularCrescimento(atual.comandas, anterior.comandas)
    const ticketMedio = calcularCrescimento(atual.ticketMedio, anterior.ticketMedio)
    const clientesUnicos = calcularCrescimento(atual.clientes, anterior.clientes)
    const clientesNovos = calcularCrescimento(atual.clientesNovos, anterior.clientesNovos)
    const clientesRetorno = calcularCrescimento(atual.clientes - atual.clientesNovos, anterior.clientes - anterior.clientesNovos)
    const ocupacao = calcularCrescimento(atual.ocupacao, anterior.ocupacao)
    const satisfacao = calcularCrescimento(atual.satisfacao, anterior.satisfacao)

    return {
      vendas: {
        atual: vendas.atual,
        anterior: vendas.anterior,
        crescimento: vendas.crescimento,
        percentual: vendas.percentual,
        tendencia: getTendencia(vendas.percentual)
      },
      comandas: {
        atual: comandas.atual,
        anterior: comandas.anterior,
        crescimento: comandas.crescimento,
        percentual: comandas.percentual,
        ticketMedio: {
          atual: ticketMedio.atual,
          anterior: ticketMedio.anterior,
          crescimento: ticketMedio.crescimento
        }
      },
      clientes: {
        unicos: {
          atual: clientesUnicos.atual,
          anterior: clientesUnicos.anterior,
          crescimento: clientesUnicos.crescimento
        },
        novos: {
          atual: clientesNovos.atual,
          anterior: clientesNovos.anterior,
          crescimento: clientesNovos.crescimento
        },
        retorno: {
          atual: clientesRetorno.atual,
          anterior: clientesRetorno.anterior,
          crescimento: clientesRetorno.crescimento
        }
      },
      profissionais: {
        ocupacaoMedia: {
          atual: ocupacao.atual,
          anterior: ocupacao.anterior,
          crescimento: ocupacao.crescimento
        },
        satisfacaoMedia: {
          atual: satisfacao.atual,
          anterior: satisfacao.anterior,
          crescimento: satisfacao.crescimento
        }
      }
    }
  }

  private gerarInsightsTendencia(metricas: ComparativoTemporal['metricas']): string[] {
    const insights: string[] = []

    if (metricas.vendas.tendencia === 'CRESCIMENTO') {
      insights.push(`Vendas em crescimento de ${metricas.vendas.percentual.toFixed(1)}% vs período anterior`)
    } else if (metricas.vendas.tendencia === 'QUEDA') {
      insights.push(`Atenção: Queda de ${Math.abs(metricas.vendas.percentual).toFixed(1)}% nas vendas`)
    }

    if (metricas.comandas.ticketMedio.crescimento > 0) {
      insights.push(`Ticket médio aumentou R$ ${metricas.comandas.ticketMedio.crescimento.toFixed(2)}`)
    }

    if (metricas.clientes.novos.crescimento > 0) {
      insights.push(`${metricas.clientes.novos.crescimento} novos clientes adquiridos`)
    }

    if (metricas.profissionais.ocupacaoMedia.crescimento > 5) {
      insights.push('Ocupação da equipe em alta - considere expandir horários')
    }

    return insights
  }

  private gerarRecomendacoes(metricas: ComparativoTemporal['metricas'], insights: string[]): string[] {
    const recomendacoes: string[] = []

    if (metricas.vendas.tendencia === 'QUEDA') {
      recomendacoes.push('Implementar promoções para reverter tendência de queda')
      recomendacoes.push('Analisar satisfação dos clientes e qualidade dos serviços')
    }

    if (metricas.comandas.percentual < metricas.vendas.percentual) {
      recomendacoes.push('Focar em aumentar frequência de visitas dos clientes')
    }

    if (metricas.clientes.novos.crescimento < 0) {
      recomendacoes.push('Intensificar estratégias de aquisição de novos clientes')
    }

    if (metricas.profissionais.ocupacaoMedia.atual > 85) {
      recomendacoes.push('Considerar contratação de novos profissionais')
    }

    return recomendacoes
  }

  private expandirPeriodoParaAnalise(periodo: PeriodoAnalise): PeriodoAnalise {
    // Expandir para pelo menos 30 dias de histórico para análise
    const diasMinimos = 30
    const diasExpansao = Math.max(0, diasMinimos - periodo.totalDias)
    
    return {
      inicio: subDays(periodo.inicio, diasExpansao),
      fim: periodo.fim,
      descricao: periodo.descricao,
      totalDias: periodo.totalDias + diasExpansao
    }
  }

  private async buscarDadosHistoricos(tipo: TendenciaAnalise['tipo'], periodo: PeriodoAnalise): Promise<Array<{ data: string; valor: number; meta?: number }>> {
    // Simular dados históricos para análise de tendência
    const dados: Array<{ data: string; valor: number; meta?: number }> = []
    
    for (let i = 0; i < periodo.totalDias; i++) {
      const data = subDays(periodo.fim, periodo.totalDias - 1 - i)
      let valor = 0
      let meta: number | undefined

      switch (tipo) {
        case 'VENDAS':
          valor = Math.random() * 2000 + 1500 + (Math.sin(i * 0.1) * 300) // Padrão sazonal
          meta = 2000
          break
        case 'COMANDAS':
          valor = Math.random() * 20 + 15 + (Math.sin(i * 0.1) * 5)
          meta = 20
          break
        case 'CLIENTES':
          valor = Math.random() * 15 + 12 + (Math.sin(i * 0.1) * 3)
          break
        case 'OCUPACAO':
          valor = Math.random() * 20 + 70 + (Math.sin(i * 0.1) * 10)
          meta = 80
          break
      }

      dados.push({
        data: format(data, 'yyyy-MM-dd'),
        valor: Math.round(valor * 100) / 100,
        meta
      })
    }

    return dados
  }

  private calcularTendencia(dados: Array<{ data: string; valor: number }>): TendenciaAnalise['tendencia'] {
    if (dados.length < 2) {
      return {
        direcao: 'ESTAVEL',
        intensidade: 0,
        confianca: 0,
        r2: 0
      }
    }

    // Regressão linear simples
    const n = dados.length
    const x = dados.map((_, i) => i)
    const y = dados.map(d => d.valor)
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calcular R²
    const yMean = sumY / n
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(yi - predicted, 2)
    }, 0)
    const r2 = 1 - (residualSumSquares / totalSumSquares)

    // Determinar direção e intensidade
    const intensidade = Math.min(100, Math.abs(slope) * 10)
    let direcao: TendenciaAnalise['tendencia']['direcao']

    if (Math.abs(slope) < 0.1) {
      direcao = 'ESTAVEL'
    } else if (slope > 0) {
      direcao = 'CRESCENTE'
    } else {
      direcao = 'DECRESCENTE'
    }

    // Verificar volatilidade
    const desvio = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0) / n)
    if (desvio > yMean * 0.3) {
      direcao = 'VOLATIL'
    }

    return {
      direcao,
      intensidade: Math.round(intensidade),
      confianca: Math.round(r2 * 100),
      r2: Math.round(r2 * 1000) / 1000
    }
  }

  private gerarPrevisoes(
    dados: Array<{ data: string; valor: number }>, 
    tendencia: TendenciaAnalise['tendencia'], 
    diasPrevisao: number
  ): TendenciaAnalise['previsao'] {
    // Implementação simplificada de previsão baseada na tendência
    const ultimoValor = dados[dados.length - 1]?.valor || 0
    const proximosDias: TendenciaAnalise['previsao']['proximosDias'] = []

    for (let i = 1; i <= diasPrevisao; i++) {
      const data = format(new Date(Date.now() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      
      // Previsão baseada na tendência
      let valor = ultimoValor
      if (tendencia.direcao === 'CRESCENTE') {
        valor += (tendencia.intensidade / 100) * ultimoValor * (i / diasPrevisao)
      } else if (tendencia.direcao === 'DECRESCENTE') {
        valor -= (tendencia.intensidade / 100) * ultimoValor * (i / diasPrevisao)
      }

      // Calcular limites de confiança
      const margem = valor * 0.2 // 20% de margem
      const confianca = Math.max(50, tendencia.confianca - (i * 5)) // Diminui com o tempo

      proximosDias.push({
        data,
        valor: Math.round(valor * 100) / 100,
        limite_inferior: Math.round((valor - margem) * 100) / 100,
        limite_superior: Math.round((valor + margem) * 100) / 100,
        confianca
      })
    }

    return { proximosDias }
  }

  private async identificarPadroes(tipo: TendenciaAnalise['tipo'], periodo: PeriodoAnalise): Promise<TendenciaAnalise['padroes']> {
    // Simular padrões semanais e horários
    const semanal = [
      { diaSemana: 'Segunda', media: 850, variacao: 12 },
      { diaSemana: 'Terça', media: 920, variacao: 8 },
      { diaSemana: 'Quarta', media: 1100, variacao: 15 },
      { diaSemana: 'Quinta', media: 1250, variacao: 10 },
      { diaSemana: 'Sexta', media: 1450, variacao: 18 },
      { diaSemana: 'Sábado', media: 1680, variacao: 22 },
      { diaSemana: 'Domingo', media: 650, variacao: 25 }
    ]

    const horarios = [
      { hora: '08:00', media: 45, variacao: 20 },
      { hora: '09:00', media: 78, variacao: 15 },
      { hora: '10:00', media: 120, variacao: 12 },
      { hora: '14:00', media: 135, variacao: 10 },
      { hora: '15:00', media: 165, variacao: 8 },
      { hora: '16:00', media: 180, variacao: 12 },
      { hora: '17:00', media: 145, variacao: 15 },
      { hora: '18:00', media: 98, variacao: 18 }
    ]

    return { semanal, horarios }
  }

  private async buscarComandasPeriodo(periodo: PeriodoAnalise): Promise<any[]> {
    // Simulação - em produção seria uma chamada real
    return []
  }
}

// Instância singleton
export const analisesTemporaisService = new AnalisesTemporaisService()
export default analisesTemporaisService 