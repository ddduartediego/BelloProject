import { AlertasInteligentes, Alerta, DashboardConfig } from '@/types/dashboard'
import { caixaService, comandasService } from '@/services'

// ============================================================================
// SERVIÇO DE ALERTAS INTELIGENTES
// ============================================================================

export class AlertasInteligentesService {

  /**
   * Gera alertas críticos baseados no estado atual do sistema
   */
  async gerarAlertasCriticos(): Promise<Alerta[]> {
    const alertas: Alerta[] = []

    try {
      // Verificar status do caixa
      const caixaAtivo = await caixaService.getCaixaAtivo()
      if (!caixaAtivo.data || caixaAtivo.data.status === 'FECHADO') {
        alertas.push({
          id: `caixa-fechado-${Date.now()}`,
          tipo: 'CRITICO',
          categoria: 'CAIXA',
          titulo: 'Caixa Fechado',
          descricao: 'O caixa está fechado. Vendas não podem ser processadas.',
          timestamp: new Date().toISOString(),
          acionavel: true,
          acao: {
            tipo: 'NAVEGACAO',
            destino: '/caixa'
          }
        })
      }

      // Verificar se há vendas hoje
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      
      const estatisticasHoje = await comandasService.getEstatisticas({
        inicio: inicioHoje.toISOString(),
        fim: hoje.toISOString()
      })

      const vendasHoje = estatisticasHoje.data?.faturamentoTotal || 0
      const horaAtual = hoje.getHours()

      // Se for após 14h e não há vendas, é crítico
      if (horaAtual >= 14 && vendasHoje === 0) {
        alertas.push({
          id: `sem-vendas-${Date.now()}`,
          tipo: 'CRITICO',
          categoria: 'VENDAS',
          titulo: 'Nenhuma Venda Hoje',
          descricao: 'Não foram registradas vendas até agora. Verifique se o sistema está funcionando corretamente.',
          valor: vendasHoje,
          timestamp: new Date().toISOString(),
          acionavel: true,
          sugestao: 'Verifique se há comandas abertas pendentes de fechamento',
          acao: {
            tipo: 'NAVEGACAO',
            destino: '/comandas'
          }
        })
      }

    } catch (error) {
      console.error('Erro ao gerar alertas críticos:', error)
    }

    return alertas
  }

  /**
   * Gera alertas de atenção baseados em padrões e tendências
   */
  async gerarAlertasAtencao(config: DashboardConfig): Promise<Alerta[]> {
    const alertas: Alerta[] = []

    try {
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())

      // Comparar vendas hoje vs ontem
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

      // Alerta se vendas caíram mais de 30%
      if (vendaOntemTotal > 0) {
        const variacaoPercentual = ((vendaHojeTotal - vendaOntemTotal) / vendaOntemTotal) * 100
        
        if (variacaoPercentual < -30) {
          alertas.push({
            id: `queda-vendas-${Date.now()}`,
            tipo: 'ATENCAO',
            categoria: 'VENDAS',
            titulo: 'Queda Significativa nas Vendas',
            descricao: `Vendas hoje estão ${Math.abs(variacaoPercentual).toFixed(1)}% abaixo de ontem.`,
            valor: variacaoPercentual,
            comparativo: vendaOntemTotal,
            timestamp: new Date().toISOString(),
            acionavel: true,
            sugestao: 'Verifique se todos os profissionais estão trabalhando e se há comandas abertas',
            acao: {
              tipo: 'NAVEGACAO',
              destino: '/dashboard?tab=profissionais'
            }
          })
        }
      }

      // Verificar meta diária
      if (config.metas.vendaDiaria) {
        const percentualMeta = (vendaHojeTotal / config.metas.vendaDiaria) * 100
        const horaAtual = hoje.getHours()
        const percentualDiaPassado = (horaAtual / 24) * 100

        // Se está muito abaixo da meta para o horário
        if (percentualMeta < (percentualDiaPassado - 20) && horaAtual >= 12) {
          alertas.push({
            id: `meta-baixa-${Date.now()}`,
            tipo: 'ATENCAO',
            categoria: 'VENDAS',
            titulo: 'Meta Diária em Risco',
            descricao: `Apenas ${percentualMeta.toFixed(1)}% da meta atingida. Para o horário atual, deveria estar em ~${percentualDiaPassado.toFixed(0)}%.`,
            valor: percentualMeta,
            comparativo: config.metas.vendaDiaria,
            timestamp: new Date().toISOString(),
            acionavel: true,
            sugestao: 'Considere promoções ou campanhas para alavancar as vendas'
          })
        }
      }

      // Verificar comandas pendentes há muito tempo
      const comandasAbertas = await comandasService.getComandasAbertas()
      if (comandasAbertas.data && comandasAbertas.data.length > 0) {
        const comandasAntigas = comandasAbertas.data.filter(comanda => {
          const abertura = new Date(comanda.data_abertura)
          const horasAbertas = (hoje.getTime() - abertura.getTime()) / (1000 * 60 * 60)
          return horasAbertas > 2 // Mais de 2 horas abertas
        })

        if (comandasAntigas.length > 0) {
          alertas.push({
            id: `comandas-pendentes-${Date.now()}`,
            tipo: 'ATENCAO',
            categoria: 'VENDAS',
            titulo: 'Comandas Abertas há Muito Tempo',
            descricao: `${comandasAntigas.length} comanda(s) aberta(s) há mais de 2 horas.`,
            valor: comandasAntigas.length,
            timestamp: new Date().toISOString(),
            acionavel: true,
            sugestao: 'Verifique se os clientes ainda estão no estabelecimento',
            acao: {
              tipo: 'NAVEGACAO',
              destino: '/comandas?status=ABERTA'
            }
          })
        }
      }

    } catch (error) {
      console.error('Erro ao gerar alertas de atenção:', error)
    }

    return alertas
  }

  /**
   * Gera insights e dicas baseados em padrões de dados
   */
  async gerarInsights(): Promise<Alerta[]> {
    const alertas: Alerta[] = []

    try {
      const hoje = new Date()
      const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Analisar padrões da semana
      const estatisticasAvancadas = await comandasService.getEstatisticasAvancadas({
        inicio: inicioSemana.toISOString(),
        fim: hoje.toISOString()
      })

      // Insight sobre serviços populares
      const servicosPopulares = estatisticasAvancadas.data?.servicosPopulares || []
      if (servicosPopulares.length > 0) {
        const topServico = servicosPopulares[0]
        alertas.push({
          id: `top-servico-${Date.now()}`,
          tipo: 'INSIGHT',
          categoria: 'VENDAS',
          titulo: 'Serviço Mais Popular',
          descricao: `${topServico.servico} é o serviço mais procurado esta semana com ${topServico.quantidade} atendimentos.`,
          valor: topServico.quantidade,
          timestamp: new Date().toISOString(),
          acionavel: false,
          sugestao: 'Considere otimizar a agenda para este serviço ou treinar mais profissionais'
        })
      }

      // Insight sobre profissionais
      const profissionais = estatisticasAvancadas.data?.porProfissional || []
      if (profissionais.length > 1) {
        const topProfissional = profissionais[0]
        const segundoMelhor = profissionais[1]
        const diferenca = topProfissional.vendas - segundoMelhor.vendas

        if (diferenca > segundoMelhor.vendas * 0.5) { // 50% de diferença
          alertas.push({
            id: `destaque-profissional-${Date.now()}`,
            tipo: 'INSIGHT',
            categoria: 'PROFISSIONAIS',
            titulo: 'Profissional Destaque',
            descricao: `${topProfissional.profissional} está se destacando com vendas 50% superiores à média da equipe.`,
            valor: diferenca,
            timestamp: new Date().toISOString(),
            acionavel: false,
            sugestao: 'Considere reconhecer o desempenho ou usar como mentor para outros'
          })
        }
      }

      // Insight sobre horários
      const horaAtual = hoje.getHours()
      if (horaAtual >= 10 && horaAtual <= 12) {
        alertas.push({
          id: `horario-pico-${Date.now()}`,
          tipo: 'INSIGHT',
          categoria: 'SISTEMA',
          titulo: 'Horário de Pico',
          descricao: 'Este é tradicionalmente um horário de movimento. Certifique-se de que todos os profissionais estão disponíveis.',
          timestamp: new Date().toISOString(),
          acionavel: false,
          sugestao: 'Monitore a agenda para otimizar atendimentos'
        })
      }

      // Insight sobre final de semana
      const diaSemana = hoje.getDay()
      if (diaSemana === 5 || diaSemana === 6) { // Sexta ou Sábado
        alertas.push({
          id: `fim-semana-${Date.now()}`,
          tipo: 'INSIGHT',
          categoria: 'VENDAS',
          titulo: 'Oportunidade de Final de Semana',
          descricao: 'Finais de semana geralmente têm maior movimento. Aproveite para oferecer serviços premium.',
          timestamp: new Date().toISOString(),
          acionavel: false,
          sugestao: 'Considere promoções em pacotes ou serviços especiais'
        })
      }

    } catch (error) {
      console.error('Erro ao gerar insights:', error)
    }

    return alertas
  }

  /**
   * Carrega todos os alertas inteligentes
   */
  async carregarAlertas(config: DashboardConfig): Promise<AlertasInteligentes> {
    try {
      const [criticos, atencao, insights] = await Promise.all([
        config.alertas.criticos ? this.gerarAlertasCriticos() : Promise.resolve([]),
        config.alertas.atencao ? this.gerarAlertasAtencao(config) : Promise.resolve([]),
        config.alertas.insights ? this.gerarInsights() : Promise.resolve([])
      ])

      return {
        criticos,
        atencao,
        insights,
        resumo: {
          totalCriticos: criticos.length,
          totalAtencao: atencao.length,
          totalInsights: insights.length,
          ultimaAtualizacao: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
      return {
        criticos: [],
        atencao: [],
        insights: [],
        resumo: {
          totalCriticos: 0,
          totalAtencao: 0,
          totalInsights: 0,
          ultimaAtualizacao: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Gera alertas baseados em horário específico
   */
  getAlertasPorHorario(): Alerta[] {
    const alertas: Alerta[] = []
    const agora = new Date()
    const hora = agora.getHours()

    // Alertas matinais
    if (hora >= 8 && hora <= 9) {
      alertas.push({
        id: `inicio-dia-${Date.now()}`,
        tipo: 'INSIGHT',
        categoria: 'SISTEMA',
        titulo: 'Início do Dia',
        descricao: 'Bom dia! Verifique se o caixa está aberto e se todos os equipamentos estão funcionando.',
        timestamp: agora.toISOString(),
        acionavel: true,
        acao: {
          tipo: 'NAVEGACAO',
          destino: '/caixa'
        }
      })
    }

    // Alertas de almoço
    if (hora >= 12 && hora <= 13) {
      alertas.push({
        id: `horario-almoco-${Date.now()}`,
        tipo: 'INSIGHT',
        categoria: 'SISTEMA',
        titulo: 'Horário de Almoço',
        descricao: 'Organize os intervalos da equipe para manter o atendimento durante o horário de almoço.',
        timestamp: agora.toISOString(),
        acionavel: false,
        sugestao: 'Escalone intervalos para manter sempre profissionais disponíveis'
      })
    }

    return alertas
  }
}

// Instância singleton
export const alertasInteligentesService = new AlertasInteligentesService()
export default alertasInteligentesService 