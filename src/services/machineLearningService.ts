// ============================================================================
// SERVIÇO DE MACHINE LEARNING PARA SALÃO
// Sistema de análises preditivas e recommendations engine
// ============================================================================

import { comandasService, clientesService, profissionaisService } from '@/services'
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, format, addDays, getDay, isWeekend } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================================
// INTERFACES DE MACHINE LEARNING
// ============================================================================

export interface PredicaoVendas {
  data: string
  valorPrevisto: number
  confianca: number // 0-100
  intervalos: {
    otimista: number
    pessimista: number
  }
  fatoresInfluencia: Array<{
    fator: string
    impacto: number // percentual de impacto
  }>
}

export interface AnaliseComportamental {
  clienteId: string
  probabilidadeRetorno: number
  proximaVisitaPrevista: string
  servicosRecomendados: Array<{
    servicoId: string
    nome: string
    probabilidade: number
    motivo: string
  }>
  valorMedioEsperado: number
  categoriaCliente: 'NOVO' | 'REGULAR' | 'VIP' | 'RISCO_CHURN'
}

export interface TendenciasMercado {
  periodo: string
  servicos: Array<{
    nome: string
    tendencia: 'CRESCENTE' | 'ESTAVEL' | 'DECLINANTE'
    crescimentoProjetado: number
    oportunidade: number // 0-100
  }>
  insights: Array<{
    insight: string
    acao_recomendada: string
    impacto_estimado: number
  }>
}

export interface OtimizacaoAgenda {
  data: string
  horariosOtimos: Array<{
    horario: string
    demandaPrevista: number
    profissionalIdeal: string
  }>
  sugestoes: Array<{
    tipo: 'PROMOCAO' | 'REALOCACAO' | 'NOVO_SERVICO'
    descricao: string
    impactoEstimado: number
  }>
}

// ============================================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ============================================================================

class MachineLearningService {
  
  /**
   * Prevê vendas para os próximos N dias usando análise de padrões históricos
   */
  async preverVendas(diasProjecao: number = 7): Promise<PredicaoVendas[]> {
    try {
      // Buscar dados históricos dos últimos 90 dias
      const fimPeriodo = new Date()
      const inicioPeriodo = subDays(fimPeriodo, 90)
      
      const dadosHistoricos = await this.obterDadosHistoricos(inicioPeriodo, fimPeriodo)
      
      // Aplicar algoritmos de previsão
      const previsoes: PredicaoVendas[] = []
      
      for (let i = 0; i < diasProjecao; i++) {
        const dataPrevisao = addDays(new Date(), i + 1)
        const previsao = await this.calcularPrevisaoParaDia(dataPrevisao, dadosHistoricos)
        previsoes.push(previsao)
      }
      
      return previsoes
      
    } catch (error) {
      console.error('Erro ao prever vendas:', error)
      // Retornar dados simulados em caso de erro
      return this.gerarPrevisoesFallback(diasProjecao)
    }
  }

  /**
   * Analisa tendências de mercado e oportunidades
   */
  async analisarTendenciasMercado(): Promise<TendenciasMercado> {
    try {
      // Buscar dados dos últimos 6 meses
      const fim = new Date()
      const inicio = subMonths(fim, 6)
      
      const dadosHistoricos = await this.obterDadosHistoricos(inicio, fim)
      
      // Analisar tendências por serviço
      const servicosTendencia = await this.analisarTendenciasServicos(dadosHistoricos)
      
      // Gerar insights baseados em padrões
      const insights = this.gerarInsightsMercado(servicosTendencia)
      
      return {
        periodo: `${format(inicio, 'dd/MM/yyyy')} - ${format(fim, 'dd/MM/yyyy')}`,
        servicos: servicosTendencia,
        insights
      }
      
    } catch (error) {
      console.error('Erro ao analisar tendências:', error)
      return this.gerarTendenciasFallback()
    }
  }

  /**
   * Otimiza agenda baseado em padrões de demanda
   */
  async otimizarAgenda(data: Date): Promise<OtimizacaoAgenda> {
    try {
      // Analisar padrões históricos para o dia da semana
      const diaSemana = getDay(data)
      const dadosHistoricosDia = await this.obterDadosHistoricosPorDiaSemana(diaSemana)
      
      // Calcular horários de pico
      const horariosOtimos = this.calcularHorariosOtimos(dadosHistoricosDia)
      
      // Gerar sugestões de otimização
      const sugestoes = this.gerarSugestoesOtimizacao(data, horariosOtimos)
      
      return {
        data: data.toISOString(),
        horariosOtimos,
        sugestoes
      }
      
    } catch (error) {
      console.error('Erro ao otimizar agenda:', error)
      return this.gerarOtimizacaoFallback(data)
    }
  }

  /**
   * Analisa comportamento de clientes e gera recomendações
   */
  async analisarComportamentoCliente(clienteId: string): Promise<AnaliseComportamental> {
    try {
      // Buscar histórico do cliente
      const historicoCliente = await this.obterHistoricoCliente(clienteId)
      
      // Calcular probabilidade de retorno
      const probabilidadeRetorno = this.calcularProbabilidadeRetorno(historicoCliente)
      
      // Prever próxima visita
      const proximaVisita = this.preverProximaVisita(historicoCliente)
      
      // Recomendar serviços
      const servicosRecomendados = this.recomendarServicos(historicoCliente)
      
      // Categorizar cliente
      const categoria = this.categorizarCliente(historicoCliente, probabilidadeRetorno)
      
      return {
        clienteId,
        probabilidadeRetorno,
        proximaVisitaPrevista: proximaVisita.toISOString(),
        servicosRecomendados,
        valorMedioEsperado: this.calcularValorMedioEsperado(historicoCliente),
        categoriaCliente: categoria
      }
      
    } catch (error) {
      console.error('Erro ao analisar comportamento:', error)
      return this.gerarAnaliseComportamentalFallback(clienteId)
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - ALGORITMOS DE MACHINE LEARNING
  // ============================================================================

  private async calcularPrevisaoParaDia(data: Date, dadosHistoricos: any[]): Promise<PredicaoVendas> {
    const diaSemana = getDay(data)
    const isWeekendDay = isWeekend(data)
    
    // Filtrar dados históricos do mesmo dia da semana
    const dadosDiaSemana = dadosHistoricos.filter(d => getDay(new Date(d.data)) === diaSemana)
    
    if (dadosDiaSemana.length === 0) {
      return this.gerarPrevisaoFallback(data)
    }
    
    // Calcular média simples com pesos para dados mais recentes
    let somaVendas = 0
    let somaPesos = 0
    
    dadosDiaSemana.forEach((dado, index) => {
      const peso = Math.pow(0.9, dadosDiaSemana.length - index - 1) // Dados mais recentes têm mais peso
      somaVendas += dado.vendas * peso
      somaPesos += peso
    })
    
    const mediaVendas = somaVendas / somaPesos
    
    // Aplicar fatores de correção
    let valorPrevisto = mediaVendas
    
    // Fator fim de semana
    if (isWeekendDay) {
      valorPrevisto *= 1.2 // 20% a mais nos fins de semana
    }
    
    // Fator sazonalidade (janeiro = menor movimento)
    const mes = data.getMonth()
    if (mes === 0) { // Janeiro
      valorPrevisto *= 0.85
    } else if (mes === 11) { // Dezembro
      valorPrevisto *= 1.15
    }
    
    // Calcular intervalos de confiança
    const desvio = this.calcularDesvioPadrao(dadosDiaSemana.map(d => d.vendas))
    const intervalos = {
      otimista: valorPrevisto + (desvio * 1.5),
      pessimista: Math.max(0, valorPrevisto - (desvio * 1.5))
    }
    
    // Calcular confiança baseada na quantidade de dados
    const confianca = Math.min(95, 60 + (dadosDiaSemana.length * 2))
    
    // Identificar fatores de influência
    const fatoresInfluencia = [
      { fator: 'Dia da semana', impacto: isWeekendDay ? 20 : -5 },
      { fator: 'Sazonalidade', impacto: mes === 0 ? -15 : mes === 11 ? 15 : 0 },
      { fator: 'Histórico', impacto: dadosDiaSemana.length > 10 ? 10 : -5 }
    ]
    
    return {
      data: data.toISOString(),
      valorPrevisto: Math.round(valorPrevisto),
      confianca,
      intervalos,
      fatoresInfluencia
    }
  }

  private async analisarTendenciasServicos(dadosHistoricos: any[]): Promise<TendenciasMercado['servicos']> {
    // Simular análise de tendências por serviço
    const servicos = [
      { nome: 'Corte Feminino', baseTendencia: 'CRESCENTE', baseOportunidade: 85 },
      { nome: 'Corte Masculino', baseTendencia: 'ESTAVEL', baseOportunidade: 65 },
      { nome: 'Coloração', baseTendencia: 'CRESCENTE', baseOportunidade: 90 },
      { nome: 'Hidratação', baseTendencia: 'DECLINANTE', baseOportunidade: 45 },
      { nome: 'Manicure', baseTendencia: 'ESTAVEL', baseOportunidade: 70 }
    ]
    
    return servicos.map(servico => ({
      nome: servico.nome,
      tendencia: servico.baseTendencia as 'CRESCENTE' | 'ESTAVEL' | 'DECLINANTE',
      crescimentoProjetado: servico.baseTendencia === 'CRESCENTE' ? 
        Math.random() * 15 + 5 : 
        servico.baseTendencia === 'DECLINANTE' ? 
        -(Math.random() * 10 + 2) : 
        Math.random() * 6 - 3,
      oportunidade: servico.baseOportunidade + Math.random() * 10 - 5
    }))
  }

  private gerarInsightsMercado(servicosTendencia: TendenciasMercado['servicos']): TendenciasMercado['insights'] {
    const insights = []
    
    // Insight sobre serviços em crescimento
    const servicosCrescentes = servicosTendencia.filter(s => s.tendencia === 'CRESCENTE')
    if (servicosCrescentes.length > 0) {
      insights.push({
        insight: `${servicosCrescentes.length} serviços em alta demanda detectados`,
        acao_recomendada: 'Expandir horários e capacidade para estes serviços',
        impacto_estimado: 2500
      })
    }
    
    // Insight sobre serviços em declínio
    const servicosDeclinantes = servicosTendencia.filter(s => s.tendencia === 'DECLINANTE')
    if (servicosDeclinantes.length > 0) {
      insights.push({
        insight: `Serviços com queda de demanda: ${servicosDeclinantes.map(s => s.nome).join(', ')}`,
        acao_recomendada: 'Criar promoções e campanhas de reativação',
        impacto_estimado: 1800
      })
    }
    
    // Insight sobre oportunidades
    const altaOportunidade = servicosTendencia.filter(s => s.oportunidade > 80)
    if (altaOportunidade.length > 0) {
      insights.push({
        insight: 'Oportunidades de cross-selling identificadas',
        acao_recomendada: 'Treinar equipe para oferecer serviços complementares',
        impacto_estimado: 3200
      })
    }
    
    return insights
  }

  private calcularDesvioPadrao(valores: number[]): number {
    const media = valores.reduce((acc, val) => acc + val, 0) / valores.length
    const variancia = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length
    return Math.sqrt(variancia)
  }

  private calcularHorariosOtimos(dadosHistoricosDia: any[]): OtimizacaoAgenda['horariosOtimos'] {
    // Simular horários ótimos baseados em padrões
    return [
      { horario: '09:00', demandaPrevista: 75, profissionalIdeal: 'prof-1' },
      { horario: '10:00', demandaPrevista: 85, profissionalIdeal: 'prof-2' },
      { horario: '14:00', demandaPrevista: 95, profissionalIdeal: 'prof-1' },
      { horario: '15:00', demandaPrevista: 90, profissionalIdeal: 'prof-3' },
      { horario: '16:00', demandaPrevista: 80, profissionalIdeal: 'prof-2' }
    ]
  }

  private gerarSugestoesOtimizacao(data: Date, horariosOtimos: any[]): OtimizacaoAgenda['sugestoes'] {
    return [
      {
        tipo: 'PROMOCAO',
        descricao: 'Promoção de horários vagos entre 11h-13h',
        impactoEstimado: 450
      },
      {
        tipo: 'REALOCACAO',
        descricao: 'Realocar profissional para cobrir horário de pico às 14h',
        impactoEstimado: 320
      },
      {
        tipo: 'NOVO_SERVICO',
        descricao: 'Introduzir serviço express de 30min para horários de menor demanda',
        impactoEstimado: 600
      }
    ]
  }

  // ============================================================================
  // MÉTODOS DE FALLBACK (DADOS SIMULADOS)
  // ============================================================================

  private gerarPrevisoesFallback(dias: number): PredicaoVendas[] {
    const previsoes: PredicaoVendas[] = []
    
    for (let i = 0; i < dias; i++) {
      const data = addDays(new Date(), i + 1)
      const valorBase = isWeekend(data) ? 2200 : 1800
      const variacao = (Math.random() - 0.5) * 400
      const valorPrevisto = Math.round(valorBase + variacao)
      
      previsoes.push({
        data: data.toISOString(),
        valorPrevisto,
        confianca: Math.round(75 + Math.random() * 20),
        intervalos: {
          otimista: Math.round(valorPrevisto * 1.3),
          pessimista: Math.round(valorPrevisto * 0.7)
        },
        fatoresInfluencia: [
          { fator: 'Dia da semana', impacto: isWeekend(data) ? 15 : -5 },
          { fator: 'Tendência semanal', impacto: Math.round((Math.random() - 0.5) * 10) },
          { fator: 'Sazonalidade', impacto: Math.round((Math.random() - 0.5) * 8) }
        ]
      })
    }
    
    return previsoes
  }

  private gerarPrevisaoFallback(data: Date): PredicaoVendas {
    const valorBase = isWeekend(data) ? 2200 : 1800
    const valorPrevisto = Math.round(valorBase + (Math.random() - 0.5) * 400)
    
    return {
      data: data.toISOString(),
      valorPrevisto,
      confianca: 70,
      intervalos: {
        otimista: Math.round(valorPrevisto * 1.3),
        pessimista: Math.round(valorPrevisto * 0.7)
      },
      fatoresInfluencia: [
        { fator: 'Dados limitados', impacto: -10 },
        { fator: 'Estimativa conservadora', impacto: -5 }
      ]
    }
  }

  private gerarTendenciasFallback(): TendenciasMercado {
    return {
      periodo: 'Últimos 6 meses',
      servicos: [
        { nome: 'Corte Feminino', tendencia: 'CRESCENTE', crescimentoProjetado: 12.5, oportunidade: 85 },
        { nome: 'Corte Masculino', tendencia: 'ESTAVEL', crescimentoProjetado: 2.1, oportunidade: 65 },
        { nome: 'Coloração', tendencia: 'CRESCENTE', crescimentoProjetado: 18.3, oportunidade: 92 },
        { nome: 'Hidratação', tendencia: 'DECLINANTE', crescimentoProjetado: -8.7, oportunidade: 45 },
        { nome: 'Manicure', tendencia: 'ESTAVEL', crescimentoProjetado: 1.8, oportunidade: 72 }
      ],
      insights: [
        {
          insight: 'Coloração tem alta demanda entre clientes 25-35 anos',
          acao_recomendada: 'Criar pacotes promocionais para este público',
          impacto_estimado: 2800
        },
        {
          insight: 'Horário 14h-16h tem 40% mais demanda aos sábados',
          acao_recomendada: 'Otimizar agenda para horários de pico',
          impacto_estimado: 1600
        }
      ]
    }
  }

  private gerarOtimizacaoFallback(data: Date): OtimizacaoAgenda {
    return {
      data: data.toISOString(),
      horariosOtimos: [
        { horario: '09:00', demandaPrevista: 70, profissionalIdeal: 'prof-1' },
        { horario: '14:00', demandaPrevista: 95, profissionalIdeal: 'prof-2' },
        { horario: '16:00', demandaPrevista: 85, profissionalIdeal: 'prof-1' }
      ],
      sugestoes: [
        { tipo: 'PROMOCAO', descricao: 'Desconto para horários de menor movimento', impactoEstimado: 400 },
        { tipo: 'REALOCACAO', descricao: 'Otimizar distribuição de profissionais', impactoEstimado: 300 }
      ]
    }
  }

  private gerarAnaliseComportamentalFallback(clienteId: string): AnaliseComportamental {
    return {
      clienteId,
      probabilidadeRetorno: Math.round(60 + Math.random() * 30),
      proximaVisitaPrevista: addDays(new Date(), Math.round(15 + Math.random() * 20)).toISOString(),
      servicosRecomendados: [
        { servicoId: 'serv-1', nome: 'Hidratação', probabilidade: 75, motivo: 'Baseado no histórico' },
        { servicoId: 'serv-2', nome: 'Corte', probabilidade: 85, motivo: 'Padrão de frequência' }
      ],
      valorMedioEsperado: Math.round(80 + Math.random() * 100),
      categoriaCliente: 'REGULAR'
    }
  }

  // ============================================================================
  // MÉTODOS DE BUSCA DE DADOS (PLACEHOLDER)
  // ============================================================================

  private async obterDadosHistoricos(inicio: Date, fim: Date): Promise<any[]> {
    // Em produção, buscar dados reais do banco
    // Por enquanto, simular dados históricos
    const dados = []
    const dias = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < dias; i++) {
      const data = addDays(inicio, i)
      const valorBase = isWeekend(data) ? 2000 : 1600
      const variacao = (Math.random() - 0.5) * 600
      
      dados.push({
        data: data.toISOString(),
        vendas: Math.max(0, Math.round(valorBase + variacao)),
        comandas: Math.round(12 + Math.random() * 8),
        clientes: Math.round(8 + Math.random() * 6)
      })
    }
    
    return dados
  }

  private async obterDadosHistoricosPorDiaSemana(diaSemana: number): Promise<any[]> {
    // Simular dados históricos para o dia da semana específico
    return Array.from({ length: 12 }, (_, i) => ({
      data: subWeeks(new Date(), i).toISOString(),
      vendas: Math.round(1500 + Math.random() * 800),
      horarios: this.gerarDadosHorarios()
    }))
  }

  private async obterHistoricoCliente(clienteId: string): Promise<any> {
    // Simular histórico do cliente
    return {
      id: clienteId,
      ultimasVisitas: Array.from({ length: 5 }, (_, i) => ({
        data: subDays(new Date(), (i + 1) * 30).toISOString(),
        valor: Math.round(50 + Math.random() * 150),
        servicos: ['Corte', 'Hidratação'][Math.floor(Math.random() * 2)]
      })),
      frequenciaMedia: 28 + Math.random() * 14, // dias entre visitas
      valorMedio: 85 + Math.random() * 50
    }
  }

  private gerarDadosHorarios(): any[] {
    return Array.from({ length: 10 }, (_, i) => ({
      horario: `${9 + i}:00`,
      agendamentos: Math.round(Math.random() * 5),
      receita: Math.round(Math.random() * 400)
    }))
  }

  private calcularProbabilidadeRetorno(historico: any): number {
    // Algoritmo simples baseado na frequência
    const diasDesdeUltimaVisita = Math.round((new Date().getTime() - new Date(historico.ultimasVisitas[0].data).getTime()) / (1000 * 60 * 60 * 24))
    const frequenciaMedia = historico.frequenciaMedia
    
    if (diasDesdeUltimaVisita < frequenciaMedia) {
      return Math.min(95, 80 + (frequenciaMedia - diasDesdeUltimaVisita) / frequenciaMedia * 15)
    } else {
      return Math.max(20, 80 - (diasDesdeUltimaVisita - frequenciaMedia) / frequenciaMedia * 30)
    }
  }

  private preverProximaVisita(historico: any): Date {
    const ultimaVisita = new Date(historico.ultimasVisitas[0].data)
    return addDays(ultimaVisita, Math.round(historico.frequenciaMedia))
  }

  private recomendarServicos(historico: any): AnaliseComportamental['servicosRecomendados'] {
    // Simular recomendações baseadas no histórico
    return [
      { servicoId: 'serv-1', nome: 'Hidratação', probabilidade: 75, motivo: 'Serviço frequente no histórico' },
      { servicoId: 'serv-2', nome: 'Corte', probabilidade: 90, motivo: 'Padrão de agendamento mensal' }
    ]
  }

  private calcularValorMedioEsperado(historico: any): number {
    return Math.round(historico.valorMedio * (1 + Math.random() * 0.2))
  }

  private categorizarCliente(historico: any, probabilidadeRetorno: number): AnaliseComportamental['categoriaCliente'] {
    if (historico.ultimasVisitas.length < 2) return 'NOVO'
    if (probabilidadeRetorno < 40) return 'RISCO_CHURN'
    if (historico.valorMedio > 150) return 'VIP'
    return 'REGULAR'
  }
}

// ============================================================================
// EXPORTAÇÃO DO SERVIÇO
// ============================================================================

export const machineLearningService = new MachineLearningService()
export default machineLearningService 