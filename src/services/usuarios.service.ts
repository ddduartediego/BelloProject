import { BaseService, ServiceResponse } from './base.service'
import { Usuario, TipoUsuario } from '@/types/database'

export interface CreateUsuarioData {
  email: string
  nome_completo: string
  tipo_usuario: TipoUsuario
}

export interface UpdateUsuarioData extends Partial<CreateUsuarioData> {
  id: string
}

class UsuariosService extends BaseService {
  
  async getAll(): Promise<ServiceResponse<Usuario[]>> {
    const query = this.supabase
      .from('usuario')
      .select('*')
      .order('nome_completo')

    return this.handleRequest(query)
  }

  async getById(id: string): Promise<ServiceResponse<Usuario>> {
    const query = this.supabase
      .from('usuario')
      .select('*')
      .eq('id', id)
      .single()

    return this.handleRequest(query)
  }

  async getByEmail(email: string): Promise<ServiceResponse<Usuario>> {
    const query = this.supabase
      .from('usuario')
      .select('*')
      .eq('email', email)
      .single()

    return this.handleRequest(query)
  }

  async create(data: CreateUsuarioData): Promise<ServiceResponse<Usuario>> {
    try {
      // Verificar se usuário já existe
      const existingUser = await this.getByEmail(data.email)
      if (existingUser.data) {
        return {
          data: null,
          error: 'Usuário com este email já existe'
        }
      }

      // Gerar UUID para o usuário
      const userId = crypto.randomUUID()

      const usuarioData = {
        id: userId, // Adicionando o ID gerado
        ...data,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('usuario')
        .insert([usuarioData])
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

  async update(data: UpdateUsuarioData): Promise<ServiceResponse<Usuario>> {
    try {
      const { id, ...updateData } = data
      
      const updatePayload = {
        ...updateData,
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('usuario')
        .update(updatePayload)
        .eq('id', id)
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

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('usuario')
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

  // Buscar usuários que não são profissionais
  async getUsuariosDisponiveis(): Promise<ServiceResponse<Usuario[]>> {
    const query = this.supabase
      .from('usuario')
      .select(`
        *,
        profissional!id_usuario (id)
      `)
      .is('profissional.id', null)
      .order('nome_completo')

    return this.handleRequest(query)
  }

  // Verificar se email está disponível
  async isEmailDisponivel(email: string): Promise<ServiceResponse<boolean>> {
    try {
      const { count } = await this.supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)

      return {
        data: (count || 0) === 0,
        error: null
      }
    } catch (err) {
      return {
        data: false,
        error: this.handleError(err as Error)
      }
    }
  }
}

export const usuariosService = new UsuariosService()
export default usuariosService 