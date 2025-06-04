import { 
  comandasService, 
  caixaService,
  clientesService,
  profissionaisService 
} from '@/services'
import { 
  MetricasExecutivas,
  FiltroAvancado 
} from '@/types/dashboard'

// ============================================================================
// SERVIÇO ESPECIALIZADO PARA ESTATÍSTICAS PRINCIPAIS
// ============================================================================

interface CacheEntry {
  data: any
  timestamp: number
  expiresIn: number
}

interface FiltroEstatisticas {
  periodo?: FiltroAvancado
  incluirComparativos?: boolean
  metaDiaria?: number
}

export class EstatisticasPrincipaisService {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutos para métricas executivas

  /**
   * Limpa cache expirado automaticamente
   */
  private cleanExpiredCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.expiresIn) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Obtém dados do cache ou executa função
   */
  private async getCachedOrExecute<T>(
    key: string, 
    executor: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    this.cleanExpiredCache()
    
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.timestamp + cached.expiresIn) {
      return cached.data as T
    }

    const data = await executor()
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: customTTL || this.CACHE_DURATION
    })

    return data
  }

  /**
   * Gera chave única para cache
   */
  private getCacheKey(prefix: string, filtros?: FiltroEstatisticas): string {
    const periodoKey = filtros?.periodo 
      ? `${filtros.periodo.inicio}_${filtros.periodo.fim}`
      : 'default'
    return `${prefix}_${periodoKey}_${filtros?.metaDiaria || 'no-meta'}`
  }

  /**
   * Calcula métricas de caixa em tempo real
   */
  async calcularMetricasCaixa(): Promise<MetricasExecutivas['caixa']> {
    const cacheKey = this.getCacheKey('caixa')
    
    return this.getCachedOrExecute(cacheKey, async () => {
      try {
        const caixaAtivo = await caixaService.getCaixaAtivo()
        
        if (!caixaAtivo.data) {
          return {
            status: 'FECHADO' as const,
            saldoAtual: 0,
            tempoAberto: 0,
            comparativoOntem: 0,
            ultimaMovimentacao: new Date().toISOString()
          }
        }

        // Buscar caixa completo com movimentações
        const caixaCompleto = await caixaService.getById(caixaAtivo.data.id)
        
        if (!caixaCompleto.data) {
          throw new Error('Erro ao buscar detalhes do caixa')
        }

        // Calcular saldo atual baseado nas propriedades reais
        const saldoInicial = caixaCompleto.data.saldo_inicial || 0
        const totalEntradas = caixaCompleto.data.total_entradas || 0
        const totalSaidas = caixaCompleto.data.total_saidas || 0
        const saldoAtual = saldoInicial + totalEntradas - totalSaidas

        // Calcular tempo aberto
        const dataAbertura = new Date(caixaCompleto.data.data_abertura)
        const agora = new Date()
        const tempoAbertoMs = agora.getTime() - dataAbertura.getTime()
        const tempoAberto = Math.floor(tempoAbertoMs / (1000 * 60)) // em minutos

        // Comparativo com ontem (movimento de caixa)
        const ontem = new Date()
        ontem.setDate(ontem.getDate() - 1)
        const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
        const fimOntem = new Date(inicioOntem)
        fimOntem.setDate(fimOntem.getDate() + 1)

        const vendasOntem = await comandasService.getEstatisticas({
          inicio: inicioOntem.toISOString(),
          fim: fimOntem.toISOString()
        })

        const movimentoOntem = vendasOntem.data?.faturamentoTotal || 0
        const movimentoHoje = totalEntradas // Entradas do caixa representam o movimento
        
        const comparativoOntem = movimentoOntem > 0 
          ? ((movimentoHoje - movimentoOntem) / movimentoOntem) * 100
          : 0

        // Última movimentação baseada nos dados das movimentações
        const ultimaMovimentacao = caixaCompleto.data.movimentacoes && caixaCompleto.data.movimentacoes.length > 0
          ? caixaCompleto.data.movimentacoes[caixaCompleto.data.movimentacoes.length - 1].data_movimentacao
          : caixaCompleto.data.data_abertura

        return {
          status: 'ABERTO' as const,
          saldoAtual: Math.round(saldoAtual),
          tempoAberto,
          comparativoOntem: Math.round(comparativoOntem * 100) / 100,
          ultimaMovimentacao
        }

      } catch (error) {
        console.error('Erro ao calcular métricas de caixa:', error)
        return {
          status: 'FECHADO' as const,
          saldoAtual: 0,
          tempoAberto: 0,
          comparativoOntem: 0,
          ultimaMovimentacao: new Date().toISOString()
        }
      }
    })
  }

  /**
   * Calcula métricas de vendas configuráveis
   */
  async calcularMetricasVendas(filtros?: FiltroEstatisticas): Promise<MetricasExecutivas['vendas']> {
    const cacheKey = this.getCacheKey('vendas', filtros)
    
    return this.getCachedOrExecute(cacheKey, async () => {
      try {
        // Período padrão: hoje
        const hoje = new Date()
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        
        const periodo = filtros?.periodo || {
          inicio: inicioHoje.toISOString(),
          fim: hoje.toISOString()
        }

        const [vendasPeriodo, vendasOntem] = await Promise.allSettled([
          comandasService.getEstatisticas({
            inicio: periodo.inicio,
            fim: periodo.fim
          }),
          // Comparativo com período anterior (mesmo tamanho)
          (() => {
            const inicioPeriodo = new Date(periodo.inicio)
            const fimPeriodo = new Date(periodo.fim)
            const diasPeriodo = Math.ceil((fimPeriodo.getTime() - inicioPeriodo.getTime()) / (1000 * 60 * 60 * 24))
            
            const fimAnterior = new Date(inicioPeriodo)
            fimAnterior.setDate(fimAnterior.getDate() - 1)
            const inicioAnterior = new Date(fimAnterior)
            inicioAnterior.setDate(inicioAnterior.getDate() - diasPeriodo + 1)

            return comandasService.getEstatisticas({
              inicio: inicioAnterior.toISOString(),
              fim: fimAnterior.toISOString()
            })
          })()
        ])

        const dadosVendas = vendasPeriodo.status === 'fulfilled' ? vendasPeriodo.value.data : null
        const dadosAnteriores = vendasOntem.status === 'fulfilled' ? vendasOntem.value.data : null

        const totalDia = dadosVendas?.faturamentoTotal || 0
        const totalAnterior = dadosAnteriores?.faturamentoTotal || 0

        // Calcular percentual vs período anterior
        const percentualVsOntem = totalAnterior > 0 
          ? ((totalDia - totalAnterior) / totalAnterior) * 100
          : 0

        // Calcular percentual da meta
        const metaDiaria = filtros?.metaDiaria || 0
        const percentualMeta = metaDiaria > 0 ? (totalDia / metaDiaria) * 100 : 0

        // Última venda - usar timestamp atual como fallback
        const ultimaVenda = new Date().toISOString()

        return {
          totalDia: Math.round(totalDia),
          percentualVsOntem: Math.round(percentualVsOntem * 100) / 100,
          percentualMeta: Math.round(percentualMeta * 100) / 100,
          ultimaVenda,
          metaDiaria
        }

      } catch (error) {
        console.error('Erro ao calcular métricas de vendas:', error)
        return {
          totalDia: 0,
          percentualVsOntem: 0,
          percentualMeta: 0,
          ultimaVenda: new Date().toISOString(),
          metaDiaria: filtros?.metaDiaria
        }
      }
    })
  }

  /**
   * Calcula métricas de comandas configuráveis
   */
  async calcularMetricasComandas(filtros?: FiltroEstatisticas): Promise<MetricasExecutivas['comandas']> {
    const cacheKey = this.getCacheKey('comandas', filtros)
    
    return this.getCachedOrExecute(cacheKey, async () => {
      try {
        // Período padrão: hoje
        const hoje = new Date()
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        
        const periodo = filtros?.periodo || {
          inicio: inicioHoje.toISOString(),
          fim: hoje.toISOString()
        }

        const [comandasPeriodo, comandasOntem] = await Promise.allSettled([
          comandasService.getEstatisticas({
            inicio: periodo.inicio,
            fim: periodo.fim
          }),
          // Período anterior
          (() => {
            const inicioPeriodo = new Date(periodo.inicio)
            const fimPeriodo = new Date(periodo.fim)
            const diasPeriodo = Math.ceil((fimPeriodo.getTime() - inicioPeriodo.getTime()) / (1000 * 60 * 60 * 24))
            
            const fimAnterior = new Date(inicioPeriodo)
            fimAnterior.setDate(fimAnterior.getDate() - 1)
            const inicioAnterior = new Date(fimAnterior)
            inicioAnterior.setDate(inicioAnterior.getDate() - diasPeriodo + 1)

            return comandasService.getEstatisticas({
              inicio: inicioAnterior.toISOString(),
              fim: fimAnterior.toISOString()
            })
          })()
        ])

        const dadosComandas = comandasPeriodo.status === 'fulfilled' ? comandasPeriodo.value.data : null
        const dadosAnteriores = comandasOntem.status === 'fulfilled' ? comandasOntem.value.data : null

        const quantidadeHoje = dadosComandas?.totalComandas || 0
        const quantidadeAnterior = dadosAnteriores?.totalComandas || 0
        const totalVendas = dadosComandas?.faturamentoTotal || 0

        // Ticket médio
        const ticketMedio = quantidadeHoje > 0 ? totalVendas / quantidadeHoje : 0

        // Comparativo (diferença absoluta)
        const comparativoOntem = quantidadeHoje - quantidadeAnterior

        // Última comanda - usar timestamp atual como fallback
        const ultimaComanda = new Date().toISOString()

        return {
          quantidadeHoje,
          ticketMedio: Math.round(ticketMedio),
          comparativoOntem,
          ultimaComanda
        }

      } catch (error) {
        console.error('Erro ao calcular métricas de comandas:', error)
        return {
          quantidadeHoje: 0,
          ticketMedio: 0,
          comparativoOntem: 0,
          ultimaComanda: new Date().toISOString()
        }
      }
    })
  }

  /**
   * Calcula métricas completas executivas
   */
  async calcularMetricasExecutivas(filtros?: FiltroEstatisticas): Promise<MetricasExecutivas> {
    try {
      const [caixa, vendas, comandas] = await Promise.allSettled([
        this.calcularMetricasCaixa(),
        this.calcularMetricasVendas(filtros),
        this.calcularMetricasComandas(filtros)
      ])

      // Usar métricas do serviço existente para as outras seções
      const [profissionaisAtivos, semanaAtual, clientes] = await Promise.allSettled([
        this.calcularMetricasProfissionaisAtivos(),
        this.calcularMetricasSemana(),
        this.calcularMetricasClientes()
      ])

      return {
        caixa: caixa.status === 'fulfilled' ? caixa.value : {
          status: 'FECHADO' as const,
          saldoAtual: 0,
          tempoAberto: 0,
          comparativoOntem: 0,
          ultimaMovimentacao: new Date().toISOString()
        },
        vendas: vendas.status === 'fulfilled' ? vendas.value : {
          totalDia: 0,
          percentualVsOntem: 0,
          percentualMeta: 0,
          ultimaVenda: new Date().toISOString()
        },
        comandas: comandas.status === 'fulfilled' ? comandas.value : {
          quantidadeHoje: 0,
          ticketMedio: 0,
          comparativoOntem: 0,
          ultimaComanda: new Date().toISOString()
        },
        profissionaisAtivos: profissionaisAtivos.status === 'fulfilled' ? profissionaisAtivos.value : {
          totalAtivos: 0,
          topProfissional: { nome: 'N/A', vendas: 0 },
          ocupacaoMedia: 0,
          avaliacaoMedia: 4.5
        },
        semanaAtual: semanaAtual.status === 'fulfilled' ? semanaAtual.value : {
          vendas: 0,
          percentualVsSemanaPassada: 0
        },
        clientes: clientes.status === 'fulfilled' ? clientes.value : {
          novosHoje: 0,
          taxaRetorno: 0,
          totalAtivos: 0,
          satisfacaoMedia: 4.5
        }
      }

    } catch (error) {
      console.error('Erro ao calcular métricas executivas:', error)
      throw error
    }
  }

  /**
   * Métricas auxiliares (manter compatibilidade)
   */
  private async calcularMetricasProfissionaisAtivos() {
    // Reutilizar do serviço existente
    const { dashboardExecutivoService } = await import('./dashboardExecutivoService')
    return dashboardExecutivoService.calcularMetricasProfissionais()
  }

  private async calcularMetricasSemana() {
    const { dashboardExecutivoService } = await import('./dashboardExecutivoService')
    return dashboardExecutivoService.calcularMetricasSemana()
  }

  private async calcularMetricasClientes() {
    const { dashboardExecutivoService } = await import('./dashboardExecutivoService')
    return dashboardExecutivoService.calcularMetricasClientes()
  }

  /**
   * Limpa cache manualmente
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Exportar instância singleton
export const estatisticasPrincipaisService = new EstatisticasPrincipaisService() 