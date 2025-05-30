import { BaseService, ServiceResponse, PaginationParams, PaginatedResponse } from './base.service'
import { Agendamento, AgendamentoComDetalhes, StatusAgendamento } from '@/types/database'
import { empresaService } from './empresa.service'

export interface CreateAgendamentoData {
  id_cliente: string
  id_profissional: string
  data_hora_inicio: string
  data_hora_fim: string
  observacoes?: string
  servicos: { id_servico: string; preco_cobrado: number }[]
}

export interface UpdateAgendamentoData extends Partial<CreateAgendamentoData> {
  id: string
  status?: StatusAgendamento
}

export interface AgendamentoFilters {
  status?: StatusAgendamento
  profissional?: string
  cliente?: string
  dataInicio?: string
  dataFim?: string
}

class AgendamentosService extends BaseService {
  
  async getAll(
    pagination: PaginationParams = {},
    filters: AgendamentoFilters = {},
    orderBy?: string
  ): Promise<ServiceResponse<PaginatedResponse<AgendamentoComDetalhes>>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('agendamento')
        .select(`
          *,
          cliente (*),
          profissional (*, usuario (*)),
          agendamento_servico (*, servico (*))
        `, { count: 'exact' })
        .eq('id_empresa', empresaId)

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.profissional) {
        query = query.eq('id_profissional', filters.profissional)
      }
      if (filters.cliente) {
        query = query.eq('id_cliente', filters.cliente)
      }
      if (filters.dataInicio) {
        query = query.gte('data_hora_inicio', filters.dataInicio)
      }
      if (filters.dataFim) {
        query = query.lte('data_hora_inicio', filters.dataFim)
      }
      
      // Aplicar ordenação (padrão por data mais próxima)
      query = this.applyOrdering(query, orderBy || 'data_hora_inicio', true)
      
      // Aplicar paginação
      query = this.applyPagination(query, pagination)

      return this.handlePaginatedRequest(query, pagination)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getById(id: string): Promise<ServiceResponse<AgendamentoComDetalhes>> {
    const query = this.supabase
      .from('agendamento')
      .select(`
        *,
        cliente (*),
        profissional (*, usuario (*)),
        agendamento_servico (*, servico (*))
      `)
      .eq('id', id)
      .single()

    return this.handleRequest(query)
  }

  async getByData(data: string): Promise<ServiceResponse<AgendamentoComDetalhes[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const inicioData = `${data}T00:00:00`
      const fimData = `${data}T23:59:59`

      const query = this.supabase
        .from('agendamento')
        .select(`
          *,
          cliente (*),
          profissional (*, usuario (*)),
          agendamento_servico (*, servico (*))
        `)
        .eq('id_empresa', empresaId)
        .gte('data_hora_inicio', inicioData)
        .lte('data_hora_inicio', fimData)
        .order('data_hora_inicio')

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getProximosAgendamentos(limit: number = 10): Promise<ServiceResponse<AgendamentoComDetalhes[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const agora = new Date().toISOString()

      const query = this.supabase
        .from('agendamento')
        .select(`
          *,
          cliente (*),
          profissional (*, usuario (*)),
          agendamento_servico (*, servico (*))
        `)
        .eq('id_empresa', empresaId)
        .in('status', ['PENDENTE', 'CONFIRMADO'])
        .gte('data_hora_inicio', agora)
        .order('data_hora_inicio')
        .limit(limit)

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async create(data: CreateAgendamentoData): Promise<ServiceResponse<Agendamento>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Criar agendamento
      const agendamentoData = {
        id_cliente: data.id_cliente,
        id_profissional: data.id_profissional,
        id_empresa: empresaId,
        data_hora_inicio: data.data_hora_inicio,
        data_hora_fim: data.data_hora_fim,
        observacoes: data.observacoes,
        status: 'PENDENTE' as StatusAgendamento,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const { data: agendamento, error: agendamentoError } = await this.supabase
        .from('agendamento')
        .insert([agendamentoData])
        .select()
        .single()

      if (agendamentoError) {
        return {
          data: null,
          error: this.handleError(agendamentoError)
        }
      }

      // Criar relacionamentos com serviços
      if (data.servicos && data.servicos.length > 0) {
        const servicosData = data.servicos.map(servico => ({
          id_agendamento: agendamento.id,
          id_servico: servico.id_servico,
          preco_cobrado_servico: servico.preco_cobrado
        }))

        const { error: servicosError } = await this.supabase
          .from('agendamento_servico')
          .insert(servicosData)

        if (servicosError) {
          // Rollback do agendamento
          await this.supabase
            .from('agendamento')
            .delete()
            .eq('id', agendamento.id)

          return {
            data: null,
            error: this.handleError(servicosError)
          }
        }
      }

      return {
        data: agendamento,
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async update(data: UpdateAgendamentoData): Promise<ServiceResponse<Agendamento>> {
    const { id, servicos, ...updateData } = data
    
    const agendamentoData = {
      ...updateData,
      atualizado_em: new Date().toISOString()
    }

    const query = this.supabase
      .from('agendamento')
      .update(agendamentoData)
      .eq('id', id)
      .select()
      .single()

    return this.handleRequest(query)
  }

  async updateStatus(id: string, status: StatusAgendamento): Promise<ServiceResponse<Agendamento>> {
    return this.update({ id, status })
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Primeiro deletar os serviços relacionados
      await this.supabase
        .from('agendamento_servico')
        .delete()
        .eq('id_agendamento', id)

      // Depois deletar o agendamento
      const { error } = await this.supabase
        .from('agendamento')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          data: false,
          error: this.handleError(error)
        }
      }

      return {
        data: true,
        error: null
      }
    } catch (err) {
      return {
        data: false,
        error: this.handleError(err as Error)
      }
    }
  }

  // Verificar conflitos de horário
  async verificarConflito(
    profissionalId: string, 
    dataInicio: string, 
    dataFim: string, 
    agendamentoExcluidoId?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      let query = this.supabase
        .from('agendamento')
        .select('id')
        .eq('id_profissional', profissionalId)
        .in('status', ['PENDENTE', 'CONFIRMADO'])
        .or(`and(data_hora_inicio.lte.${dataInicio},data_hora_fim.gt.${dataInicio}),and(data_hora_inicio.lt.${dataFim},data_hora_fim.gte.${dataFim}),and(data_hora_inicio.gte.${dataInicio},data_hora_fim.lte.${dataFim})`)

      if (agendamentoExcluidoId) {
        query = query.neq('id', agendamentoExcluidoId)
      }

      const { data, error } = await query

      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        }
      }

      return {
        data: (data?.length || 0) > 0,
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Estatísticas básicas
  async getEstatisticas(): Promise<ServiceResponse<{
    total: number
    pendentes: number
    confirmados: number
    concluidos: number
    cancelados: number
    hojeTotal: number
    proximaSemana: number
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Total geral
      const { count: total } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)

      // Por status
      const { count: pendentes } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .eq('status', 'PENDENTE')

      const { count: confirmados } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .eq('status', 'CONFIRMADO')

      const { count: concluidos } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .eq('status', 'CONCLUIDO')

      const { count: cancelados } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .eq('status', 'CANCELADO')

      // Hoje
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString()

      const { count: hojeTotal } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .gte('data_hora_inicio', inicioHoje)
        .lte('data_hora_inicio', fimHoje)

      // Próxima semana
      const proximaSemana = new Date()
      proximaSemana.setDate(proximaSemana.getDate() + 7)

      const { count: proximaSemanaCount } = await this.supabase
        .from('agendamento')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .gte('data_hora_inicio', new Date().toISOString())
        .lte('data_hora_inicio', proximaSemana.toISOString())

      return {
        data: {
          total: total || 0,
          pendentes: pendentes || 0,
          confirmados: confirmados || 0,
          concluidos: concluidos || 0,
          cancelados: cancelados || 0,
          hojeTotal: hojeTotal || 0,
          proximaSemana: proximaSemanaCount || 0
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
}

export const agendamentosService = new AgendamentosService()
export default agendamentosService 