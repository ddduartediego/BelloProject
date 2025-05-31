import { BaseService, ServiceResponse, PaginationParams, PaginatedResponse } from './base.service'
import { Comanda, ComandaComDetalhes, StatusComanda, MetodoPagamento } from '@/types/database'
import empresaService from './empresa.service'
import movimentacoesCaixaService from './movimentacoesCaixa.service'

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
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Query para buscar comandas com relacionamentos
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
            especialidades,
            usuario_responsavel:id_usuario(nome_completo, email)
          )
        `, { count: 'exact' })
        .eq('id_empresa', empresaId)

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

      const result = await this.handlePaginatedRequest(query, pagination) as ServiceResponse<PaginatedResponse<ComandaComDetalhes>>
      
      return result
    } catch (err) {
      console.error('Erro ao buscar comandas:', err)
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getById(id: string): Promise<ServiceResponse<ComandaComDetalhes>> {
    const query = this.supabase
      .from('comanda')
      .select(`
        *,
        cliente:id_cliente(id, nome, telefone, email),
        profissional_responsavel:id_profissional_responsavel(
          id, 
          id_usuario, 
          especialidades,
          usuario_responsavel:id_usuario(nome_completo, email)
        ),
        caixa:id_caixa(id, data_abertura, saldo_inicial, status),
        itens:item_comanda(
          id,
          id_servico,
          id_produto, 
          nome_servico_avulso,
          descricao_servico_avulso,
          quantidade,
          preco_unitario_registrado,
          preco_total_item,
          id_profissional_executante,
          servico:id_servico(id, nome, preco, duracao_estimada_minutos),
          produto:id_produto(id, nome, preco_venda, estoque_atual),
          profissional_executante:id_profissional_executante(
            id,
            usuario_executante:id_usuario(nome_completo)
          )
        )
      `)
      .eq('id', id)
      .single()

    const result = await this.handleRequest(query) as ServiceResponse<ComandaComDetalhes>
    
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

      // Separar itens dos dados da comanda
      const { itens, ...comandaBaseData } = data
      
      // Calcular totais dos itens
      const valorTotalServicos = itens?.reduce((total, item) => 
        total + (item.preco_unitario * item.quantidade), 0) || 0

      // Dados da comanda
      const comandaData = {
        ...comandaBaseData,
        id_empresa: empresaId,
        id_caixa: caixaAtivo.id,
        data_abertura: new Date().toISOString(),
        valor_total_servicos: valorTotalServicos,
        valor_total_produtos: 0,
        valor_desconto: 0,
        valor_total_pago: valorTotalServicos,
        status: 'ABERTA' as StatusComanda,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      // 1. Criar comanda
      const { data: comandaCriada, error: comandaError } = await this.supabase
        .from('comanda')
        .insert([comandaData])
        .select()
        .single()

      if (comandaError || !comandaCriada) {
        console.error('Erro ao criar comanda:', comandaError)
        return { data: null, error: this.handleError(comandaError) }
      }

      // 2. Criar itens da comanda se existirem
      if (itens && itens.length > 0) {
        // Preparar todos os itens (cadastrados e avulsos)
        const itensData = itens.map((item) => ({
          id_comanda: comandaCriada.id,
          // Serviço cadastrado ou avulso
          id_servico: item.id_servico || null,
          nome_servico_avulso: item.nome_servico_avulso || null,
          descricao_servico_avulso: item.nome_servico_avulso ? 'Serviço avulso' : null,
          // Por enquanto só serviços (produtos virão depois)
          id_produto: null,
          quantidade: item.quantidade,
          preco_unitario_registrado: item.preco_unitario,
          preco_total_item: item.preco_unitario * item.quantidade,
          id_profissional_executante: comandaCriada.id_profissional_responsavel,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }))

        const { error: itensError } = await this.supabase
          .from('item_comanda')
          .insert(itensData)

        if (itensError) {
          console.error('Erro ao criar itens da comanda:', itensError)
          
          // Rollback: deletar comanda criada
          await this.supabase
            .from('comanda')
            .delete()
            .eq('id', comandaCriada.id)
          
          return { data: null, error: `Erro ao criar itens da comanda: ${this.handleError(itensError)}` }
        }
      }

      return { data: comandaCriada, error: null }
    } catch (err) {
      console.error('Erro geral na criação da comanda:', err)
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
        console.error('Erro ao buscar comanda:', comandaError)
        return { data: null, error: comandaError || 'Comanda não encontrada' }
      }

      if (comanda.status !== 'ABERTA') {
        console.error('Status inválido para finalização:', comanda.status)
        return { data: null, error: 'Apenas comandas abertas podem ser finalizadas' }
      }

      // Calcular totais
      const valorTotalServicos = comanda.itens
        ?.filter(item => item.id_servico || item.nome_servico_avulso)
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
        console.error('Erro ao atualizar comanda:', updateError)
        return { data: null, error: this.handleError(updateError) }
      }

      // Buscar caixa ativo para criar movimentação
      if (valorTotalPago > 0) {
        const { data: caixaAtivo, error: caixaError } = await this.supabase
          .from('caixa')
          .select('id, status')
          .eq('id_empresa', comanda.id_empresa || 'empresa-default')
          .eq('status', 'ABERTO')
          .single()
        
        if (caixaAtivo) {
          const { data: movimentacao, error: movError } = await movimentacoesCaixaService.criarEntradaVenda(
            caixaAtivo.id,
            id,
            valorTotalPago,
            `Venda - Comanda #${id.substring(0, 8)} - ${dadosPagamento.metodo_pagamento}`
          )
          
          if (movError) {
            console.error('Erro ao criar movimentação no caixa:', movError)
          }
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

          const { error: estoqueError } = await this.supabase
            .from('produto')
            .update({
              estoque_atual: novoEstoque,
              atualizado_em: new Date().toISOString()
            })
            .eq('id', item.id_produto)
            
          if (estoqueError) {
            console.error('Erro ao atualizar estoque:', estoqueError)
          }
        }
      }

      return this.getById(id)
    } catch (err) {
      console.error('Erro geral na finalização da comanda:', err)
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
            usuario:id_usuario(nome_completo)
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