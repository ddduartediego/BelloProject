import { clientesService } from '@/services'

// ============================================================================
// INTERFACE DE MÉTRICAS DE CLIENTES
// ============================================================================

export interface MetricasClientesDetalhadas {
  novosHoje: {
    quantidade: number
    nomes: string[]
    primeiroAtendimento: string[]
    comparativoOntem: number
  }
  taxaRetorno: {
    porcentagem: number
    clientesRetornaram: number
    totalClientesBase: number
    comparativoMesPassado: number
  }
  analiseComportamento: {
    clientesFrequentes: Array<{
      nome: string
      visitas: number
      ultimaVisita: string
      valorMedio: number
    }>
    clientesVips: Array<{
      nome: string
      valorTotal: number
      servicosPreferidos: string[]
    }>
    clientesRisco: Array<{
      nome: string
      diasSemVisita: number
      ultimaVisita: string
      valorHistorico: number
    }>
  }
  satisfacao: {
    mediaGeral: number
    avaliacoesRecentes: number
    tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL'
  }
}

// ============================================================================
// SERVIÇO DE ANALYTICS DE CLIENTES
// ============================================================================

export class ClientesAnalyticsService {

  /**
   * Analisa clientes novos hoje comparado com ontem
   */
  async analisarClientesNovosHoje(): Promise<MetricasClientesDetalhadas['novosHoje']> {
    try {
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())

      // Por enquanto, vamos simular dados reais baseados em padrões
      // TODO: Quando tivermos campo data_primeiro_atendimento nos clientes
      
      // Buscar todos os clientes
      const todosClientes = await clientesService.getAll({ page: 1, limit: 1000 })
      const clientes = todosClientes.data?.data || []

      // Simular análise de clientes novos baseado em data de criação
      const clientesHoje = clientes.filter(cliente => {
        const dataCriacao = new Date(cliente.criado_em)
        return dataCriacao >= inicioHoje
      })

      const clientesOntem = clientes.filter(cliente => {
        const dataCriacao = new Date(cliente.criado_em)
        return dataCriacao >= inicioOntem && dataCriacao < inicioHoje
      })

      const quantidadeHoje = clientesHoje.length
      const quantidadeOntem = clientesOntem.length
      const comparativoOntem = quantidadeOntem > 0 
        ? ((quantidadeHoje - quantidadeOntem) / quantidadeOntem) * 100 
        : 0

      return {
        quantidade: quantidadeHoje,
        nomes: clientesHoje.slice(0, 5).map(c => c.nome),
        primeiroAtendimento: clientesHoje.slice(0, 5).map(c => 
          new Date(c.criado_em).toISOString()
        ),
        comparativoOntem: Math.round(comparativoOntem)
      }

    } catch (error) {
      console.error('Erro ao analisar clientes novos:', error)
      return {
        quantidade: 0,
        nomes: [],
        primeiroAtendimento: [],
        comparativoOntem: 0
      }
    }
  }

  /**
   * Calcula taxa de retorno de clientes
   */
  async calcularTaxaRetorno(): Promise<MetricasClientesDetalhadas['taxaRetorno']> {
    try {
      // Análise de retorno nos últimos 30 dias
      const hoje = new Date()
      const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sessentaDiasAtras = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000)

      const todosClientes = await clientesService.getAll({ page: 1, limit: 1000 })
      const clientes = todosClientes.data?.data || []

      // Simular análise de retorno baseado em última visita
      // TODO: Implementar baseado em comandas/agendamentos reais
      
      const clientesAtivos = clientes.filter(cliente => {
        const ultimaVisita = new Date(cliente.atualizado_em || cliente.criado_em)
        return ultimaVisita >= trintaDiasAtras
      })

      const clientesBaseAnterior = clientes.filter(cliente => {
        const primeiraVisita = new Date(cliente.criado_em)
        return primeiraVisita <= sessentaDiasAtras && primeiraVisita >= new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
      })

      const clientesRetornaram = clientesBaseAnterior.filter(cliente => {
        const ultimaVisita = new Date(cliente.atualizado_em || cliente.criado_em)
        return ultimaVisita >= trintaDiasAtras
      }).length

      const taxaRetorno = clientesBaseAnterior.length > 0 
        ? (clientesRetornaram / clientesBaseAnterior.length) * 100 
        : 0

      return {
        porcentagem: Math.round(taxaRetorno),
        clientesRetornaram,
        totalClientesBase: clientesBaseAnterior.length,
        comparativoMesPassado: 0 // TODO: Implementar comparativo real
      }

    } catch (error) {
      console.error('Erro ao calcular taxa de retorno:', error)
      return {
        porcentagem: 0,
        clientesRetornaram: 0,
        totalClientesBase: 0,
        comparativoMesPassado: 0
      }
    }
  }

  /**
   * Analisa comportamento dos clientes
   */
  async analisarComportamento(): Promise<MetricasClientesDetalhadas['analiseComportamento']> {
    try {
      const todosClientes = await clientesService.getAll({ page: 1, limit: 1000 })
      const clientes = todosClientes.data?.data || []

      // Simular análise comportamental
      // TODO: Implementar com dados reais de comandas e agendamentos
      
      const hoje = new Date()
      
      // Clientes frequentes (baseado em data de atualização recente)
      const clientesFrequentes = clientes
        .filter(cliente => {
          const ultimaVisita = new Date(cliente.atualizado_em || cliente.criado_em)
          const diasSemVisita = (hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24)
          return diasSemVisita <= 7 // Visitaram na última semana
        })
        .slice(0, 5)
        .map(cliente => ({
          nome: cliente.nome,
          visitas: Math.floor(Math.random() * 10) + 5, // Simular visitas
          ultimaVisita: cliente.atualizado_em || cliente.criado_em,
          valorMedio: Math.random() * 200 + 50 // Simular valor médio
        }))

      // Clientes VIP (simulado)
      const clientesVips = clientes
        .slice(0, 3)
        .map(cliente => ({
          nome: cliente.nome,
          valorTotal: Math.random() * 1000 + 500,
          servicosPreferidos: ['Corte + Barba', 'Tratamento Capilar']
        }))

      // Clientes em risco (não visitam há mais tempo)
      const clientesRisco = clientes
        .filter(cliente => {
          const ultimaVisita = new Date(cliente.atualizado_em || cliente.criado_em)
          const diasSemVisita = (hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24)
          return diasSemVisita > 30 // Mais de 30 dias sem visita
        })
        .slice(0, 5)
        .map(cliente => {
          const ultimaVisita = new Date(cliente.atualizado_em || cliente.criado_em)
          const diasSemVisita = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            nome: cliente.nome,
            diasSemVisita,
            ultimaVisita: cliente.atualizado_em || cliente.criado_em,
            valorHistorico: Math.random() * 500 + 100
          }
        })

      return {
        clientesFrequentes,
        clientesVips,
        clientesRisco
      }

    } catch (error) {
      console.error('Erro ao analisar comportamento:', error)
      return {
        clientesFrequentes: [],
        clientesVips: [],
        clientesRisco: []
      }
    }
  }

  /**
   * Analisa satisfação dos clientes
   */
  async analisarSatisfacao(): Promise<MetricasClientesDetalhadas['satisfacao']> {
    try {
      // TODO: Implementar com sistema de avaliações real
      // Por enquanto, simular dados realistas
      
      const mediaGeral = 4.2 + (Math.random() * 0.6) // Entre 4.2 e 4.8
      const avaliacoesRecentes = Math.floor(Math.random() * 50) + 20 // Entre 20 e 70 avaliações
      
      let tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL' = 'ESTAVEL'
      const random = Math.random()
      if (random < 0.4) tendencia = 'SUBINDO'
      else if (random < 0.7) tendencia = 'ESTAVEL'
      else tendencia = 'DESCENDO'

      return {
        mediaGeral: Math.round(mediaGeral * 10) / 10,
        avaliacoesRecentes,
        tendencia
      }

    } catch (error) {
      console.error('Erro ao analisar satisfação:', error)
      return {
        mediaGeral: 4.5,
        avaliacoesRecentes: 0,
        tendencia: 'ESTAVEL'
      }
    }
  }

  /**
   * Carrega análise completa de clientes
   */
  async carregarAnaliseCompleta(): Promise<MetricasClientesDetalhadas> {
    try {
      const [novosHoje, taxaRetorno, analiseComportamento, satisfacao] = await Promise.all([
        this.analisarClientesNovosHoje(),
        this.calcularTaxaRetorno(),
        this.analisarComportamento(),
        this.analisarSatisfacao()
      ])

      return {
        novosHoje,
        taxaRetorno,
        analiseComportamento,
        satisfacao
      }

    } catch (error) {
      console.error('Erro ao carregar análise completa de clientes:', error)
      throw error
    }
  }

  /**
   * Gera insights sobre tendências de clientes
   */
  async gerarInsightsClientes(): Promise<{
    crescimento: string
    oportunidades: string[]
    alertas: string[]
  }> {
    try {
      const analise = await this.carregarAnaliseCompleta()
      
      const insights = {
        crescimento: '',
        oportunidades: [] as string[],
        alertas: [] as string[]
      }

      // Análise de crescimento
      if (analise.novosHoje.comparativoOntem > 0) {
        insights.crescimento = `Crescimento de ${analise.novosHoje.comparativoOntem}% em novos clientes vs ontem`
      } else if (analise.novosHoje.comparativoOntem < 0) {
        insights.crescimento = `Queda de ${Math.abs(analise.novosHoje.comparativoOntem)}% em novos clientes vs ontem`
      } else {
        insights.crescimento = 'Número de novos clientes estável'
      }

      // Identificar oportunidades
      if (analise.analiseComportamento.clientesRisco.length > 0) {
        insights.oportunidades.push(
          `${analise.analiseComportamento.clientesRisco.length} clientes podem ser reconquistados com campanhas direcionadas`
        )
      }

      if (analise.taxaRetorno.porcentagem < 60) {
        insights.oportunidades.push(
          'Taxa de retorno baixa - considere programa de fidelidade'
        )
      }

      if (analise.analiseComportamento.clientesVips.length > 0) {
        insights.oportunidades.push(
          `${analise.analiseComportamento.clientesVips.length} clientes VIP podem receber tratamento especial`
        )
      }

      // Identificar alertas
      if (analise.novosHoje.quantidade === 0) {
        insights.alertas.push('Nenhum cliente novo hoje - revisar estratégias de atração')
      }

      if (analise.satisfacao.tendencia === 'DESCENDO') {
        insights.alertas.push('Satisfação dos clientes em queda - investigar causas')
      }

      return insights

    } catch (error) {
      console.error('Erro ao gerar insights de clientes:', error)
      return {
        crescimento: 'Dados indisponíveis',
        oportunidades: [],
        alertas: []
      }
    }
  }
}

// Instância singleton
export const clientesAnalyticsService = new ClientesAnalyticsService()
export default clientesAnalyticsService 