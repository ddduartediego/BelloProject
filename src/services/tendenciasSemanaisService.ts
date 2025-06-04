import { comandasService } from '@/services'

// ============================================================================
// INTERFACES DE TENDÊNCIAS SEMANAIS
// ============================================================================

export interface TendenciasDiaSemana {
  dia: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'
  numeroSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domingo, 1 = segunda, etc.
  vendas: {
    total: number
    media: number
    percentualDoTotal: number
  }
  comandas: {
    quantidade: number
    ticketMedio: number
  }
  horariosPico: Array<{
    hora: number
    vendas: number
    comandas: number
  }>
  profissionaisMaisAtivos: Array<{
    nome: string
    vendas: number
    comandas: number
  }>
}

export interface AnalyseTendenciasSemanais {
  semanaAtual: TendenciasDiaSemana[]
  semanasAnteriores: {
    semanaPassada: TendenciasDiaSemana[]
    duasSemanasAtras: TendenciasDiaSemana[]
  }
  insights: {
    melhorDiaSemana: TendenciasDiaSemana
    piorDiaSemana: TendenciasDiaSemana
    horarioMaisProdutivo: {
      hora: number
      dia: string
      vendas: number
    }
    crescimentoSemanal: {
      percentual: number
      tipo: 'CRESCIMENTO' | 'DECLINIO' | 'ESTAVEL'
    }
    padroesSazonais: string[]
    oportunidades: string[]
  }
  previsoes: {
    proximosDias: Array<{
      dia: string
      vendasEsperadas: number
      confianca: number // 0-100%
    }>
    fimSemana: {
      sabado: { vendas: number, comandas: number }
      domingo: { vendas: number, comandas: number }
    }
  }
}

// Interfaces auxiliares para tipagem
interface ComandaDetalhada {
  data_abertura: string
  valor_total?: number
  profissional_responsavel?: string
}

// ============================================================================
// SERVIÇO DE TENDÊNCIAS SEMANAIS
// ============================================================================

export class TendenciasSemanaisService {

  /**
   * Nomes dos dias da semana para facilitar mapeamento
   */
  private readonly DIAS_SEMANA = [
    'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
  ] as const

  /**
   * Analisa tendências da semana atual
   */
  async analisarSemanaAtual(): Promise<TendenciasDiaSemana[]> {
    try {
      const hoje = new Date()
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay()) // Domingo da semana atual
      inicioSemana.setHours(0, 0, 0, 0)

      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(inicioSemana.getDate() + 6)
      fimSemana.setHours(23, 59, 59, 999)

      // Buscar dados da semana
      const estatisticasSemana = await comandasService.getEstatisticas({
        inicio: inicioSemana.toISOString(),
        fim: fimSemana.toISOString()
      })

      // Por enquanto, simular dados de comandas baseado em padrões
      // TODO: Quando tivermos método adequado para buscar comandas detalhadas
      const comandas: ComandaDetalhada[] = []
      const totalVendasSemana = estatisticasSemana.data?.faturamentoTotal || 0

      // Analisar cada dia da semana
      const tendenciasPorDia: TendenciasDiaSemana[] = []

      for (let i = 0; i < 7; i++) {
        const diaData = new Date(inicioSemana)
        diaData.setDate(inicioSemana.getDate() + i)
        
        const inicioDia = new Date(diaData)
        inicioDia.setHours(0, 0, 0, 0)
        
        const fimDia = new Date(diaData)
        fimDia.setHours(23, 59, 59, 999)

        // Filtrar comandas do dia
        const comandasDoDia = comandas.filter((comanda: ComandaDetalhada) => {
          const dataComanda = new Date(comanda.data_abertura)
          return dataComanda >= inicioDia && dataComanda <= fimDia
        })

        const vendasDia = comandasDoDia.reduce((acc: number, comanda: ComandaDetalhada) => 
          acc + (comanda.valor_total || 0), 0)
        const quantidadeComandas = comandasDoDia.length
        const ticketMedio = quantidadeComandas > 0 ? vendasDia / quantidadeComandas : 0

        // Analisar horários de pico
        const vendasPorHora = Array.from({ length: 24 }, (_, hora) => {
          const comandasHora = comandasDoDia.filter((comanda: ComandaDetalhada) => {
            const horaComanda = new Date(comanda.data_abertura).getHours()
            return horaComanda === hora
          })
          
          return {
            hora,
            vendas: comandasHora.reduce((acc: number, c: ComandaDetalhada) => 
              acc + (c.valor_total || 0), 0),
            comandas: comandasHora.length
          }
        }).filter(item => item.vendas > 0 || item.comandas > 0)

        // Identificar profissionais mais ativos
        const profissionaisAtivos = comandasDoDia
          .reduce((acc: Record<string, { vendas: number, comandas: number }>, comanda: ComandaDetalhada) => {
            const profissional = comanda.profissional_responsavel || 'N/A'
            if (!acc[profissional]) {
              acc[profissional] = { vendas: 0, comandas: 0 }
            }
            acc[profissional].vendas += comanda.valor_total || 0
            acc[profissional].comandas += 1
            return acc
          }, {})

        const profissionaisList = Object.entries(profissionaisAtivos)
          .map(([nome, dados]) => ({ nome, vendas: dados.vendas, comandas: dados.comandas }))
          .sort((a, b) => b.vendas - a.vendas)
          .slice(0, 3)

        tendenciasPorDia.push({
          dia: this.DIAS_SEMANA[i] as TendenciasDiaSemana['dia'],
          numeroSemana: i as TendenciasDiaSemana['numeroSemana'],
          vendas: {
            total: vendasDia,
            media: vendasDia / (quantidadeComandas || 1),
            percentualDoTotal: totalVendasSemana > 0 ? (vendasDia / totalVendasSemana) * 100 : 0
          },
          comandas: {
            quantidade: quantidadeComandas,
            ticketMedio
          },
          horariosPico: vendasPorHora.sort((a, b) => b.vendas - a.vendas).slice(0, 3),
          profissionaisMaisAtivos: profissionaisList
        })
      }

      return tendenciasPorDia

    } catch (error) {
      console.error('Erro ao analisar semana atual:', error)
      return []
    }
  }

  /**
   * Analisa semanas anteriores para comparação
   */
  async analisarSemanasAnteriores(): Promise<AnalyseTendenciasSemanais['semanasAnteriores']> {
    try {
      // Por enquanto, retornar estruturas vazias
      // TODO: Implementar análise completa das semanas anteriores
      return {
        semanaPassada: [],
        duasSemanasAtras: []
      }

    } catch (error) {
      console.error('Erro ao analisar semanas anteriores:', error)
      return {
        semanaPassada: [],
        duasSemanasAtras: []
      }
    }
  }

  /**
   * Gera insights baseados nas tendências
   */
  async gerarInsights(semanaAtual: TendenciasDiaSemana[]): Promise<AnalyseTendenciasSemanais['insights']> {
    try {
      const defaultInsights = {
        melhorDiaSemana: {} as TendenciasDiaSemana,
        piorDiaSemana: {} as TendenciasDiaSemana,
        horarioMaisProdutivo: { hora: 0, dia: '', vendas: 0 },
        crescimentoSemanal: { percentual: 0, tipo: 'ESTAVEL' as const },
        padroesSazonais: [],
        oportunidades: []
      }

      if (semanaAtual.length === 0) {
        return defaultInsights
      }

      // Identificar melhor e pior dia
      const diasComVendas = semanaAtual.filter(dia => dia.vendas.total > 0)
      if (diasComVendas.length === 0) {
        return defaultInsights
      }

      const melhorDia = diasComVendas.reduce((melhor, dia) => 
        dia.vendas.total > melhor.vendas.total ? dia : melhor
      )
      const piorDia = diasComVendas.reduce((pior, dia) => 
        dia.vendas.total < pior.vendas.total ? dia : pior
      )

      // Encontrar horário mais produtivo
      let horarioMaisProdutivo = { hora: 0, dia: '', vendas: 0 }
      semanaAtual.forEach(dia => {
        dia.horariosPico.forEach(horario => {
          if (horario.vendas > horarioMaisProdutivo.vendas) {
            horarioMaisProdutivo = {
              hora: horario.hora,
              dia: dia.dia,
              vendas: horario.vendas
            }
          }
        })
      })

      // Detectar padrões sazonais
      const padroesSazonais: string[] = []
      const vendasFinaisSemana = semanaAtual
        .filter(dia => dia.numeroSemana === 5 || dia.numeroSemana === 6) // sexta e sábado
        .reduce((acc, dia) => acc + dia.vendas.total, 0)
      
      const vendasDiasSemana = semanaAtual
        .filter(dia => dia.numeroSemana >= 1 && dia.numeroSemana <= 5) // segunda a sexta
        .reduce((acc, dia) => acc + dia.vendas.total, 0)

      if (vendasFinaisSemana > vendasDiasSemana * 0.4) {
        padroesSazonais.push('Fins de semana representam parte significativa das vendas')
      }

      if (melhorDia.numeroSemana === 5 || melhorDia.numeroSemana === 6) {
        padroesSazonais.push('Melhor performance em fins de semana')
      }

      // Identificar oportunidades
      const oportunidades: string[] = []
      const diasBaixaVenda = semanaAtual.filter(dia => 
        dia.vendas.percentualDoTotal < 10 && dia.vendas.total > 0
      )

      if (diasBaixaVenda.length > 0) {
        oportunidades.push(
          `${diasBaixaVenda.map(d => d.dia).join(', ')} com baixo movimento - oportunidade para promoções`
        )
      }

      if (horarioMaisProdutivo.hora >= 18) {
        oportunidades.push('Horário noturno produtivo - considere estender funcionamento')
      }

      if (melhorDia.horariosPico.length > 2) {
        oportunidades.push(`${melhorDia.dia} tem múltiplos picos - otimizar agendamentos`)
      }

      return {
        melhorDiaSemana: melhorDia,
        piorDiaSemana: piorDia,
        horarioMaisProdutivo,
        crescimentoSemanal: {
          percentual: 0, // TODO: Calcular com semana anterior
          tipo: 'ESTAVEL'
        },
        padroesSazonais,
        oportunidades
      }

    } catch (error) {
      console.error('Erro ao gerar insights:', error)
      return {
        melhorDiaSemana: {} as TendenciasDiaSemana,
        piorDiaSemana: {} as TendenciasDiaSemana,
        horarioMaisProdutivo: { hora: 0, dia: '', vendas: 0 },
        crescimentoSemanal: { percentual: 0, tipo: 'ESTAVEL' },
        padroesSazonais: [],
        oportunidades: []
      }
    }
  }

  /**
   * Gera previsões baseadas nas tendências
   */
  async gerarPrevisoes(semanaAtual: TendenciasDiaSemana[]): Promise<AnalyseTendenciasSemanais['previsoes']> {
    try {
      const hoje = new Date()
      const diaAtual = hoje.getDay()

      // Previsões para próximos dias da semana
      const proximosDias = []
      for (let i = 1; i <= 3; i++) { // Próximos 3 dias
        const proximoDia = (diaAtual + i) % 7
        const tendenciaHistorica = semanaAtual[proximoDia]
        
        if (tendenciaHistorica) {
          // Usar média histórica com ajuste baseado na tendência
          const vendasEsperadas = tendenciaHistorica.vendas.media * 1.1 // 10% de otimismo
          const confianca = tendenciaHistorica.comandas.quantidade > 0 ? 75 : 30

          proximosDias.push({
            dia: this.DIAS_SEMANA[proximoDia],
            vendasEsperadas,
            confianca
          })
        }
      }

      // Previsões específicas para fim de semana
      const tendenciaSabado = semanaAtual[6] // sábado
      const tendenciaDomingo = semanaAtual[0] // domingo

      const fimSemana = {
        sabado: {
          vendas: tendenciaSabado?.vendas.media * 1.2 || 0,
          comandas: tendenciaSabado?.comandas.quantidade * 1.1 || 0
        },
        domingo: {
          vendas: tendenciaDomingo?.vendas.media * 0.8 || 0, // Domingo geralmente mais baixo
          comandas: tendenciaDomingo?.comandas.quantidade * 0.9 || 0
        }
      }

      return {
        proximosDias,
        fimSemana
      }

    } catch (error) {
      console.error('Erro ao gerar previsões:', error)
      return {
        proximosDias: [],
        fimSemana: {
          sabado: { vendas: 0, comandas: 0 },
          domingo: { vendas: 0, comandas: 0 }
        }
      }
    }
  }

  /**
   * Carrega análise completa de tendências semanais
   */
  async carregarAnaliseCompleta(): Promise<AnalyseTendenciasSemanais> {
    try {
      const semanaAtual = await this.analisarSemanaAtual()
      const [semanasAnteriores, insights, previsoes] = await Promise.all([
        this.analisarSemanasAnteriores(),
        this.gerarInsights(semanaAtual),
        this.gerarPrevisoes(semanaAtual)
      ])

      return {
        semanaAtual,
        semanasAnteriores,
        insights,
        previsoes
      }

    } catch (error) {
      console.error('Erro ao carregar análise completa de tendências:', error)
      throw error
    }
  }

  /**
   * Identifica padrões de comportamento semanal
   */
  async identificarPadroesComportamento(analise: AnalyseTendenciasSemanais): Promise<{
    regularidade: 'ALTA' | 'MEDIA' | 'BAIXA'
    sazonalidade: 'FORTE' | 'MODERADA' | 'FRACA'
    crescimentoTendencia: 'ASCENDENTE' | 'DESCENDENTE' | 'ESTAVEL'
    recomendacoes: string[]
  }> {
    try {
      const { semanaAtual, insights } = analise

      // Calcular regularidade baseada na variação entre dias
      const vendas = semanaAtual.map(d => d.vendas.total).filter(v => v > 0)
      if (vendas.length === 0) {
        return {
          regularidade: 'BAIXA',
          sazonalidade: 'FRACA',
          crescimentoTendencia: 'ESTAVEL',
          recomendacoes: ['Dados insuficientes para análise de padrões']
        }
      }

      const mediaVendas = vendas.reduce((a, b) => a + b, 0) / vendas.length
      const desvio = vendas.reduce((acc, v) => acc + Math.pow(v - mediaVendas, 2), 0) / vendas.length
      const coeficienteVariacao = Math.sqrt(desvio) / (mediaVendas || 1)

      let regularidade: 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA'
      if (coeficienteVariacao < 0.3) regularidade = 'ALTA'
      else if (coeficienteVariacao > 0.6) regularidade = 'BAIXA'

      // Determinar sazonalidade
      const vendasWeekend = semanaAtual
        .filter(d => d.numeroSemana === 0 || d.numeroSemana === 6)
        .reduce((acc, d) => acc + d.vendas.total, 0)
      
      const vendasWeekdays = semanaAtual
        .filter(d => d.numeroSemana >= 1 && d.numeroSemana <= 5)
        .reduce((acc, d) => acc + d.vendas.total, 0)

      const razaoWeekendWeekdays = vendasWeekend / (vendasWeekdays || 1)
      
      let sazonalidade: 'FORTE' | 'MODERADA' | 'FRACA' = 'MODERADA'
      if (razaoWeekendWeekdays > 0.6) sazonalidade = 'FORTE'
      else if (razaoWeekendWeekdays < 0.3) sazonalidade = 'FRACA'

      // Recomendações baseadas nos padrões
      const recomendacoes: string[] = []

      if (regularidade === 'BAIXA') {
        recomendacoes.push('Implementar estratégias para equilibrar movimento durante a semana')
      }

      if (sazonalidade === 'FORTE') {
        recomendacoes.push('Aproveitar fins de semana com equipe completa e serviços premium')
      }

      if (insights.horarioMaisProdutivo.hora >= 17) {
        recomendacoes.push('Considere horários estendidos para capturar mais do movimento noturno')
      }

      if (insights.oportunidades.length > 0) {
        recomendacoes.push(...insights.oportunidades)
      }

      return {
        regularidade,
        sazonalidade,
        crescimentoTendencia: insights.crescimentoSemanal.tipo === 'CRESCIMENTO' ? 'ASCENDENTE' : 
                            insights.crescimentoSemanal.tipo === 'DECLINIO' ? 'DESCENDENTE' : 'ESTAVEL',
        recomendacoes
      }

    } catch (error) {
      console.error('Erro ao identificar padrões:', error)
      return {
        regularidade: 'MEDIA',
        sazonalidade: 'MODERADA',
        crescimentoTendencia: 'ESTAVEL',
        recomendacoes: []
      }
    }
  }
}

// Instância singleton
export const tendenciasSemanaisService = new TendenciasSemanaisService()
export default tendenciasSemanaisService 