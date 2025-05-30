import { BaseService, ServiceResponse, PaginationParams, PaginatedResponse } from './base.service'
import { Cliente } from '@/types/database'
import { empresaService } from './empresa.service'

export interface CreateClienteData {
  nome: string
  telefone: string
  email?: string
  data_nascimento?: string
  observacoes?: string
}

export interface UpdateClienteData extends Partial<CreateClienteData> {
  id: string
}

export interface ClienteFilters {
  nome?: string
  email?: string
  telefone?: string
}

class ClientesService extends BaseService {
  
  async getAll(
    pagination: PaginationParams = {},
    filters: ClienteFilters = {},
    orderBy?: string
  ): Promise<ServiceResponse<PaginatedResponse<Cliente>>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('cliente')
        .select('*', { count: 'exact' })
        .eq('id_empresa', empresaId)

      // Aplicar filtros
      query = this.buildFilters(query, filters)
      
      // Aplicar ordenação
      query = this.applyOrdering(query, orderBy, true)
      
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

  async getById(id: string): Promise<ServiceResponse<Cliente>> {
    const query = this.supabase
      .from('cliente')
      .select('*')
      .eq('id', id)
      .single()

    return this.handleRequest(query)
  }

  async create(data: CreateClienteData): Promise<ServiceResponse<Cliente>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const clienteData = {
        ...data,
        id_empresa: empresaId,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('cliente')
        .insert([clienteData])
        .select()
        .single()

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async update(data: UpdateClienteData): Promise<ServiceResponse<Cliente>> {
    const { id, ...updateData } = data
    
    const clienteData = {
      ...updateData,
      atualizado_em: new Date().toISOString()
    }

    const query = this.supabase
      .from('cliente')
      .update(clienteData)
      .eq('id', id)
      .select()
      .single()

    return this.handleRequest(query)
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('cliente')
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

  async search(termo: string, limit: number = 10): Promise<ServiceResponse<Cliente[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const query = this.supabase
        .from('cliente')
        .select('*')
        .eq('id_empresa', empresaId)
        .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,email.ilike.%${termo}%`)
        .limit(limit)
        .order('nome')

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Buscar clientes por aniversário (para alertas)
  async getAniversariantes(dias: number = 7): Promise<ServiceResponse<Cliente[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const hoje = new Date()
      const futuro = new Date()
      futuro.setDate(hoje.getDate() + dias)

      const query = this.supabase
        .from('cliente')
        .select('*')
        .eq('id_empresa', empresaId)
        .not('data_nascimento', 'is', null)
        .gte('data_nascimento', hoje.toISOString().split('T')[0])
        .lte('data_nascimento', futuro.toISOString().split('T')[0])
        .order('data_nascimento')

      return this.handleRequest(query)
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
    novosEsseMes: number
    aniversariantesEssaSemana: number
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Total de clientes
      const { count: total } = await this.supabase
        .from('cliente')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)

      // Novos clientes este mês
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      const { count: novosEsseMes } = await this.supabase
        .from('cliente')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)
        .gte('criado_em', inicioMes.toISOString())

      // Aniversariantes esta semana
      const aniversariantes = await this.getAniversariantes(7)

      return {
        data: {
          total: total || 0,
          novosEsseMes: novosEsseMes || 0,
          aniversariantesEssaSemana: aniversariantes.data?.length || 0
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

export const clientesService = new ClientesService()
export default clientesService 