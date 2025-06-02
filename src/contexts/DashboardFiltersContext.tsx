'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { format, subDays, subWeeks, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export type PeriodoPreset = 'hoje' | 'ontem' | 'ultima-semana' | 'este-mes' | 'mes-passado' | 'trimestre' | 'personalizado'
export type TipoMetrica = 'vendas' | 'agendamentos' | 'performance' | 'todas'
export type ModalizacaoComparacao = 'periodo-anterior' | 'mesmo-periodo-ano-anterior' | 'sem-comparacao'

export interface PeriodoCustomizado {
  dataInicio: Date
  dataFim: Date
}

export interface DashboardFilters {
  // Filtros de período
  periodoPreset: PeriodoPreset
  periodoCustomizado: PeriodoCustomizado
  
  // Filtros de entidade
  profissionalSelecionado: string | null // null = todos
  clienteSelecionado: string | null // null = todos
  
  // Filtros de métricas
  tipoMetrica: TipoMetrica
  
  // Configurações de comparação
  exibirComparacao: boolean
  tipoComparacao: ModalizacaoComparacao
  
  // Configurações de visualização
  agruparPorSemana: boolean
  exibirTendencias: boolean
}

export interface PeriodoCalculado {
  inicio: Date
  fim: Date
  label: string
}

export interface PeriodoComparacao {
  inicio: Date
  fim: Date
  label: string
}

interface DashboardFiltersContextData {
  filters: DashboardFilters
  updateFilters: (updates: Partial<DashboardFilters>) => void
  resetFilters: () => void
  
  // Períodos calculados
  periodoAtual: PeriodoCalculado
  periodoComparacao: PeriodoComparacao | null
  
  // Utilitários
  getPeriodoLabel: () => string
  getComparacaoLabel: () => string | null
  
  // Validações
  isValidPeriod: (inicio: Date, fim: Date) => boolean
}

const defaultFilters: DashboardFilters = {
  periodoPreset: 'este-mes',
  periodoCustomizado: {
    dataInicio: startOfMonth(new Date()),
    dataFim: endOfMonth(new Date())
  },
  profissionalSelecionado: null,
  clienteSelecionado: null,
  tipoMetrica: 'todas',
  exibirComparacao: true,
  tipoComparacao: 'periodo-anterior',
  agruparPorSemana: false,
  exibirTendencias: true
}

const DashboardFiltersContext = createContext<DashboardFiltersContextData | undefined>(undefined)

interface DashboardFiltersProviderProps {
  children: ReactNode
}

export function DashboardFiltersProvider({ children }: DashboardFiltersProviderProps) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)

  // Calcular período atual baseado no preset ou customizado
  const calcularPeriodoAtual = useCallback((): PeriodoCalculado => {
    const hoje = new Date()
    
    switch (filters.periodoPreset) {
      case 'hoje':
        return {
          inicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
          fim: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59),
          label: 'Hoje'
        }
      
      case 'ontem':
        const ontem = subDays(hoje, 1)
        return {
          inicio: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate()),
          fim: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59),
          label: 'Ontem'
        }
      
      case 'ultima-semana':
        const inicioSemana = startOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 })
        const fimSemana = endOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 })
        return {
          inicio: inicioSemana,
          fim: fimSemana,
          label: 'Última Semana'
        }
      
      case 'este-mes':
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje),
          label: 'Este Mês'
        }
      
      case 'mes-passado':
        const mesPassado = subMonths(hoje, 1)
        return {
          inicio: startOfMonth(mesPassado),
          fim: endOfMonth(mesPassado),
          label: 'Mês Passado'
        }
      
      case 'trimestre':
        const inicioTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1)
        const fimTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3 + 3, 0, 23, 59, 59)
        return {
          inicio: inicioTrimestre,
          fim: fimTrimestre,
          label: 'Este Trimestre'
        }
      
      case 'personalizado':
        return {
          inicio: filters.periodoCustomizado.dataInicio,
          fim: filters.periodoCustomizado.dataFim,
          label: `${format(filters.periodoCustomizado.dataInicio, 'dd/MM/yyyy')} - ${format(filters.periodoCustomizado.dataFim, 'dd/MM/yyyy')}`
        }
      
      default:
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje),
          label: 'Este Mês'
        }
    }
  }, [filters.periodoPreset, filters.periodoCustomizado])

  // Calcular período de comparação
  const calcularPeriodoComparacao = useCallback((): PeriodoComparacao | null => {
    if (!filters.exibirComparacao) return null
    
    const periodoAtual = calcularPeriodoAtual()
    const diasPeriodo = Math.ceil((periodoAtual.fim.getTime() - periodoAtual.inicio.getTime()) / (1000 * 60 * 60 * 24))
    
    switch (filters.tipoComparacao) {
      case 'periodo-anterior':
        const inicioAnterior = subDays(periodoAtual.inicio, diasPeriodo)
        const fimAnterior = subDays(periodoAtual.fim, diasPeriodo)
        return {
          inicio: inicioAnterior,
          fim: fimAnterior,
          label: 'Período Anterior'
        }
      
      case 'mesmo-periodo-ano-anterior':
        const anoPassado = new Date(periodoAtual.inicio)
        anoPassado.setFullYear(anoPassado.getFullYear() - 1)
        const anoPassadoFim = new Date(periodoAtual.fim)
        anoPassadoFim.setFullYear(anoPassadoFim.getFullYear() - 1)
        return {
          inicio: anoPassado,
          fim: anoPassadoFim,
          label: 'Mesmo Período (Ano Anterior)'
        }
      
      case 'sem-comparacao':
      default:
        return null
    }
  }, [filters.exibirComparacao, filters.tipoComparacao, calcularPeriodoAtual])

  const periodoAtual = calcularPeriodoAtual()
  const periodoComparacao = calcularPeriodoComparacao()

  const updateFilters = useCallback((updates: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const getPeriodoLabel = useCallback(() => {
    return periodoAtual.label
  }, [periodoAtual.label])

  const getComparacaoLabel = useCallback(() => {
    return periodoComparacao?.label || null
  }, [periodoComparacao])

  const isValidPeriod = useCallback((inicio: Date, fim: Date) => {
    return inicio <= fim && fim <= new Date()
  }, [])

  const contextValue: DashboardFiltersContextData = {
    filters,
    updateFilters,
    resetFilters,
    periodoAtual,
    periodoComparacao,
    getPeriodoLabel,
    getComparacaoLabel,
    isValidPeriod
  }

  return (
    <DashboardFiltersContext.Provider value={contextValue}>
      {children}
    </DashboardFiltersContext.Provider>
  )
}

export function useDashboardFilters(): DashboardFiltersContextData {
  const context = useContext(DashboardFiltersContext)
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFiltersProvider')
  }
  return context
} 