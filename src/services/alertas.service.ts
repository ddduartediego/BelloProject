import { BaseService, ServiceResponse } from './base.service'
import comandasService from './comandas.service'
import agendamentosService from './agendamentos.service'
import clientesService from './clientes.service'
import caixaService from './caixa.service'

export interface Alerta {
  id: string
  tipo: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  categoria: 'VENDAS' | 'AGENDAMENTOS' | 'CLIENTES' | 'PROFISSIONAIS' | 'CAIXA' | 'SISTEMA'
  titulo: string
  descricao: string
  sugestao?: string
  dados?: Record<string, any>
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  geradoEm: string
  expiresEm?: string
}

export interface AlertasResumo {
  total: number
  criticos: number
  warnings: number
  infos: number
  alertas: Alerta[]
}

class AlertasService extends BaseService {

  // Gerar todos os alertas do sistema
  async gerarAlertas(): Promise<ServiceResponse<AlertasResumo>> {
    try {
      const alertas: Alerta[] = []
      const agora = new Date()

      // Buscar dados necessários em paralelo
      const [
        estatisticasCaixa,
        agendamentosHoje,
        metricsVendas,
        metricsPerformance,
        clientesRecentes
      ] = await Promise.all([
        this.verificarStatusCaixa(),
        this.verificarAgendamentosHoje(),
        this.verificarPerformanceVendas(),
        this.verificarPerformanceProfissionais(),
        this.verificarClientesInativos()
      ])

      // Adicionar alertas baseados nos resultados
      if (estatisticasCaixa.data) alertas.push(...estatisticasCaixa.data)
      if (agendamentosHoje.data) alertas.push(...agendamentosHoje.data)
      if (metricsVendas.data) alertas.push(...metricsVendas.data)
      if (metricsPerformance.data) alertas.push(...metricsPerformance.data)
      if (clientesRecentes.data) alertas.push(...clientesRecentes.data)

      // Adicionar alertas de sistema
      const alertasSistema = this.gerarAlertasSistema()
      alertas.push(...alertasSistema)

      // Calcular resumo
      const total = alertas.length
      const criticos = alertas.filter(a => a.prioridade === 'CRITICA').length
      const warnings = alertas.filter(a => a.tipo === 'WARNING').length
      const infos = alertas.filter(a => a.tipo === 'INFO').length

      // Ordenar por prioridade e data
      const alertasOrdenados = alertas.sort((a, b) => {
        const prioridadeOrder = { 'CRITICA': 4, 'ALTA': 3, 'MEDIA': 2, 'BAIXA': 1 }
        const prioridadeA = prioridadeOrder[a.prioridade]
        const prioridadeB = prioridadeOrder[b.prioridade]
        
        if (prioridadeA !== prioridadeB) {
          return prioridadeB - prioridadeA
        }
        
        return new Date(b.geradoEm).getTime() - new Date(a.geradoEm).getTime()
      })

      return {
        data: {
          total,
          criticos,
          warnings,
          infos,
          alertas: alertasOrdenados
        },
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Verificar status do caixa
  private async verificarStatusCaixa(): Promise<ServiceResponse<Alerta[]>> {
    try {
      const { data: caixaAtivo, error } = await caixaService.getCaixaAtivo()
      const alertas: Alerta[] = []

      if (error || !caixaAtivo) {
        alertas.push({
          id: 'caixa-fechado',
          tipo: 'ERROR',
          categoria: 'CAIXA',
          titulo: 'Caixa Fechado',
          descricao: 'Não há caixa ativo no momento. Vendas e movimentações estão bloqueadas.',
          sugestao: 'Abra um caixa para começar a receber pagamentos e registrar vendas.',
          prioridade: 'CRITICA',
          geradoEm: new Date().toISOString()
        })
      } else {
        // Verificar se o caixa foi aberto hoje
        const abertura = new Date(caixaAtivo.data_abertura)
        const hoje = new Date()
        const isHoje = abertura.toDateString() === hoje.toDateString()

        if (!isHoje) {
          alertas.push({
            id: 'caixa-antigo',
            tipo: 'WARNING',
            categoria: 'CAIXA',
            titulo: 'Caixa Aberto há Mais de 1 Dia',
            descricao: `Caixa aberto desde ${abertura.toLocaleDateString('pt-BR')}`,
            sugestao: 'Considere fechar o caixa do dia anterior e abrir um novo para hoje.',
            prioridade: 'MEDIA',
            geradoEm: new Date().toISOString()
          })
        } else {
          alertas.push({
            id: 'caixa-ok',
            tipo: 'SUCCESS',
            categoria: 'CAIXA',
            titulo: 'Caixa Ativo',
            descricao: `Caixa aberto hoje com saldo inicial de R$ ${caixaAtivo.saldo_inicial.toFixed(2)}`,
            prioridade: 'BAIXA',
            geradoEm: new Date().toISOString()
          })
        }
      }

      return { data: alertas, error: null }
    } catch (err) {
      return { data: null, error: this.handleError(err as Error) }
    }
  }

  // Verificar agendamentos de hoje
  private async verificarAgendamentosHoje(): Promise<ServiceResponse<Alerta[]>> {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      const { data: agendamentos, error } = await agendamentosService.getByData(hoje)
      const alertas: Alerta[] = []

      if (error) {
        return { data: alertas, error: null }
      }

      const total = agendamentos?.length || 0
      const pendentes = agendamentos?.filter(a => a.status === 'PENDENTE').length || 0
      const confirmados = agendamentos?.filter(a => a.status === 'CONFIRMADO').length || 0

      if (total === 0) {
        alertas.push({
          id: 'sem-agendamentos',
          tipo: 'INFO',
          categoria: 'AGENDAMENTOS',
          titulo: 'Nenhum Agendamento Hoje',
          descricao: 'Não há agendamentos marcados para hoje.',
          sugestao: 'Aproveite para fazer marketing ou organizar o salão.',
          prioridade: 'BAIXA',
          geradoEm: new Date().toISOString()
        })
      } else {
        if (pendentes > 0) {
          alertas.push({
            id: 'agendamentos-pendentes',
            tipo: 'WARNING',
            categoria: 'AGENDAMENTOS',
            titulo: `${pendentes} Agendamento(s) Pendente(s)`,
            descricao: `${pendentes} de ${total} agendamentos ainda não foram confirmados.`,
            sugestao: 'Entre em contato com os clientes para confirmar os horários.',
            dados: { pendentes, total },
            prioridade: pendentes > 3 ? 'ALTA' : 'MEDIA',
            geradoEm: new Date().toISOString()
          })
        }

        if (confirmados > 0) {
          alertas.push({
            id: 'agendamentos-confirmados',
            tipo: 'SUCCESS',
            categoria: 'AGENDAMENTOS',
            titulo: `${confirmados} Agendamento(s) Confirmado(s)`,
            descricao: `Você tem ${confirmados} agendamentos confirmados para hoje.`,
            dados: { confirmados, total },
            prioridade: 'BAIXA',
            geradoEm: new Date().toISOString()
          })
        }
      }

      return { data: alertas, error: null }
    } catch (err) {
      return { data: null, error: this.handleError(err as Error) }
    }
  }

  // Verificar performance de vendas
  private async verificarPerformanceVendas(): Promise<ServiceResponse<Alerta[]>> {
    try {
      const alertas: Alerta[] = []

      // Vendas de hoje vs meta
      const { data: vendasHoje } = await comandasService.getMetricasPeriodo('hoje')
      const { data: vendasMes } = await comandasService.getMetricasPeriodo('mes')

      if (vendasHoje) {
        const metaDiaria = 500 // Meta de R$ 500/dia (configurável)
        const percentualMeta = (vendasHoje.faturamento / metaDiaria) * 100

        if (percentualMeta < 50) {
          alertas.push({
            id: 'vendas-baixas',
            tipo: 'WARNING',
            categoria: 'VENDAS',
            titulo: 'Vendas Abaixo da Meta',
            descricao: `Vendas hoje: R$ ${vendasHoje.faturamento.toFixed(2)} (${percentualMeta.toFixed(1)}% da meta)`,
            sugestao: 'Considere promoções ou entre em contato com clientes para agendamentos.',
            dados: { faturamento: vendasHoje.faturamento, meta: metaDiaria, percentual: percentualMeta },
            prioridade: percentualMeta < 25 ? 'ALTA' : 'MEDIA',
            geradoEm: new Date().toISOString()
          })
        } else if (percentualMeta > 120) {
          alertas.push({
            id: 'vendas-excelentes',
            tipo: 'SUCCESS',
            categoria: 'VENDAS',
            titulo: 'Meta Superada!',
            descricao: `Vendas hoje: R$ ${vendasHoje.faturamento.toFixed(2)} (${percentualMeta.toFixed(1)}% da meta)`,
            dados: { faturamento: vendasHoje.faturamento, meta: metaDiaria, percentual: percentualMeta },
            prioridade: 'BAIXA',
            geradoEm: new Date().toISOString()
          })
        }
      }

      // Crescimento mensal
      if (vendasMes && vendasMes.crescimento < -10) {
        alertas.push({
          id: 'queda-vendas',
          tipo: 'ERROR',
          categoria: 'VENDAS',
          titulo: 'Queda Significativa nas Vendas',
          descricao: `Vendas do mês caíram ${Math.abs(vendasMes.crescimento).toFixed(1)}% vs mês anterior`,
          sugestao: 'Analise os motivos da queda e considere estratégias de recuperação.',
          dados: { crescimento: vendasMes.crescimento },
          prioridade: 'ALTA',
          geradoEm: new Date().toISOString()
        })
      }

      return { data: alertas, error: null }
    } catch (err) {
      return { data: null, error: this.handleError(err as Error) }
    }
  }

  // Verificar performance dos profissionais
  private async verificarPerformanceProfissionais(): Promise<ServiceResponse<Alerta[]>> {
    try {
      const alertas: Alerta[] = []
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

      const { data: ocupacao } = await agendamentosService.getOcupacaoProfissionais({
        inicio: inicioMes.toISOString(),
        fim: fimMes.toISOString()
      })

      if (ocupacao) {
        // Verificar profissionais com baixa ocupação
        const profissionaisOciosos = ocupacao.profissionais.filter(p => p.ocupacao < 30)
        
        if (profissionaisOciosos.length > 0) {
          alertas.push({
            id: 'profissionais-ociosos',
            tipo: 'WARNING',
            categoria: 'PROFISSIONAIS',
            titulo: `${profissionaisOciosos.length} Profissional(is) com Baixa Ocupação`,
            descricao: `Profissionais com menos de 30% de ocupação este mês`,
            sugestao: 'Redistribua agendamentos ou ofereça treinamentos/promoções.',
            dados: { 
              profissionais: profissionaisOciosos.map(p => ({ 
                nome: p.nome, 
                ocupacao: p.ocupacao 
              })) 
            },
            prioridade: 'MEDIA',
            geradoEm: new Date().toISOString()
          })
        }

        // Verificar se ocupação média está muito baixa
        if (ocupacao.ocupacaoMedia < 40) {
          alertas.push({
            id: 'ocupacao-baixa-geral',
            tipo: 'WARNING',
            categoria: 'PROFISSIONAIS',
            titulo: 'Ocupação Geral Baixa',
            descricao: `Ocupação média dos profissionais: ${ocupacao.ocupacaoMedia.toFixed(1)}%`,
            sugestao: 'Considere campanhas de marketing para aumentar o fluxo de clientes.',
            dados: { ocupacaoMedia: ocupacao.ocupacaoMedia },
            prioridade: ocupacao.ocupacaoMedia < 25 ? 'ALTA' : 'MEDIA',
            geradoEm: new Date().toISOString()
          })
        }
      }

      return { data: alertas, error: null }
    } catch (err) {
      return { data: null, error: this.handleError(err as Error) }
    }
  }

  // Verificar clientes inativos
  private async verificarClientesInativos(): Promise<ServiceResponse<Alerta[]>> {
    try {
      const alertas: Alerta[] = []
      
      // Buscar clientes que não retornaram nos últimos 60 dias
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - 60)

      const { data: agendamentosRecentes } = await agendamentosService.getAll(
        { page: 1, limit: 1000 },
        { 
          dataInicio: dataLimite.toISOString(),
          dataFim: new Date().toISOString()
        }
      )

      if (agendamentosRecentes?.data) {
        // Contar clientes únicos com agendamentos recentes
        const clientesAtivos = new Set(
          agendamentosRecentes.data
            .filter(a => a.id_cliente)
            .map(a => a.id_cliente)
        ).size

        const { data: estatisticasClientes } = await clientesService.getEstatisticas()
        
        if (estatisticasClientes) {
          const totalClientes = estatisticasClientes.total
          const clientesInativos = totalClientes - clientesAtivos
          const percentualInativos = totalClientes > 0 ? (clientesInativos / totalClientes) * 100 : 0

          if (percentualInativos > 50) {
            alertas.push({
              id: 'clientes-inativos',
              tipo: 'WARNING',
              categoria: 'CLIENTES',
              titulo: 'Alto Índice de Clientes Inativos',
              descricao: `${clientesInativos} clientes (${percentualInativos.toFixed(1)}%) sem agendamentos nos últimos 60 dias`,
              sugestao: 'Crie campanhas de reativação ou promoções especiais para ex-clientes.',
              dados: { 
                clientesInativos, 
                totalClientes, 
                percentual: percentualInativos 
              },
              prioridade: percentualInativos > 70 ? 'ALTA' : 'MEDIA',
              geradoEm: new Date().toISOString()
            })
          }
        }
      }

      return { data: alertas, error: null }
    } catch (err) {
      return { data: null, error: this.handleError(err as Error) }
    }
  }

  // Gerar alertas de sistema
  private gerarAlertasSistema(): Alerta[] {
    const alertas: Alerta[] = []

    // Alerta de sistema funcionando
    alertas.push({
      id: 'sistema-ok',
      tipo: 'SUCCESS',
      categoria: 'SISTEMA',
      titulo: 'Sistema Funcionando',
      descricao: 'Dashboard v2.0 com métricas em tempo real e alertas inteligentes',
      prioridade: 'BAIXA',
      geradoEm: new Date().toISOString()
    })

    return alertas
  }

  // Buscar aniversariantes da semana
  async getAniversariantes(): Promise<ServiceResponse<Alerta[]>> {
    try {
      const alertas: Alerta[] = []
      
      // TODO: Implementar busca de aniversariantes quando campo data_nascimento estiver disponível
      // Por enquanto, adicionar alerta informativo
      alertas.push({
        id: 'aniversariantes-info',
        tipo: 'INFO',
        categoria: 'CLIENTES',
        titulo: 'Funcionalidade em Desenvolvimento',
        descricao: 'Alertas de aniversariantes serão implementados quando o campo data_nascimento estiver disponível',
        prioridade: 'BAIXA',
        geradoEm: new Date().toISOString()
      })

      return { data: alertas, error: null }
    } catch (err) {
      return { data: null, error: this.handleError(err as Error) }
    }
  }
}

const alertasService = new AlertasService()
export default alertasService 