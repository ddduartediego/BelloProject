import { BaseService, ServiceResponse } from './base.service'
import { Empresa } from '@/types/database'

export interface CreateEmpresaData {
  nome_fantasia: string
  razao_social: string
  cnpj: string
  telefone: string
  endereco: string
  logo_url?: string
}

export interface UpdateEmpresaData extends Partial<CreateEmpresaData> {
  id: string
}

class EmpresaService extends BaseService {
  
  // Como o sistema é single-tenant, busca a primeira empresa
  async getEmpresaAtual(): Promise<ServiceResponse<Empresa>> {
    const request = this.supabase
      .from('empresa')
      .select('*')
      .limit(1)
      .single()

    return this.handleRequest(request)
  }

  async getById(id: string): Promise<ServiceResponse<Empresa>> {
    const request = this.supabase
      .from('empresa')
      .select('*')
      .eq('id', id)
      .single()

    return this.handleRequest(request)
  }

  async create(data: CreateEmpresaData): Promise<ServiceResponse<Empresa>> {
    const empresaData = {
      ...data,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }

    const request = this.supabase
      .from('empresa')
      .insert([empresaData])
      .select()
      .single()

    return this.handleRequest(request)
  }

  async update(data: UpdateEmpresaData): Promise<ServiceResponse<Empresa>> {
    const { id, ...updateData } = data
    
    const empresaData = {
      ...updateData,
      atualizado_em: new Date().toISOString()
    }

    const request = this.supabase
      .from('empresa')
      .update(empresaData)
      .eq('id', id)
      .select()
      .single()

    return this.handleRequest(request)
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('empresa')
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

  // Utility para obter ID da empresa atual (cache simples)
  private empresaAtualId: string | null = null
  
  async getEmpresaAtualId(): Promise<string | null> {
    if (this.empresaAtualId) {
      return this.empresaAtualId
    }

    const response = await this.getEmpresaAtual()
    if (response.data) {
      this.empresaAtualId = response.data.id
      return this.empresaAtualId
    }

    return null
  }
}

export const empresaService = new EmpresaService()
export default empresaService 