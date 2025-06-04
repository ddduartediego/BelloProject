import { comandasService, agendamentosService, profissionaisService } from '@/services'
import { startOfDay, endOfDay, subDays, format, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================================
// INTERFACES DE ANALYTICS DE PROFISSIONAIS
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
// SERVIÇO ESPECIALIZADO DE ANALYTICS DE PROFISSIONAIS
// ============================================================================

export class ProfissionaisAnalyticsService {

  /**
   * Carrega ranking completo de profissionais com métricas detalhadas
   */
  async carregarRankingProfissionais(): Promise<ProfissionalRanking[]> {
    try {
      // Por ora, vamos usar dados simulados para evitar complexidade da integração
      // Em produção, isso seria substituído pelas chamadas reais dos serviços
      
      const rankingData: ProfissionalRanking[] = [
        {
          id: '1',
          nome: 'Ana Silva',
          posicao: 1,
          avatar: '/avatars/ana.jpg',
          status: 'ATIVO',
          metricas: {
            vendas: {
              hoje: 850,
              semana: 4200,
              mes: 18500,
              crescimentoSemanal: 15,
              crescimentoMensal: 8
            },
            comandas: {
              hoje: 8,
              semana: 42,
              mes: 185,
              ticketMedio: 100,
              crescimentoTicket: 12
            },
            ocupacao: {
              percentual: 85,
              horasAgendadas: 34,
              horasDisponiveis: 40,
              eficiencia: 92
            },
            satisfacao: {
              media: 4.8,
              totalAvaliacoes: 45,
              tendencia: 'SUBINDO'
            }
          },
          comparativos: {
            ontem: {
              vendas: 780,
              comandas: 7,
              crescimentoVendas: 9,
              crescimentoComandas: 14
            },
            semanaPassada: {
              vendas: 3650,
              comandas: 38,
              crescimentoVendas: 15,
              crescimentoComandas: 11
            }
          }
        },
        {
          id: '2',
          nome: 'Carlos Santos',
          posicao: 2,
          avatar: '/avatars/carlos.jpg',
          status: 'ATIVO',
          metricas: {
            vendas: {
              hoje: 720,
              semana: 3800,
              mes: 16800,
              crescimentoSemanal: 8,
              crescimentoMensal: 12
            },
            comandas: {
              hoje: 9,
              semana: 45,
              mes: 195,
              ticketMedio: 84,
              crescimentoTicket: 5
            },
            ocupacao: {
              percentual: 78,
              horasAgendadas: 31,
              horasDisponiveis: 40,
              eficiencia: 88
            },
            satisfacao: {
              media: 4.6,
              totalAvaliacoes: 38,
              tendencia: 'ESTAVEL'
            }
          },
          comparativos: {
            ontem: {
              vendas: 680,
              comandas: 8,
              crescimentoVendas: 6,
              crescimentoComandas: 13
            },
            semanaPassada: {
              vendas: 3520,
              comandas: 42,
              crescimentoVendas: 8,
              crescimentoComandas: 7
            }
          }
        },
        {
          id: '3',
          nome: 'Maria Oliveira',
          posicao: 3,
          avatar: '/avatars/maria.jpg',
          status: 'ATIVO',
          metricas: {
            vendas: {
              hoje: 650,
              semana: 3200,
              mes: 14500,
              crescimentoSemanal: -5,
              crescimentoMensal: 3
            },
            comandas: {
              hoje: 7,
              semana: 35,
              mes: 158,
              ticketMedio: 91,
              crescimentoTicket: -2
            },
            ocupacao: {
              percentual: 72,
              horasAgendadas: 29,
              horasDisponiveis: 40,
              eficiencia: 82
            },
            satisfacao: {
              media: 4.7,
              totalAvaliacoes: 52,
              tendencia: 'DESCENDO'
            }
          },
          comparativos: {
            ontem: {
              vendas: 590,
              comandas: 6,
              crescimentoVendas: 10,
              crescimentoComandas: 17
            },
            semanaPassada: {
              vendas: 3370,
              comandas: 37,
              crescimentoVendas: -5,
              crescimentoComandas: -5
            }
          }
        }
      ]

      return rankingData

    } catch (error) {
      console.error('Erro ao carregar ranking de profissionais:', error)
      throw new Error('Falha ao carregar ranking de profissionais')
    }
  }

  /**
   * Carrega dados detalhados de um profissional específico
   */
  async carregarProfissionalDetalhado(profissionalId: string): Promise<ProfissionalDetalhado> {
    try {
      // Por ora, usar dados simulados para evitar problemas de tipos
      const historico = await this.carregarHistoricoProfissional(profissionalId)
      const tendencias = await this.calcularTendenciasProfissional(profissionalId, historico)
      const insights = await this.gerarInsightsProfissional(profissionalId, historico, tendencias)

      // Encontrar profissional no ranking simulado
      const ranking = await this.carregarRankingProfissionais()
      const profissional = ranking.find(p => p.id === profissionalId)
      
      if (!profissional) {
        throw new Error('Profissional não encontrado')
      }

      const detalhado: ProfissionalDetalhado = {
        id: profissional.id,
        nome: profissional.nome,
        informacoes: {
          especialidades: ['Corte', 'Coloração'], // Simulado
          dataAdmissao: '2023-01-15', // Simulado
          telefone: '(11) 99999-9999',
          email: `${profissional.nome.toLowerCase().replace(' ', '.')}@bellosystem.com`
        },
        historico,
        tendencias,
        insights
      }

      return detalhado

    } catch (error) {
      console.error('Erro ao carregar profissional detalhado:', error)
      throw new Error('Falha ao carregar dados detalhados do profissional')
    }
  }

  /**
   * Carrega métricas comparativas entre profissionais
   */
  async carregarMetricasComparativas(periodo: { inicio: Date; fim: Date }): Promise<MetricasComparativasProfissionais> {
    try {
      const ranking = await this.carregarRankingProfissionais()

      // Calcular estatísticas gerais
      const estatisticas = {
        vendasMedia: ranking.reduce((acc, p) => acc + p.metricas.vendas.semana, 0) / ranking.length,
        comandasMedia: ranking.reduce((acc, p) => acc + p.metricas.comandas.semana, 0) / ranking.length,
        ocupacaoMedia: ranking.reduce((acc, p) => acc + p.metricas.ocupacao.percentual, 0) / ranking.length,
        satisfacaoMedia: ranking.reduce((acc, p) => acc + p.metricas.satisfacao.media, 0) / ranking.length
      }

      // Calcular distribuições
      const distribuicao = {
        faixaVendas: this.calcularDistribuicaoVendas(ranking),
        faixaOcupacao: this.calcularDistribuicaoOcupacao(ranking)
      }

      // Calcular correlações
      const correlacoes = this.calcularCorrelacoes(ranking)

      return {
        periodo: {
          inicio: periodo.inicio.toISOString(),
          fim: periodo.fim.toISOString(),
          descricao: format(periodo.inicio, 'dd/MM/yyyy', { locale: ptBR }) + ' - ' + format(periodo.fim, 'dd/MM/yyyy', { locale: ptBR })
        },
        estatisticas,
        distribuicao,
        correlacoes
      }

    } catch (error) {
      console.error('Erro ao carregar métricas comparativas:', error)
      throw new Error('Falha ao carregar métricas comparativas')
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  private calcularVendasProfissional(comandas: any[], profissionalId: string): number {
    return comandas
      .filter(comanda => comanda.profissionalId === profissionalId)
      .reduce((total, comanda) => total + (comanda.total || 0), 0)
  }

  private calcularComandasProfissional(comandas: any[], profissionalId: string): { quantidade: number; total: number } {
    const comandasProfissional = comandas.filter(comanda => comanda.profissionalId === profissionalId)
    return {
      quantidade: comandasProfissional.length,
      total: comandasProfissional.reduce((total, comanda) => total + (comanda.total || 0), 0)
    }
  }

  private async calcularOcupacaoProfissional(profissionalId: string, data: Date): Promise<{ percentual: number; horasAgendadas: number; horasDisponiveis: number; eficiencia: number }> {
    // Simulação - em produção seria integrado com agendamentosService
    const horasDisponiveis = 8
    const horasAgendadas = Math.floor(Math.random() * 8) + 2 // 2-10 horas
    const percentual = (horasAgendadas / horasDisponiveis) * 100
    const eficiencia = Math.min(percentual, 100)

    return {
      percentual,
      horasAgendadas,
      horasDisponiveis,
      eficiencia
    }
  }

  private async calcularOcupacaoSemanal(profissionalId: string, inicio: Date, fim: Date): Promise<{ percentual: number; horasAgendadas: number; horasDisponiveis: number; eficiencia: number }> {
    // Simulação - em produção seria integrado com agendamentosService
    const diasUteis = 5
    const horasDisponiveis = diasUteis * 8 // 40 horas por semana
    const horasAgendadas = Math.floor(Math.random() * 35) + 20 // 20-55 horas
    const percentual = (horasAgendadas / horasDisponiveis) * 100
    const eficiencia = Math.min(percentual, 100)

    return {
      percentual,
      horasAgendadas,
      horasDisponiveis,
      eficiencia
    }
  }

  private async calcularSatisfacaoProfissional(profissionalId: string): Promise<{ media: number; total: number; tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL' }> {
    // Simulação - em produção viria de avaliações reais
    const avaliacoes = Math.floor(Math.random() * 50) + 10 // 10-60 avaliações
    const media = Math.random() * 2 + 3 // 3.0-5.0 estrelas
    const tendencias = ['SUBINDO', 'DESCENDO', 'ESTAVEL'] as const
    const tendencia = tendencias[Math.floor(Math.random() * 3)]

    return {
      media: Math.round(media * 10) / 10,
      total: avaliacoes,
      tendencia
    }
  }

  private calcularCrescimentoPercentual(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? 100 : 0
    return Math.round(((atual - anterior) / anterior) * 100)
  }

  private async carregarHistoricoProfissional(profissionalId: string): Promise<ProfissionalDetalhado['historico']> {
    // Implementação simplificada - em produção seria mais complexa
    const ultimosSete: Array<{ data: string; vendas: number; comandas: number; horasAgendadas: number; avaliacaoMedia: number }> = []
    
    for (let i = 6; i >= 0; i--) {
      const data = subDays(new Date(), i)
      ultimosSete.push({
        data: format(data, 'yyyy-MM-dd'),
        vendas: Math.floor(Math.random() * 1000) + 200,
        comandas: Math.floor(Math.random() * 10) + 2,
        horasAgendadas: Math.floor(Math.random() * 8) + 2,
        avaliacaoMedia: Math.random() * 2 + 3
      })
    }

    return {
      ultimosSete,
      ultimosTrinta: {
        vendas: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000) + 200),
        comandas: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 2),
        ocupacao: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100))
      }
    }
  }

  private async calcularTendenciasProfissional(profissionalId: string, historico: ProfissionalDetalhado['historico']): Promise<ProfissionalDetalhado['tendencias']> {
    // Análise simples de tendências baseada no histórico
    const vendas = historico.ultimosTrinta.vendas
    const ocupacao = historico.ultimosTrinta.ocupacao
    
    const vendasTendencia = this.analisarTendencia(vendas)
    const ocupacaoTendencia = this.analisarTendencia(ocupacao)
    
    return {
      vendas: {
        direcao: vendasTendencia.direcao,
        percentual: vendasTendencia.percentual,
        predicao: vendasTendencia.predicao
      },
      ocupacao: {
        direcao: ocupacaoTendencia.direcao,
        percentual: ocupacaoTendencia.percentual,
        otimizacao: [
          'Otimizar agenda nos horários de maior demanda',
          'Reduzir intervalos entre atendimentos',
          'Oferecer serviços complementares'
        ]
      },
      satisfacao: {
        direcao: 'ESTAVEL',
        percentual: 0,
        pontosMelhoria: [
          'Melhorar comunicação com clientes',
          'Pontualidade nos atendimentos',
          'Qualidade dos serviços'
        ]
      }
    }
  }

  private analisarTendencia(dados: number[]): { direcao: 'CRESCENDO' | 'DECRESCENDO' | 'ESTAVEL'; percentual: number; predicao: number } {
    const primeira = dados.slice(0, 10).reduce((a, b) => a + b) / 10
    const ultima = dados.slice(-10).reduce((a, b) => a + b) / 10
    
    const percentual = ((ultima - primeira) / primeira) * 100
    const direcao = percentual > 5 ? 'CRESCENDO' : percentual < -5 ? 'DECRESCENDO' : 'ESTAVEL'
    const predicao = ultima * (1 + percentual / 100)
    
    return { direcao, percentual: Math.round(percentual), predicao: Math.round(predicao) }
  }

  private async gerarInsightsProfissional(profissionalId: string, historico: ProfissionalDetalhado['historico'], tendencias: ProfissionalDetalhado['tendencias']): Promise<ProfissionalDetalhado['insights']> {
    return {
      pontosFortes: [
        'Excelente relacionamento com clientes',
        'Alta qualidade técnica',
        'Pontualidade exemplar'
      ],
      areasMelhoria: [
        'Produtividade pode ser otimizada',
        'Diversificar serviços oferecidos'
      ],
      recomendacoes: [
        'Focar em serviços de maior valor agregado',
        'Participar de treinamentos avançados',
        'Melhorar gestão do tempo'
      ],
      alertas: tendencias.vendas.direcao === 'DECRESCENDO' ? 
        ['Queda nas vendas precisa de atenção'] : []
    }
  }

  private calcularDistribuicaoVendas(ranking: ProfissionalRanking[]): Array<{ faixa: string; quantidade: number; percentual: number; profissionais: string[] }> {
    const faixas = [
      { min: 0, max: 500, label: 'R$ 0 - R$ 500' },
      { min: 500, max: 1000, label: 'R$ 500 - R$ 1.000' },
      { min: 1000, max: 2000, label: 'R$ 1.000 - R$ 2.000' },
      { min: 2000, max: Infinity, label: 'Acima de R$ 2.000' }
    ]

    return faixas.map(faixa => {
      const profissionais = ranking.filter(p => 
        p.metricas.vendas.semana >= faixa.min && p.metricas.vendas.semana < faixa.max
      )
      
      return {
        faixa: faixa.label,
        quantidade: profissionais.length,
        percentual: ranking.length > 0 ? (profissionais.length / ranking.length) * 100 : 0,
        profissionais: profissionais.map(p => p.nome)
      }
    })
  }

  private calcularDistribuicaoOcupacao(ranking: ProfissionalRanking[]): Array<{ faixa: string; quantidade: number; percentual: number; profissionais: string[] }> {
    const faixas = [
      { min: 0, max: 50, label: '0% - 50%' },
      { min: 50, max: 70, label: '50% - 70%' },
      { min: 70, max: 90, label: '70% - 90%' },
      { min: 90, max: 100, label: 'Acima de 90%' }
    ]

    return faixas.map(faixa => {
      const profissionais = ranking.filter(p => 
        p.metricas.ocupacao.percentual >= faixa.min && p.metricas.ocupacao.percentual < faixa.max
      )
      
      return {
        faixa: faixa.label,
        quantidade: profissionais.length,
        percentual: ranking.length > 0 ? (profissionais.length / ranking.length) * 100 : 0,
        profissionais: profissionais.map(p => p.nome)
      }
    })
  }

  private calcularCorrelacoes(ranking: ProfissionalRanking[]): { vendasVsOcupacao: number; vendasVsSatisfacao: number; ocupacaoVsSatisfacao: number } {
    if (ranking.length < 2) {
      return { vendasVsOcupacao: 0, vendasVsSatisfacao: 0, ocupacaoVsSatisfacao: 0 }
    }

    const vendas = ranking.map(p => p.metricas.vendas.semana)
    const ocupacao = ranking.map(p => p.metricas.ocupacao.percentual)
    const satisfacao = ranking.map(p => p.metricas.satisfacao.media)

    return {
      vendasVsOcupacao: this.calcularCorrelacao(vendas, ocupacao),
      vendasVsSatisfacao: this.calcularCorrelacao(vendas, satisfacao),
      ocupacaoVsSatisfacao: this.calcularCorrelacao(ocupacao, satisfacao)
    }
  }

  private calcularCorrelacao(x: number[], y: number[]): number {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100
  }
}

// Instância singleton
export const profissionaisAnalyticsService = new ProfissionaisAnalyticsService()
export default profissionaisAnalyticsService 