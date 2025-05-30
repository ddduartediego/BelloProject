import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  AgendamentoComDetalhes, 
  StatusAgendamento
} from '@/types/database'
import {
  CreateAgendamentoData,
  UpdateAgendamentoData
} from '@/services/agendamentos.service'

// Tipos do frontend (Fase 5)
export interface AgendamentoCompleto {
  id: string
  title: string
  cliente: {
    id?: string
    nome: string
    telefone?: string
    email?: string
  }
  profissional: {
    id: string
    nome: string
    especialidades?: string[]
  }
  servico: {
    id?: string
    nome: string
    preco?: number
    duracao?: number
  }
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido'
  valor?: number
  observacoes?: string
}

export interface AgendamentoFormData {
  id_cliente: string
  id_servico: string
  id_profissional: string
  data_agendamento: string
  hora_inicio: string
  observacoes?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  cliente: string
  profissional: string
  servico: string
}

// Mapeamento de status
const STATUS_FRONTEND_TO_BACKEND: Record<string, StatusAgendamento> = {
  'agendado': 'PENDENTE',
  'confirmado': 'CONFIRMADO',
  'cancelado': 'CANCELADO',
  'concluido': 'CONCLUIDO'
}

const STATUS_BACKEND_TO_FRONTEND: Record<StatusAgendamento, string> = {
  'PENDENTE': 'agendado',
  'CONFIRMADO': 'confirmado',
  'CANCELADO': 'cancelado',
  'CONCLUIDO': 'concluido'
}

export class AgendamentoAdapter {
  /**
   * Converte dados do formulário frontend para formato do backend
   */
  static toBackend(frontendData: AgendamentoFormData, servicoDuracao: number = 60): CreateAgendamentoData {
    const dataHoraInicio = new Date(`${frontendData.data_agendamento}T${frontendData.hora_inicio}:00`)
    const dataHoraFim = new Date(dataHoraInicio.getTime() + servicoDuracao * 60000)

    return {
      id_cliente: frontendData.id_cliente,
      id_profissional: frontendData.id_profissional,
      data_hora_inicio: dataHoraInicio.toISOString(),
      data_hora_fim: dataHoraFim.toISOString(),
      observacoes: frontendData.observacoes,
      servicos: [{
        id_servico: frontendData.id_servico,
        preco_cobrado: 0 // Será preenchido com o preço real do serviço
      }]
    }
  }

  /**
   * Converte dados do backend para formato do frontend
   */
  static toFrontend(backendData: AgendamentoComDetalhes): AgendamentoCompleto {
    const dataHoraInicio = parseISO(backendData.data_hora_inicio)
    const dataHoraFim = parseISO(backendData.data_hora_fim)
    
    // Pegar o primeiro serviço (assumindo um serviço por agendamento por simplicidade)
    const primeiroServico = backendData.servicos?.[0]
    const servico = primeiroServico?.servico

    // Calcular valor total dos serviços
    const valorTotal = backendData.servicos?.reduce((total, item) => {
      return total + item.preco_cobrado_servico
    }, 0) || 0

    return {
      id: backendData.id,
      title: servico?.nome || 'Serviço',
      cliente: {
        id: backendData.cliente.id,
        nome: backendData.cliente.nome,
        telefone: backendData.cliente.telefone,
        email: backendData.cliente.email
      },
      profissional: {
        id: backendData.profissional.id,
        nome: backendData.profissional.usuario.nome_completo,
        especialidades: backendData.profissional.especialidades
      },
      servico: {
        id: servico?.id,
        nome: servico?.nome || 'Serviço',
        preco: servico?.preco,
        duracao: servico?.duracao_estimada_minutos
      },
      data_agendamento: format(dataHoraInicio, 'yyyy-MM-dd'),
      hora_inicio: format(dataHoraInicio, 'HH:mm'),
      hora_fim: format(dataHoraFim, 'HH:mm'),
      status: STATUS_BACKEND_TO_FRONTEND[backendData.status] as 'agendado' | 'confirmado' | 'cancelado' | 'concluido',
      valor: valorTotal,
      observacoes: backendData.observacoes
    }
  }

  /**
   * Converte agendamento para evento do calendário
   */
  static toCalendarEvent(agendamento: AgendamentoComDetalhes): CalendarEvent {
    const primeiroServico = agendamento.servicos?.[0]?.servico
    
    return {
      id: agendamento.id,
      title: primeiroServico?.nome || 'Agendamento',
      start: parseISO(agendamento.data_hora_inicio),
      end: parseISO(agendamento.data_hora_fim),
      status: STATUS_BACKEND_TO_FRONTEND[agendamento.status],
      cliente: agendamento.cliente.nome,
      profissional: agendamento.profissional.usuario.nome_completo,
      servico: primeiroServico?.nome || 'Serviço'
    }
  }

  /**
   * Converte lista de agendamentos para frontend
   */
  static toFrontendList(backendList: AgendamentoComDetalhes[]): AgendamentoCompleto[] {
    return backendList.map(item => this.toFrontend(item))
  }

  /**
   * Converte lista de agendamentos para eventos do calendário
   */
  static toCalendarEvents(agendamentos: AgendamentoComDetalhes[]): CalendarEvent[] {
    return agendamentos.map(item => this.toCalendarEvent(item))
  }

  /**
   * Mapeia status do frontend para backend
   */
  static mapStatusToBackend(frontendStatus: string): StatusAgendamento {
    return STATUS_FRONTEND_TO_BACKEND[frontendStatus] || 'PENDENTE'
  }

  /**
   * Mapeia status do backend para frontend
   */
  static mapStatusToFrontend(backendStatus: StatusAgendamento): 'agendado' | 'confirmado' | 'cancelado' | 'concluido' {
    const mapped = STATUS_BACKEND_TO_FRONTEND[backendStatus]
    return (mapped as 'agendado' | 'confirmado' | 'cancelado' | 'concluido') || 'agendado'
  }

  /**
   * Converte filtros do frontend para formato da API
   */
  static toBackendFilters(frontendFilters: {
    statusFilter?: string
    profissionalFilter?: string
    dateFilter?: string
    searchTerm?: string
  }) {
    const filters: any = {}

    if (frontendFilters.statusFilter && frontendFilters.statusFilter !== 'todos') {
      filters.status = this.mapStatusToBackend(frontendFilters.statusFilter)
    }

    if (frontendFilters.profissionalFilter && frontendFilters.profissionalFilter !== 'todos') {
      filters.profissional = frontendFilters.profissionalFilter
    }

    // Para filtros de data, calcular início e fim do período
    if (frontendFilters.dateFilter && frontendFilters.dateFilter !== 'todos') {
      const hoje = new Date()
      
      switch (frontendFilters.dateFilter) {
        case 'hoje':
          filters.dataInicio = format(hoje, 'yyyy-MM-dd')
          filters.dataFim = format(hoje, 'yyyy-MM-dd')
          break
        case 'amanha':
          const amanha = new Date(hoje)
          amanha.setDate(amanha.getDate() + 1)
          filters.dataInicio = format(amanha, 'yyyy-MM-dd')
          filters.dataFim = format(amanha, 'yyyy-MM-dd')
          break
        case 'semana':
          const fimSemana = new Date(hoje)
          fimSemana.setDate(fimSemana.getDate() + 7)
          filters.dataInicio = format(hoje, 'yyyy-MM-dd')
          filters.dataFim = format(fimSemana, 'yyyy-MM-dd')
          break
      }
    }

    return filters
  }

  /**
   * Valida se um agendamento está em formato válido
   */
  static isValidAgendamento(agendamento: Partial<AgendamentoCompleto>): boolean {
    return !!(
      agendamento.cliente?.nome &&
      agendamento.profissional?.nome &&
      agendamento.data_agendamento &&
      agendamento.hora_inicio
    )
  }

  /**
   * Calcula a duração do agendamento em minutos
   */
  static calcularDuracao(horaInicio: string, horaFim: string): number {
    const inicio = new Date(`2000-01-01T${horaInicio}:00`)
    const fim = new Date(`2000-01-01T${horaFim}:00`)
    return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60))
  }

  /**
   * Formata duração em minutos para string legível
   */
  static formatarDuracao(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`
    }
    
    const horas = Math.floor(minutos / 60)
    const minutosRestantes = minutos % 60
    
    if (minutosRestantes === 0) {
      return `${horas}h`
    }
    
    return `${horas}h ${minutosRestantes}min`
  }

  /**
   * Gera título do agendamento baseado nos dados
   */
  static gerarTitulo(cliente: string, servico?: string): string {
    return servico ? `${cliente} - ${servico}` : cliente
  }
} 