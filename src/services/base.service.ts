import { createClient } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'

export interface ServiceResponse<T> {
  data: T | null
  error: string | null
  loading?: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class BaseService {
  protected supabase = createClient()

  protected handleError(error: PostgrestError | Error | null): string {
    if (!error) return ''
    
    // Erros específicos do PostgreSQL/Supabase
    if ('code' in error) {
      switch (error.code) {
        case '23505':
          return 'Este registro já existe'
        case '23503':
          return 'Não é possível excluir: existem dados relacionados'
        case '42501':
          return 'Permissão negada'
        case 'PGRST116':
          return 'Nenhum registro encontrado'
        default:
          return error.message || 'Erro no banco de dados'
      }
    }

    return error.message || 'Erro inesperado'
  }

  protected async handleRequest<T>(
    request: any
  ): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await request
      
      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        }
      }

      return {
        data,
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  protected async handlePaginatedRequest<T>(
    request: any,
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<T>>> {
    try {
      const { page = 1, limit = 50 } = pagination
      const { data, error, count } = await request
      
      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        data: {
          data: data || [],
          total,
          page,
          limit,
          totalPages
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

  // Utilitário para construir filtros dinâmicos
  protected buildFilters(query: any, filters: Record<string, any>) {
    let filteredQuery = query

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && key.includes('nome')) {
          // Busca por nome usando ilike para case-insensitive
          filteredQuery = filteredQuery.ilike(key, `%${value}%`)
        } else if (typeof value === 'string' && key.includes('email')) {
          filteredQuery = filteredQuery.ilike(key, `%${value}%`)
        } else if (Array.isArray(value)) {
          filteredQuery = filteredQuery.in(key, value)
        } else {
          filteredQuery = filteredQuery.eq(key, value)
        }
      }
    })

    return filteredQuery
  }

  // Utilitário para ordenação
  protected applyOrdering(query: any, orderBy?: string, ascending: boolean = true) {
    if (orderBy) {
      return query.order(orderBy, { ascending })
    }
    return query.order('criado_em', { ascending: false })
  }

  // Utilitário para paginação
  protected applyPagination(query: any, pagination: PaginationParams = {}) {
    const { page = 1, limit = 50 } = pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    return query.range(from, to)
  }
} 