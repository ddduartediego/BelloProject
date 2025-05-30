import { BaseService, ServiceResponse, PaginationParams, PaginatedResponse } from './base.service'
import { Profissional, Usuario } from '@/types/database'
import { empresaService } from './empresa.service'

export interface CreateProfissionalData {
  id_usuario: string
  especialidades?: string[]
  horarios_trabalho?: Record<string, string[]>
}

export interface UpdateProfissionalData extends Partial<CreateProfissionalData> {
  id: string
}

export interface ProfissionalComUsuario extends Profissional {
  usuario: Usuario
}

export interface ProfissionalFilters {
  especialidade?: string
}

class ProfissionaisService extends BaseService {
  
  async getAll(
    pagination: PaginationParams = {},
    filters: ProfissionalFilters = {},
    orderBy?: string
  ): Promise<ServiceResponse<PaginatedResponse<ProfissionalComUsuario>>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('profissional')
        .select(`
          *,
          usuario (*)
        `, { count: 'exact' })
        .eq('id_empresa', empresaId)

      // Aplicar filtros
      if (filters.especialidade) {
        query = query.contains('especialidades', [filters.especialidade])
      }
      
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

  async getById(id: string): Promise<ServiceResponse<ProfissionalComUsuario>> {
    const query = this.supabase
      .from('profissional')
      .select(`
        *,
        usuario (*)
      `)
      .eq('id', id)
      .single()

    return this.handleRequest(query)
  }

  async getByUsuarioId(usuarioId: string): Promise<ServiceResponse<ProfissionalComUsuario>> {
    const query = this.supabase
      .from('profissional')
      .select(`
        *,
        usuario (*)
      `)
      .eq('id_usuario', usuarioId)
      .single()

    return this.handleRequest(query)
  }

  async create(data: CreateProfissionalData): Promise<ServiceResponse<Profissional>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const profissionalData = {
        ...data,
        id_empresa: empresaId,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('profissional')
        .insert([profissionalData])
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

  async update(data: UpdateProfissionalData): Promise<ServiceResponse<Profissional>> {
    const { id, ...updateData } = data
    
    const profissionalData = {
      ...updateData,
      atualizado_em: new Date().toISOString()
    }

    const query = this.supabase
      .from('profissional')
      .update(profissionalData)
      .eq('id', id)
      .select()
      .single()

    return this.handleRequest(query)
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('profissional')
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

  // Buscar profissionais por especialidade
  async getByEspecialidade(especialidade: string): Promise<ServiceResponse<ProfissionalComUsuario[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const query = this.supabase
        .from('profissional')
        .select(`
          *,
          usuario (*)
        `)
        .eq('id_empresa', empresaId)
        .contains('especialidades', [especialidade])
        .order('criado_em')

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Listar todas as especialidades disponíveis
  async getEspecialidades(): Promise<ServiceResponse<string[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const { data, error } = await this.supabase
        .from('profissional')
        .select('especialidades')
        .eq('id_empresa', empresaId)

      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        }
      }

      // Extrair todas as especialidades únicas
      const especialidades = new Set<string>()
      
      data?.forEach((prof) => {
        if (prof.especialidades && Array.isArray(prof.especialidades)) {
          prof.especialidades.forEach((esp: string) => especialidades.add(esp))
        }
      })

      return {
        data: Array.from(especialidades).sort(),
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Verificar se usuário já é profissional
  async isUsuarioProfissional(usuarioId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { count } = await this.supabase
        .from('profissional')
        .select('*', { count: 'exact', head: true })
        .eq('id_usuario', usuarioId)

      return {
        data: (count || 0) > 0,
        error: null
      }
    } catch (err) {
      return {
        data: false,
        error: this.handleError(err as Error)
      }
    }
  }

  // Estatísticas básicas
  async getEstatisticas(): Promise<ServiceResponse<{
    total: number
    porEspecialidade: Record<string, number>
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Total de profissionais
      const { count: total } = await this.supabase
        .from('profissional')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', empresaId)

      // Buscar todas as especialidades
      const especialidadesResponse = await this.getEspecialidades()
      const especialidades = especialidadesResponse.data || []

      const porEspecialidade: Record<string, number> = {}

      // Contar profissionais por especialidade
      for (const esp of especialidades) {
        const { count } = await this.supabase
          .from('profissional')
          .select('*', { count: 'exact', head: true })
          .eq('id_empresa', empresaId)
          .contains('especialidades', [esp])

        porEspecialidade[esp] = count || 0
      }

      return {
        data: {
          total: total || 0,
          porEspecialidade
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

export const profissionaisService = new ProfissionaisService()
export default profissionaisService 