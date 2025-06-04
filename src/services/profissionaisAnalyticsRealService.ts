import { 
  comandasService, 
  profissionaisService 
} from '@/services'
import { 
  ProfissionaisAnalytics,
  ProfissionalRankingReal,
  FiltroAvancado 
} from '@/types/dashboard'

// ============================================================================
// SERVIÇO ESPECIALIZADO PARA ANALYTICS REAIS DE PROFISSIONAIS
// ============================================================================

interface CacheEntry {
  data: any
  timestamp: number
  expiresIn: number
}

export class ProfissionaisAnalyticsRealService {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

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
   * Gera chave única para cache baseada nos filtros
   */
  private getCacheKey(prefix: string, filtros: FiltroAvancado): string {
    const { inicio, fim, profissionalId } = filtros
    return `${prefix}_${inicio}_${fim}_${profissionalId || 'all'}`
  }

  /**
   * Calcula estatísticas principais dos profissionais
   */
  async calcularEstatisticasPrincipais(filtros: FiltroAvancado): Promise<{
    totalProfissionais: number
    mediaVendasDia: number
    mediaTicket: number
    ocupacaoGeral: number
  }> {
    const cacheKey = this.getCacheKey('stats_principais', filtros)
    
    return this.getCachedOrExecute(cacheKey, async () => {
      const [profissionais, vendas] = await Promise.allSettled([
        profissionaisService.getEstatisticas(),
        comandasService.getEstatisticasAvancadas({
          inicio: filtros.inicio,
          fim: filtros.fim
        })
      ])

      // Dados dos profissionais
      const totalProfissionais = profissionais.status === 'fulfilled' 
        ? (profissionais.value.data?.total || 0)
        : 0

      // Dados de vendas
      const dadosVendas = vendas.status === 'fulfilled' 
        ? vendas.value.data 
        : null

      if (!dadosVendas || totalProfissionais === 0) {
        return {
          totalProfissionais,
          mediaVendasDia: 0,
          mediaTicket: 0,
          ocupacaoGeral: 0
        }
      }

      // Cálculos reais baseados na estrutura correta
      const diasPeriodo = this.calcularDiasPeriodo(filtros.inicio, filtros.fim)
      const totalVendas = dadosVendas.vendas.total || 0
      const totalComandas = dadosVendas.vendas.totalComandas || 0
      
      const mediaVendasDia = diasPeriodo > 0 ? totalVendas / diasPeriodo : 0
      const mediaTicket = totalComandas > 0 ? totalVendas / totalComandas : 0
      
      // Ocupação baseada em comandas (base: 6 comandas/profissional/dia = 100%)
      const comandasPorProfissionalPorDia = totalComandas / (totalProfissionais * diasPeriodo)
      const ocupacaoGeral = Math.min(100, (comandasPorProfissionalPorDia / 6) * 100)

      return {
        totalProfissionais,
        mediaVendasDia: Math.round(mediaVendasDia),
        mediaTicket: Math.round(mediaTicket),
        ocupacaoGeral: Math.round(ocupacaoGeral)
      }
    })
  }

  /**
   * Gera ranking de profissionais baseado em dados reais
   */
  async gerarRankingProfissionais(filtros: FiltroAvancado): Promise<ProfissionalRankingReal[]> {
    const cacheKey = this.getCacheKey('ranking', filtros)
    
    return this.getCachedOrExecute(cacheKey, async () => {
      const [profissionais, vendas] = await Promise.allSettled([
        profissionaisService.getAll(),
        comandasService.getEstatisticasAvancadas({
          inicio: filtros.inicio,
          fim: filtros.fim
        })
      ])

      if (profissionais.status !== 'fulfilled' || vendas.status !== 'fulfilled') {
        return []
      }

      const listaProfissionais = profissionais.value.data?.data || []
      const dadosVendas = vendas.value.data?.porProfissional || []

      // Calcular período anterior para comparativos
      const periodoAnterior = this.calcularPeriodoAnterior(filtros.inicio, filtros.fim)
      const vendasAnterior = await comandasService.getEstatisticasAvancadas({
        inicio: periodoAnterior.inicio,
        fim: periodoAnterior.fim
      })

      const dadosVendasAnterior = vendasAnterior.data?.porProfissional || []

      // Gerar ranking
      const ranking: ProfissionalRankingReal[] = listaProfissionais.map((prof: any) => {
        const nomeCompleto = prof.usuario?.nome_completo || prof.nome || 'Profissional sem nome'
        const vendaAtual = dadosVendas.find(v => v.profissional === nomeCompleto)
        const vendaAnterior = dadosVendasAnterior.find(v => v.profissional === nomeCompleto)

        const vendasPeriodo = vendaAtual?.vendas || 0
        const comandasPeriodo = vendaAtual?.comandas || 0
        const vendasPeriodoAnterior = vendaAnterior?.vendas || 0

        // Cálculos
        const ticketMedio = comandasPeriodo > 0 ? vendasPeriodo / comandasPeriodo : 0
        const crescimento = vendasPeriodoAnterior > 0 
          ? ((vendasPeriodo - vendasPeriodoAnterior) / vendasPeriodoAnterior) * 100 
          : 0

        const diasPeriodo = this.calcularDiasPeriodo(filtros.inicio, filtros.fim)
        const ocupacao = diasPeriodo > 0 
          ? Math.min(100, (comandasPeriodo / (diasPeriodo * 6)) * 100)
          : 0

        return {
          id: prof.id,
          nome: nomeCompleto,
          vendas: {
            periodo: vendasPeriodo,
            crescimento: Math.round(crescimento * 100) / 100,
            ticketMedio: Math.round(ticketMedio)
          },
          performance: {
            comandas: comandasPeriodo,
            ocupacao: Math.round(ocupacao),
            eficiencia: Math.round((ticketMedio / 100) * 100) // Baseado no ticket médio
          }
        }
      })

      // Ordenar por vendas (decrescente)
      return ranking.sort((a, b) => b.vendas.periodo - a.vendas.periodo)
    })
  }

  /**
   * Calcula analytics completo para a aba
   */
  async calcularAnalyticsCompleto(filtros: FiltroAvancado): Promise<ProfissionaisAnalytics> {
    const [estatisticas, ranking] = await Promise.allSettled([
      this.calcularEstatisticasPrincipais(filtros),
      this.gerarRankingProfissionais(filtros)
    ])

    return {
      estatisticas: estatisticas.status === 'fulfilled' ? estatisticas.value : {
        totalProfissionais: 0,
        mediaVendasDia: 0,
        mediaTicket: 0,
        ocupacaoGeral: 0
      },
      ranking: ranking.status === 'fulfilled' ? ranking.value : []
    }
  }

  /**
   * Utilitários para cálculos de período
   */
  private calcularDiasPeriodo(inicio: string, fim: string): number {
    const dataInicio = new Date(inicio)
    const dataFim = new Date(fim)
    const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  private calcularPeriodoAnterior(inicio: string, fim: string): { inicio: string; fim: string } {
    const dataInicio = new Date(inicio)
    const dataFim = new Date(fim)
    const diasDiferenca = this.calcularDiasPeriodo(inicio, fim)

    const novoFim = new Date(dataInicio)
    novoFim.setDate(novoFim.getDate() - 1)
    
    const novoInicio = new Date(novoFim)
    novoInicio.setDate(novoInicio.getDate() - diasDiferenca + 1)

    return {
      inicio: novoInicio.toISOString(),
      fim: novoFim.toISOString()
    }
  }

  /**
   * Limpa cache manualmente (útil para forçar refresh)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Exportar instância singleton
export const profissionaisAnalyticsRealService = new ProfissionaisAnalyticsRealService() 