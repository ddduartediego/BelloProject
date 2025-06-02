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

  // Taxa de retorno de clientes
  async getTaxaRetornoClientes(periodo?: { inicio: string; fim: string }): Promise<ServiceResponse<{
    taxaRetorno: number
    clientesTotais: number
    clientesRecorrentes: number
    novoClientes: number
    detalhes: Array<{
      clienteId: string
      nome: string
      totalAgendamentos: number
      ultimoAgendamento: string
    }>
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Query para buscar agendamentos com clientes
      let query = this.supabase
        .from('agendamento')
        .select(`
          id,
          id_cliente,
          data_agendamento,
          cliente:id_cliente(
            id,
            nome
          )
        `)
        .eq('id_empresa', empresaId)
        .not('id_cliente', 'is', null)

      if (periodo) {
        query = query
          .gte('data_agendamento', periodo.inicio)
          .lte('data_agendamento', periodo.fim)
      } else {
        // Último mês por padrão
        const umMesAtras = new Date()
        umMesAtras.setMonth(umMesAtras.getMonth() - 1)
        query = query.gte('data_agendamento', umMesAtras.toISOString())
      }

      const { data: agendamentos, error } = await query

      if (error) {
        return { data: null, error: this.handleError(error) }
      }

      // Se não há agendamentos, retornar valores zerados
      if (!agendamentos || agendamentos.length === 0) {
        return {
          data: {
            taxaRetorno: 0,
            clientesTotais: 0,
            clientesRecorrentes: 0,
            novoClientes: 0,
            detalhes: []
          },
          error: null
        }
      }

      // Agrupar agendamentos por cliente
      const clientesMap = agendamentos.reduce((acc, agendamento) => {
        const clienteId = agendamento.id_cliente
        const clienteNome = (agendamento.cliente as any)?.nome || `Cliente ${clienteId}`
        
        if (!acc[clienteId]) {
          acc[clienteId] = {
            clienteId,
            nome: clienteNome,
            agendamentos: [],
            totalAgendamentos: 0
          }
        }
        
        acc[clienteId].agendamentos.push(agendamento.data_agendamento)
        acc[clienteId].totalAgendamentos++
        
        return acc
      }, {} as Record<string, {
        clienteId: string
        nome: string
        agendamentos: string[]
        totalAgendamentos: number
      }>)

      const clientes = Object.values(clientesMap)
      const clientesTotais = clientes.length
      const clientesRecorrentes = clientes.filter(c => c.totalAgendamentos > 1).length
      const novoClientes = clientesTotais - clientesRecorrentes
      const taxaRetorno = clientesTotais > 0 ? (clientesRecorrentes / clientesTotais) * 100 : 0

      const detalhes = clientes.map(cliente => ({
        clienteId: cliente.clienteId,
        nome: cliente.nome,
        totalAgendamentos: cliente.totalAgendamentos,
        ultimoAgendamento: cliente.agendamentos.sort().pop() || ''
      }))

      return {
        data: {
          taxaRetorno: Math.round(taxaRetorno * 10) / 10,
          clientesTotais,
          clientesRecorrentes,
          novoClientes,
          detalhes: detalhes.sort((a, b) => b.totalAgendamentos - a.totalAgendamentos)
        },
        error: null
      }
    } catch (err) {
      return {
        data: {
          taxaRetorno: 0,
          clientesTotais: 0,
          clientesRecorrentes: 0,
          novoClientes: 0,
          detalhes: []
        },
        error: null // Não propagar erro, retornar valores zerados
      }
    }
  }

  // Métricas de ocupação dos profissionais
  async getOcupacaoProfissionais(periodo?: { inicio: string; fim: string }): Promise<ServiceResponse<{
    ocupacaoMedia: number
    profissionais: Array<{
      profissionalId: string
      nome: string
      horasAgendadas: number
      horasDisponiveis: number
      ocupacao: number
      totalAgendamentos: number
    }>
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Buscar profissionais da empresa
      const { data: profissionais, error: profError } = await this.supabase
        .from('profissional')
        .select(`
          id,
          usuario (nome_completo),
          horarios_trabalho
        `)
        .eq('id_empresa', empresaId)

      if (profError || !profissionais) {
        return { data: null, error: 'Erro ao buscar profissionais' }
      }

      // Buscar agendamentos dos profissionais no período
      let agendamentosQuery = this.supabase
        .from('agendamento')
        .select(`
          id_profissional,
          data_hora_inicio,
          data_hora_fim,
          agendamento_servico (servico (duracao_estimada_minutos))
        `)
        .eq('id_empresa', empresaId)
        .in('status', ['CONFIRMADO', 'CONCLUIDO'])

      if (periodo) {
        agendamentosQuery = agendamentosQuery
          .gte('data_hora_inicio', periodo.inicio)
          .lte('data_hora_inicio', periodo.fim)
      }

      const { data: agendamentos, error: agendError } = await agendamentosQuery

      if (agendError) {
        return { data: null, error: this.handleError(agendError) }
      }

      // Calcular métricas por profissional
      const profissionaisMetricas = profissionais.map(prof => {
        const agendamentosProf = agendamentos?.filter(a => a.id_profissional === prof.id) || []
        
        // Calcular horas agendadas (considerando duração dos serviços)
        const horasAgendadas = agendamentosProf.reduce((total, agendamento) => {
          const duracao = (agendamento.agendamento_servico as any)?.[0]?.servico?.duracao_estimada_minutos || 60
          return total + (duracao / 60)
        }, 0)

        // Horas disponíveis (exemplo: 8h por dia útil no período)
        // TODO: Usar horarios_trabalho do profissional para cálculo mais preciso
        const diasUteis = periodo ? 
          Math.ceil((new Date(periodo.fim).getTime() - new Date(periodo.inicio).getTime()) / (1000 * 60 * 60 * 24)) * 0.7 : // ~70% são dias úteis
          30 * 0.7 // último mês

        const horasDisponiveis = diasUteis * 8 // 8h por dia útil

        const ocupacao = horasDisponiveis > 0 ? (horasAgendadas / horasDisponiveis) * 100 : 0

        return {
          profissionalId: prof.id,
          nome: (prof.usuario as any)?.nome_completo || 'Profissional sem nome',
          horasAgendadas: Math.round(horasAgendadas * 10) / 10,
          horasDisponiveis: Math.round(horasDisponiveis * 10) / 10,
          ocupacao: Math.round(ocupacao * 10) / 10,
          totalAgendamentos: agendamentosProf.length
        }
      })

      const ocupacaoMedia = profissionaisMetricas.length > 0 
        ? profissionaisMetricas.reduce((sum, p) => sum + p.ocupacao, 0) / profissionaisMetricas.length
        : 0

      return {
        data: {
          ocupacaoMedia: Math.round(ocupacaoMedia * 10) / 10,
          profissionais: profissionaisMetricas.sort((a, b) => b.ocupacao - a.ocupacao)
        },
        error: null
      }
    } catch (err) {
      return {
        data: {
          ocupacaoMedia: 0,
          profissionais: []
        },
        error: null // Não propagar erro, retornar valores zerados
      }
    }
  }

  // Análise de horários de pico
  async getHorariosPico(periodo?: { inicio: string; fim: string }): Promise<ServiceResponse<{
    horariosPopulares: Array<{
      hora: string
      agendamentos: number
      percentual: number
    }>
    diasSemanaPopulares: Array<{
      diaSemana: string
      agendamentos: number
      percentual: number
    }>
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('agendamento')
        .select('data_hora_inicio')
        .eq('id_empresa', empresaId)
        .in('status', ['CONFIRMADO', 'CONCLUIDO'])

      if (periodo) {
        query = query
          .gte('data_hora_inicio', periodo.inicio)
          .lte('data_hora_inicio', periodo.fim)
      }

      const { data: agendamentos, error } = await query

      if (error || !agendamentos) {
        return { data: null, error: this.handleError(error) || 'Nenhum agendamento encontrado' }
      }

      const totalAgendamentos = agendamentos.length

      if (totalAgendamentos === 0) {
        return {
          data: {
            horariosPopulares: [],
            diasSemanaPopulares: []
          },
          error: null
        }
      }

      // Agrupar por hora
      const horarios = agendamentos.reduce((acc, agendamento) => {
        const hora = new Date(agendamento.data_hora_inicio).getHours()
        const horaFormatada = `${hora.toString().padStart(2, '0')}:00`
        acc[horaFormatada] = (acc[horaFormatada] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Agrupar por dia da semana
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const diasMap = agendamentos.reduce((acc, agendamento) => {
        const diaSemana = new Date(agendamento.data_hora_inicio).getDay()
        const diaNome = diasSemana[diaSemana]
        acc[diaNome] = (acc[diaNome] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const horariosPopulares = Object.entries(horarios)
        .map(([hora, count]) => ({
          hora,
          agendamentos: count,
          percentual: Math.round((count / totalAgendamentos) * 100 * 10) / 10
        }))
        .sort((a, b) => b.agendamentos - a.agendamentos)
        .slice(0, 10)

      const diasSemanaPopulares = Object.entries(diasMap)
        .map(([diaSemana, count]) => ({
          diaSemana,
          agendamentos: count,
          percentual: Math.round((count / totalAgendamentos) * 100 * 10) / 10
        }))
        .sort((a, b) => b.agendamentos - a.agendamentos)

      return {
        data: {
          horariosPopulares,
          diasSemanaPopulares
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