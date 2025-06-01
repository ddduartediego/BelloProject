import { BaseService, ServiceResponse } from './base.service'
import { MovimentacaoCaixa, TipoMovimentacao } from '@/types/database'

export interface CreateMovimentacaoData {
  id_caixa: string
  id_comanda?: string
  tipo_movimentacao: TipoMovimentacao
  valor: number
  descricao: string
  id_profissional_responsavel?: string
}

export interface MovimentacaoFilters {
  tipo?: TipoMovimentacao
  data_inicio?: string
  data_fim?: string
  id_caixa?: string
  id_profissional?: string
}

class MovimentacoesCaixaService extends BaseService {

  async getAll(
    filters: MovimentacaoFilters = {},
    ordenacao: 'asc' | 'desc' = 'desc'
  ): Promise<ServiceResponse<MovimentacaoCaixa[]>> {
    try {
      let query = this.supabase
        .from('movimentacao_caixa')
        .select(`
          *,
          caixa:id_caixa(id, data_abertura, status),
          comanda:id_comanda(id, cliente:id_cliente(nome), nome_cliente_avulso),
          profissional_responsavel:id_profissional_responsavel(
            id,
            usuario:id_usuario(nome_completo)
          )
        `)

      // Aplicar filtros
      if (filters.tipo) {
        query = query.eq('tipo_movimentacao', filters.tipo)
      }
      if (filters.id_caixa) {
        query = query.eq('id_caixa', filters.id_caixa)
      }
      if (filters.id_profissional) {
        query = query.eq('id_profissional_responsavel', filters.id_profissional)
      }
      if (filters.data_inicio) {
        query = query.gte('data_movimentacao', filters.data_inicio)
      }
      if (filters.data_fim) {
        query = query.lte('data_movimentacao', filters.data_fim)
      }

      // Aplicar ordenação
      query = query.order('data_movimentacao', { ascending: ordenacao === 'asc' })

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getByCaixa(caixaId: string): Promise<ServiceResponse<MovimentacaoCaixa[]>> {
    return this.getAll({ id_caixa: caixaId })
  }

  async create(data: CreateMovimentacaoData): Promise<ServiceResponse<MovimentacaoCaixa>> {
    try {
      // Verificar se o caixa está aberto
      const { data: caixa, error: caixaError } = await this.supabase
        .from('caixa')
        .select('status')
        .eq('id', data.id_caixa)
        .single()

      if (caixaError || !caixa) {
        return {
          data: null,
          error: 'Caixa não encontrado'
        }
      }

      if (caixa.status !== 'ABERTO') {
        return {
          data: null,
          error: 'Não é possível adicionar movimentações a um caixa fechado'
        }
      }

      const movimentacaoData = {
        ...data,
        data_movimentacao: new Date().toISOString(),
        criado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('movimentacao_caixa')
        .insert([movimentacaoData])
        .select(`
          *,
          caixa:id_caixa(id, data_abertura, status),
          comanda:id_comanda(id, cliente:id_cliente(nome), nome_cliente_avulso),
          profissional_responsavel:id_profissional_responsavel(
            id,
            usuario:id_usuario(nome_completo)
          )
        `)
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
      // Buscar movimentação para verificar se pode ser excluída
      const { data: movimentacao } = await this.supabase
        .from('movimentacao_caixa')
        .select(`
          id_caixa,
          caixa:id_caixa(status)
        `)
        .eq('id', id)
        .single()

      if (!movimentacao) {
        return {
          data: false,
          error: 'Movimentação não encontrada'
        }
      }

      // Verificar status do caixa usando uma query separada mais simples
      const { data: caixa } = await this.supabase
        .from('caixa')
        .select('status')
        .eq('id', movimentacao.id_caixa)
        .single()

      if (caixa?.status !== 'ABERTO') {
        return {
          data: false,
          error: 'Não é possível excluir movimentações de um caixa fechado'
        }
      }

      const { error } = await this.supabase
        .from('movimentacao_caixa')
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

  // Criar sangria (saída de dinheiro do caixa)
  async criarSangria(
    caixaId: string,
    valor: number,
    descricao: string,
    profissionalId?: string
  ): Promise<ServiceResponse<MovimentacaoCaixa>> {
    return this.create({
      id_caixa: caixaId,
      tipo_movimentacao: 'SANGRIA',
      valor: -Math.abs(valor), // Valor negativo para representar saída
      descricao: descricao || 'Sangria',
      id_profissional_responsavel: profissionalId
    })
  }

  // Criar reforço (entrada de dinheiro no caixa)
  async criarReforco(
    caixaId: string,
    valor: number,
    descricao: string,
    profissionalId?: string
  ): Promise<ServiceResponse<MovimentacaoCaixa>> {
    return this.create({
      id_caixa: caixaId,
      tipo_movimentacao: 'REFORCO',
      valor,
      descricao: descricao || 'Reforço de caixa',
      id_profissional_responsavel: profissionalId
    })
  }

  // Criar entrada por venda (automática quando comanda é fechada)
  async criarEntradaVenda(
    caixaId: string,
    comandaId: string,
    valor: number,
    descricao?: string
  ): Promise<ServiceResponse<MovimentacaoCaixa>> {
    return this.create({
      id_caixa: caixaId,
      id_comanda: comandaId,
      tipo_movimentacao: 'ENTRADA',
      valor,
      descricao: descricao || `Venda - Comanda #${comandaId.substring(0, 8)}`
    })
  }

  // Relatório de movimentações por período
  async getRelatorioPeriodo(
    caixaId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<ServiceResponse<{
    movimentacoes: MovimentacaoCaixa[]
    resumo: {
      total_entradas: number
      total_saidas: number
      total_vendas: number
      total_sangrias: number
      total_reforcos: number
      quantidade_movimentacoes: number
    }
  }>> {
    try {
      const { data: movimentacoes, error } = await this.getAll({
        id_caixa: caixaId,
        data_inicio: dataInicio,
        data_fim: dataFim
      })

      if (error || !movimentacoes) {
        return { data: null, error: error || 'Erro ao buscar movimentações' }
      }

      const resumo = movimentacoes.reduce((acc, mov) => {
        acc.quantidade_movimentacoes++

        switch (mov.tipo_movimentacao) {
          case 'ENTRADA':
            acc.total_entradas += mov.valor
            if (mov.id_comanda) {
              acc.total_vendas += mov.valor
            }
            break
          case 'REFORCO':
            acc.total_entradas += mov.valor
            acc.total_reforcos += mov.valor
            break
          case 'SAIDA':
          case 'SANGRIA':
            acc.total_saidas += Math.abs(mov.valor)
            if (mov.tipo_movimentacao === 'SANGRIA') {
              acc.total_sangrias += Math.abs(mov.valor)
            }
            break
        }

        return acc
      }, {
        total_entradas: 0,
        total_saidas: 0,
        total_vendas: 0,
        total_sangrias: 0,
        total_reforcos: 0,
        quantidade_movimentacoes: 0
      })

      return {
        data: {
          movimentacoes,
          resumo
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

  // Estatísticas de movimentações
  async getEstatisticas(periodo?: { inicio: string; fim: string }): Promise<ServiceResponse<{
    total_movimentacoes: number
    valor_total_movimentado: number
    media_por_movimento: number
    movimentacoes_por_tipo: Record<TipoMovimentacao, { quantidade: number; valor: number }>
  }>> {
    try {
      const filters: MovimentacaoFilters = {}
      if (periodo) {
        filters.data_inicio = periodo.inicio
        filters.data_fim = periodo.fim
      }

      const { data: movimentacoes, error } = await this.getAll(filters)

      if (error || !movimentacoes) {
        return { data: null, error: error || 'Erro ao buscar movimentações' }
      }

      const stats = movimentacoes.reduce((acc, mov) => {
        acc.total_movimentacoes++
        acc.valor_total_movimentado += mov.valor

        if (!acc.movimentacoes_por_tipo[mov.tipo_movimentacao]) {
          acc.movimentacoes_por_tipo[mov.tipo_movimentacao] = { quantidade: 0, valor: 0 }
        }

        acc.movimentacoes_por_tipo[mov.tipo_movimentacao].quantidade++
        acc.movimentacoes_por_tipo[mov.tipo_movimentacao].valor += mov.valor

        return acc
      }, {
        total_movimentacoes: 0,
        valor_total_movimentado: 0,
        movimentacoes_por_tipo: {} as Record<TipoMovimentacao, { quantidade: number; valor: number }>
      })

      return {
        data: {
          ...stats,
          media_por_movimento: stats.total_movimentacoes > 0 
            ? stats.valor_total_movimentado / stats.total_movimentacoes 
            : 0
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

const movimentacoesCaixaService = new MovimentacoesCaixaService()
export default movimentacoesCaixaService 