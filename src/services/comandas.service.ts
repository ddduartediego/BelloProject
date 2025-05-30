import { BaseService, ServiceResponse, PaginationParams, PaginatedResponse } from './base.service'
import { Comanda, ComandaComDetalhes, StatusComanda, MetodoPagamento } from '@/types/database'
import empresaService from './empresa.service'

export interface CreateComandaData {
  id_cliente?: string
  nome_cliente_avulso?: string
  id_profissional_responsavel: string
  itens?: {
    id_servico?: string
    nome_servico_avulso?: string
    preco_unitario: number
    quantidade: number
    servico?: any
  }[]
}

export interface UpdateComandaData extends Partial<CreateComandaData> {
  id: string
}

export interface ComandaFilters {
  status?: StatusComanda
  id_profissional?: string
  id_cliente?: string
  data_inicio?: string
  data_fim?: string
  busca?: string
}

export interface FinalizarComandaData {
  metodo_pagamento: MetodoPagamento
  valor_desconto?: number
  observacoes_pagamento?: string
}

class ComandasService extends BaseService {
  
  async getAll(
    pagination: PaginationParams = {},
    filters: ComandaFilters = {},
    orderBy?: string
  ): Promise<ServiceResponse<PaginatedResponse<ComandaComDetalhes>>> {
    try {
      console.log('🔍 DEBUG: Iniciando getAll comandas SIMPLIFICADO com filtros:', filters)
      
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      console.log('🔍 DEBUG: EmpresaId encontrado:', empresaId)

      // QUERY SEGURA - removendo JOIN problemático temporariamente
      let query = this.supabase
        .from('comanda')
        .select(`
          id,
          id_cliente,
          nome_cliente_avulso,
          id_profissional_responsavel,
          id_caixa,
          status,
          data_abertura,
          data_fechamento,
          valor_total_servicos,
          valor_total_produtos,
          valor_desconto,
          valor_total_pago,
          metodo_pagamento,
          criado_em,
          atualizado_em,
          cliente:id_cliente(id, nome, telefone, email),
          profissional_responsavel:id_profissional_responsavel(
            id,
            id_usuario,
            especialidades
          )
        `, { count: 'exact' })
        .eq('id_empresa', empresaId)

      console.log('🔍 DEBUG: Query SIMPLIFICADA construída, aplicando filtros...')

      // Aplicar filtros básicos
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.id_profissional) {
        query = query.eq('id_profissional_responsavel', filters.id_profissional)
      }
      if (filters.id_cliente) {
        query = query.eq('id_cliente', filters.id_cliente)
      }
      if (filters.data_inicio) {
        query = query.gte('data_abertura', filters.data_inicio)
      }
      if (filters.data_fim) {
        query = query.lte('data_abertura', filters.data_fim)
      }
      if (filters.busca) {
        query = query.or(`
          nome_cliente_avulso.ilike.%${filters.busca}%,
          id.ilike.%${filters.busca}%
        `)
      }

      // Aplicar ordenação
      query = this.applyOrdering(query, orderBy || 'data_abertura', false)
      
      // Aplicar paginação
      query = this.applyPagination(query, pagination)

      console.log('🔍 DEBUG: Executando query SIMPLIFICADA...')
      const result = await this.handlePaginatedRequest(query, pagination) as ServiceResponse<PaginatedResponse<ComandaComDetalhes>>
      console.log('🔍 DEBUG: Resultado da query SIMPLIFICADA:', result.error ? `ERRO: ${result.error}` : `Sucesso: ${result.data?.data?.length} comandas`)
      
      return result
    } catch (err) {
      console.error('🚨 DEBUG: Erro capturado em getAll SIMPLIFICADO:', err)
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getById(id: string): Promise<ServiceResponse<ComandaComDetalhes>> {
    console.log('🔍 DEBUG: Buscando comanda por ID:', id)
    
    const query = this.supabase
      .from('comanda')
      .select(`
        *,
        cliente:id_cliente(id, nome, telefone, email),
        profissional_responsavel:id_profissional_responsavel(
          id, 
          id_usuario, 
          especialidades,
          usuario_responsavel:id_usuario(nome, email)
        ),
        caixa:id_caixa(id, data_abertura, saldo_inicial, status),
        itens:item_comanda(
          id,
          id_servico,
          id_produto, 
          quantidade,
          preco_unitario_registrado,
          preco_total_item,
          id_profissional_executante,
          servico:id_servico(id, nome, preco, duracao_estimada_minutos),
          produto:id_produto(id, nome, preco_venda, estoque_atual),
          profissional_executante:id_profissional_executante(
            id,
            usuario_executante:id_usuario(nome)
          )
        )
      `)
      .eq('id', id)
      .single()

    const result = await this.handleRequest(query) as ServiceResponse<ComandaComDetalhes>
    console.log('🔍 DEBUG: Resultado getById:', result.error ? `ERRO: ${result.error}` : 'Sucesso')
    return result
  }

  async create(data: CreateComandaData): Promise<ServiceResponse<Comanda>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Buscar caixa ativo
      const { data: caixaAtivo, error: caixaError } = await this.supabase
        .from('caixa')
        .select('id')
        .eq('id_empresa', empresaId)
        .eq('status', 'ABERTO')
        .single()

      if (caixaError || !caixaAtivo) {
        return { 
          data: null, 
          error: 'Não há caixa aberto. Abra um caixa antes de criar comandas.' 
        }
      }

      const comandaData = {
        ...data,
        id_empresa: empresaId,
        id_caixa: caixaAtivo.id,
        data_abertura: new Date().toISOString(),
        valor_total_servicos: 0,
        valor_total_produtos: 0,
        valor_desconto: 0,
        valor_total_pago: 0,
        status: 'ABERTA' as StatusComanda,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('comanda')
        .insert([comandaData])
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

  async update(data: UpdateComandaData): Promise<ServiceResponse<Comanda>> {
    const { id, ...updateData } = data
    
    const comandaData = {
      ...updateData,
      atualizado_em: new Date().toISOString()
    }

    const query = this.supabase
      .from('comanda')
      .update(comandaData)
      .eq('id', id)
      .select()
      .single()

    return this.handleRequest(query)
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Verificar se comanda pode ser excluída (apenas se estiver ABERTA)
      const { data: comanda } = await this.supabase
        .from('comanda')
        .select('status')
        .eq('id', id)
        .single()

      if (comanda?.status !== 'ABERTA') {
        return {
          data: false,
          error: 'Apenas comandas abertas podem ser excluídas'
        }
      }

      const { error } = await this.supabase
        .from('comanda')
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

  async finalizarComanda(
    id: string, 
    dadosPagamento: FinalizarComandaData
  ): Promise<ServiceResponse<ComandaComDetalhes>> {
    try {
      // Buscar comanda com itens para cálculos
      const { data: comanda, error: comandaError } = await this.getById(id)
      
      if (comandaError || !comanda) {
        return { data: null, error: comandaError || 'Comanda não encontrada' }
      }

      if (comanda.status !== 'ABERTA') {
        return { data: null, error: 'Apenas comandas abertas podem ser finalizadas' }
      }

      // Calcular totais
      const valorTotalServicos = comanda.itens
        ?.filter(item => item.id_servico)
        .reduce((total, item) => total + item.preco_total_item, 0) || 0

      const valorTotalProdutos = comanda.itens
        ?.filter(item => item.id_produto)
        .reduce((total, item) => total + item.preco_total_item, 0) || 0

      const valorDesconto = dadosPagamento.valor_desconto || 0
      const valorTotalPago = valorTotalServicos + valorTotalProdutos - valorDesconto

      // Atualizar comanda
      const { data: comandaAtualizada, error: updateError } = await this.supabase
        .from('comanda')
        .update({
          status: 'FECHADA' as StatusComanda,
          data_fechamento: new Date().toISOString(),
          valor_total_servicos: valorTotalServicos,
          valor_total_produtos: valorTotalProdutos,
          valor_desconto: valorDesconto,
          valor_total_pago: valorTotalPago,
          metodo_pagamento: dadosPagamento.metodo_pagamento,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        return { data: null, error: this.handleError(updateError) }
      }

      // Buscar caixa ativo para criar movimentação
      if (valorTotalPago > 0) {
        const { data: caixaAtivo } = await this.supabase
          .from('caixa')
          .select('id')
          .eq('id_empresa', comanda.id_empresa || 'empresa-default')
          .eq('status', 'ABERTO')
          .single()
        
        if (caixaAtivo) {
          // Criar movimentação no caixa (entrada pela venda)
          await this.supabase
            .from('movimentacao_caixa')
            .insert([{
              id_caixa: caixaAtivo.id,
              id_comanda: id,
              valor: valorTotalPago,
              descricao: `Venda - Comanda #${id.substring(0, 8)}`,
              id_profissional_responsavel: comanda.id_profissional_responsavel,
              criado_em: new Date().toISOString()
            }])
        } else {
          console.warn('Nenhum caixa ativo encontrado para registrar a venda')
        }
      }

      // Atualizar estoque dos produtos vendidos
      for (const item of comanda.itens || []) {
        if (item.id_produto && item.produto) {
          const novoEstoque = item.produto.estoque_atual - item.quantidade
          
          if (novoEstoque < 0) {
            console.warn(`Estoque negativo para produto ${item.produto.nome}`)
          }

          await this.supabase
            .from('produto')
            .update({
              estoque_atual: novoEstoque,
              atualizado_em: new Date().toISOString()
            })
            .eq('id', item.id_produto)
        }
      }

      // Retornar comanda atualizada
      return this.getById(id)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async cancelarComanda(id: string, motivo?: string): Promise<ServiceResponse<Comanda>> {
    try {
      const { data: comanda } = await this.supabase
        .from('comanda')
        .select('status')
        .eq('id', id)
        .single()

      if (comanda?.status !== 'ABERTA') {
        return {
          data: null,
          error: 'Apenas comandas abertas podem ser canceladas'
        }
      }

      const query = this.supabase
        .from('comanda')
        .update({
          status: 'CANCELADA' as StatusComanda,
          atualizado_em: new Date().toISOString()
        })
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

  // Buscar comandas abertas para o profissional
  async getComandasAbertas(idProfissional?: string): Promise<ServiceResponse<ComandaComDetalhes[]>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('comanda')
        .select(`
          *,
          cliente:id_cliente(id, nome, telefone),
          profissional_responsavel:id_profissional_responsavel(
            id, 
            usuario:id_usuario(nome)
          ),
          itens:item_comanda(
            id,
            quantidade,
            preco_total_item,
            servico:id_servico(nome),
            produto:id_produto(nome)
          )
        `)
        .eq('id_empresa', empresaId)
        .eq('status', 'ABERTA')
        .order('data_abertura', { ascending: false })

      if (idProfissional) {
        query = query.eq('id_profissional_responsavel', idProfissional)
      }

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  // Estatísticas
  async getEstatisticas(periodo?: { inicio: string; fim: string }): Promise<ServiceResponse<{
    totalComandas: number
    comandasAbertas: number
    comandasFechadas: number
    comandasCanceladas: number
    faturamentoTotal: number
    ticketMedio: number
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('comanda')
        .select('status, valor_total_pago')
        .eq('id_empresa', empresaId)

      if (periodo) {
        query = query
          .gte('data_abertura', periodo.inicio)
          .lte('data_abertura', periodo.fim)
      }

      const { data: comandas, error } = await query

      if (error) {
        return { data: null, error: this.handleError(error) }
      }

      const stats = comandas?.reduce((acc, comanda) => {
        acc.totalComandas++
        
        switch (comanda.status) {
          case 'ABERTA':
            acc.comandasAbertas++
            break
          case 'FECHADA':
            acc.comandasFechadas++
            acc.faturamentoTotal += comanda.valor_total_pago || 0
            break
          case 'CANCELADA':
            acc.comandasCanceladas++
            break
        }
        
        return acc
      }, {
        totalComandas: 0,
        comandasAbertas: 0,
        comandasFechadas: 0,
        comandasCanceladas: 0,
        faturamentoTotal: 0
      }) || {
        totalComandas: 0,
        comandasAbertas: 0,
        comandasFechadas: 0,
        comandasCanceladas: 0,
        faturamentoTotal: 0
      }

      return {
        data: {
          ...stats,
          ticketMedio: stats.comandasFechadas > 0 
            ? stats.faturamentoTotal / stats.comandasFechadas 
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

const comandasService = new ComandasService()
export default comandasService 