import { BaseService, ServiceResponse, PaginationParams, PaginatedResponse } from './base.service'
import { Servico } from '@/types/database'
import { empresaService } from './empresa.service'

export interface CreateServicoData {
  nome: string
  descricao?: string
  preco: number
  duracao_estimada_minutos: number
  categoria?: string
}

export interface UpdateServicoData extends Partial<CreateServicoData> {
  id: string
}

export interface ServicoFilters {
  nome?: string
  categoria?: string
  precoMin?: number
  precoMax?: number
}

class ServicosService extends BaseService {
  
  async getAll(
    pagination: PaginationParams = {},
    filters: ServicoFilters = {},
    orderBy?: string
  ): Promise<ServiceResponse<PaginatedResponse<Servico>>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('servico')
        .select('*', { count: 'exact' })
        .eq('id_empresa', empresaId)

      // Aplicar filtros
      query = this.buildFilters(query, filters)
      
      // Filtros específicos de preço
      if (filters.precoMin !== undefined) {
        query = query.gte('preco', filters.precoMin)
      }
      if (filters.precoMax !== undefined) {
        query = query.lte('preco', filters.precoMax)
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

  async getById(id: string): Promise<ServiceResponse<Servico>> {
    const query = this.supabase
      .from('servico')
      .select('*')
      .eq('id', id)
      .single()

    return this.handleRequest(query)
  }

  async getAtivos(): Promise<ServiceResponse<Servico[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const query = this.supabase
        .from('servico')
        .select('*')
        .eq('id_empresa', empresaId)
        .order('nome', { ascending: true })

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async create(data: CreateServicoData): Promise<ServiceResponse<Servico>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const servicoData = {
        ...data,
        id_empresa: empresaId,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('servico')
        .insert([servicoData])
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

  async update(data: UpdateServicoData): Promise<ServiceResponse<Servico>> {
    const { id, ...updateData } = data
    
    const servicoData = {
      ...updateData,
      atualizado_em: new Date().toISOString()
    }

    const query = this.supabase
      .from('servico')
      .update(servicoData)
      .eq('id', id)
      .select()
      .single()

    return this.handleRequest(query)
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('servico')
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

  // Buscar serviços por categoria
  async getByCategoria(categoria: string): Promise<ServiceResponse<Servico[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const query = this.supabase
        .from('servico')
        .select('*')
        .eq('id_empresa', empresaId)
        .eq('categoria', categoria)
        .order('nome')

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Listar todas as categorias
  async getCategorias(): Promise<ServiceResponse<string[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const { data, error } = await this.supabase
        .from('servico')
        .select('categoria')
        .eq('id_empresa', empresaId)
        .not('categoria', 'is', null)

      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        }
      }

      // Extrair categorias únicas
      const categorias = new Set<string>()
      data?.forEach((servico) => {
        if (servico.categoria) {
          categorias.add(servico.categoria)
        }
      })

      return {
        data: Array.from(categorias).sort(),
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Buscar serviços mais populares (baseado em agendamentos)
  async getMaisPopulares(limit: number = 5): Promise<ServiceResponse<Servico[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Por enquanto retorna serviços ordenados por nome
      // TODO: implementar quando tiver tabela de agendamentos
      const query = this.supabase
        .from('servico')
        .select('*')
        .eq('id_empresa', empresaId)
        .order('nome')
        .limit(limit)

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
    porCategoria: Record<string, number>
    precoMedio: number
    duracaoMedia: number
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Buscar todos os serviços para calcular estatísticas
      const { data: servicos, error } = await this.supabase
        .from('servico')
        .select('*')
        .eq('id_empresa', empresaId)

      if (error) {
        return {
          data: null,
          error: this.handleError(error)
        }
      }

      const total = servicos?.length || 0

      // Calcular por categoria
      const porCategoria: Record<string, number> = {}
      servicos?.forEach((servico) => {
        const categoria = servico.categoria || 'Sem categoria'
        porCategoria[categoria] = (porCategoria[categoria] || 0) + 1
      })

      // Calcular médias
      const precoMedio = total > 0 
        ? servicos!.reduce((sum, s) => sum + (s.preco || 0), 0) / total 
        : 0
      
      const duracaoMedia = total > 0 
        ? servicos!.reduce((sum, s) => sum + (s.duracao_estimada_minutos || 0), 0) / total 
        : 0

      return {
        data: {
          total,
          porCategoria,
          precoMedio: Math.round(precoMedio * 100) / 100, // 2 casas decimais
          duracaoMedia: Math.round(duracaoMedia)
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

export const servicosService = new ServicosService()
export default servicosService 