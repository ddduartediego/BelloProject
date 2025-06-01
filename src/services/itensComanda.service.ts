import { BaseService, ServiceResponse } from './base.service'
import { ItemComanda } from '@/types/database'

export interface CreateItemComandaData {
  id_comanda: string
  id_servico?: string
  id_produto?: string
  nome_servico_avulso?: string
  preco_unitario?: number
  quantidade: number
  id_profissional_executante?: string
}

export interface UpdateItemComandaData extends Partial<CreateItemComandaData> {
  id: string
}

class ItensComandaService extends BaseService {

  async getByComanda(comandaId: string): Promise<ServiceResponse<ItemComanda[]>> {
    const query = this.supabase
      .from('item_comanda')
      .select(`
        *,
        servico:id_servico(id, nome, preco, duracao_estimada_minutos),
        produto:id_produto(id, nome, preco_venda, estoque_atual),
        profissional_executante:id_profissional_executante(
          id,
          usuario:id_usuario(nome_completo)
        )
      `)
      .eq('id_comanda', comandaId)
      .order('criado_em')

    return this.handleRequest(query)
  }

  async create(data: CreateItemComandaData): Promise<ServiceResponse<ItemComanda>> {
    try {
      // Determinar tipo de item e validar
      const isServicoAvulso = !!data.nome_servico_avulso
      const isServicoCadastrado = !!data.id_servico
      const isProduto = !!data.id_produto
      
      // Validar que é apenas um tipo
      const tiposCount = [isServicoAvulso, isServicoCadastrado, isProduto].filter(Boolean).length
      if (tiposCount !== 1) {
        return {
          data: null,
          error: 'Item deve ser um serviço cadastrado, produto ou serviço avulso'
        }
      }

      let precoUnitario = 0
      
      // Se for produto, validar estoque e buscar preço
      if (isProduto) {
        const { data: produto, error: produtoError } = await this.supabase
          .from('produto')
          .select('preco_venda, estoque_atual')
          .eq('id', data.id_produto)
          .single()

        if (produtoError || !produto) {
          return {
            data: null,
            error: 'Produto não encontrado'
          }
        }

        if (produto.estoque_atual < data.quantidade) {
          return {
            data: null,
            error: `Estoque insuficiente. Disponível: ${produto.estoque_atual}`
          }
        }

        precoUnitario = produto.preco_venda
      }

      // Se for serviço cadastrado, buscar preço
      if (isServicoCadastrado) {
        const { data: servico, error: servicoError } = await this.supabase
          .from('servico')
          .select('preco')
          .eq('id', data.id_servico)
          .single()

        if (servicoError || !servico) {
          return {
            data: null,
            error: 'Serviço não encontrado'
          }
        }

        precoUnitario = servico.preco
      }

      // Se for serviço avulso, usar preço fornecido
      if (isServicoAvulso) {
        if (!data.preco_unitario || data.preco_unitario <= 0) {
          return {
            data: null,
            error: 'Preço avulso inválido'
          }
        }
        precoUnitario = data.preco_unitario
      }

      const itemData = {
        id_comanda: data.id_comanda,
        id_servico: data.id_servico || null,
        id_produto: data.id_produto || null,
        nome_servico_avulso: data.nome_servico_avulso || null,
        descricao_servico_avulso: data.nome_servico_avulso ? 'Serviço avulso' : null,
        quantidade: data.quantidade,
        id_profissional_executante: data.id_profissional_executante || null,
        preco_unitario_registrado: precoUnitario,
        preco_total_item: precoUnitario * data.quantidade,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('item_comanda')
        .insert([itemData])
        .select(`
          *,
          servico:id_servico(id, nome, preco),
          produto:id_produto(id, nome, preco_venda),
          profissional_executante:id_profissional_executante(
            id,
            usuario:id_usuario(nome_completo)
          )
        `)
        .single()

      const result = await this.handleRequest(query)
      
      // Se item foi criado com sucesso, atualizar totais da comanda
      if (result.data) {
        await this.atualizarTotaisComanda(data.id_comanda)
      }

      return result as ServiceResponse<ItemComanda>
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async update(data: UpdateItemComandaData): Promise<ServiceResponse<ItemComanda>> {
    try {
      const { id, id_comanda, ...updateData } = data

      // Buscar item atual para validações
      const { data: itemAtual } = await this.supabase
        .from('item_comanda')
        .select('*, produto:id_produto(estoque_atual)')
        .eq('id', id)
        .single()

      if (!itemAtual) {
        return {
          data: null,
          error: 'Item não encontrado'
        }
      }

      // Se alterando quantidade de produto, validar estoque
      if (itemAtual.id_produto && updateData.quantidade && updateData.quantidade !== itemAtual.quantidade) {
        const estoqueDisponivel = itemAtual.produto?.estoque_atual || 0
        const diferencaQuantidade = updateData.quantidade - itemAtual.quantidade

        if (diferencaQuantidade > 0 && estoqueDisponivel < diferencaQuantidade) {
          return {
            data: null,
            error: `Estoque insuficiente. Disponível: ${estoqueDisponivel}`
          }
        }
      }

      const precoUnitario = itemAtual.preco_unitario_registrado
      const novaQuantidade = updateData.quantidade || itemAtual.quantidade

      const itemData = {
        ...updateData,
        preco_total_item: precoUnitario * novaQuantidade,
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('item_comanda')
        .update(itemData)
        .eq('id', id)
        .select(`
          *,
          servico:id_servico(id, nome, preco),
          produto:id_produto(id, nome, preco_venda),
          profissional_executante:id_profissional_executante(
            id,
            usuario:id_usuario(nome_completo)
          )
        `)
        .single()

      const result = await this.handleRequest(query)

      // Atualizar totais da comanda
      if (result.data) {
        await this.atualizarTotaisComanda(itemAtual.id_comanda)
      }

      return result as ServiceResponse<ItemComanda>
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Buscar item para obter id_comanda
      const { data: item } = await this.supabase
        .from('item_comanda')
        .select('id_comanda')
        .eq('id', id)
        .single()

      if (!item) {
        return {
          data: false,
          error: 'Item não encontrado'
        }
      }

      const { error } = await this.supabase
        .from('item_comanda')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          data: false,
          error: this.handleError(error)
        }
      }

      // Atualizar totais da comanda
      await this.atualizarTotaisComanda(item.id_comanda)

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

  // Atualizar totais da comanda baseado nos itens
  private async atualizarTotaisComanda(comandaId: string): Promise<void> {
    try {
      // Buscar todos os itens da comanda
      const { data: itens } = await this.supabase
        .from('item_comanda')
        .select('id_servico, id_produto, preco_total_item')
        .eq('id_comanda', comandaId)

      if (!itens) return

      // Calcular totais
      const valorTotalServicos = itens
        .filter(item => item.id_servico)
        .reduce((total, item) => total + item.preco_total_item, 0)

      const valorTotalProdutos = itens
        .filter(item => item.id_produto)
        .reduce((total, item) => total + item.preco_total_item, 0)

      // Atualizar comanda
      await this.supabase
        .from('comanda')
        .update({
          valor_total_servicos: valorTotalServicos,
          valor_total_produtos: valorTotalProdutos,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', comandaId)

    } catch (err) {
      console.error('Erro ao atualizar totais da comanda:', err)
    }
  }

  // Validar disponibilidade de produto
  async validarDisponibilidadeProduto(produtoId: string, quantidade: number): Promise<ServiceResponse<boolean>> {
    try {
      const { data: produto, error } = await this.supabase
        .from('produto')
        .select('estoque_atual, nome')
        .eq('id', produtoId)
        .single()

      if (error || !produto) {
        return {
          data: false,
          error: 'Produto não encontrado'
        }
      }

      if (produto.estoque_atual < quantidade) {
        return {
          data: false,
          error: `Estoque insuficiente de "${produto.nome}". Disponível: ${produto.estoque_atual}`
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

  // Duplicar item (útil para adicionar o mesmo item várias vezes)
  async duplicarItem(itemId: string, novaQuantidade?: number): Promise<ServiceResponse<ItemComanda>> {
    try {
      const { data: itemOriginal, error } = await this.supabase
        .from('item_comanda')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error || !itemOriginal) {
        return {
          data: null,
          error: 'Item não encontrado'
        }
      }

      const novoItem = {
        id_comanda: itemOriginal.id_comanda,
        id_servico: itemOriginal.id_servico,
        id_produto: itemOriginal.id_produto,
        quantidade: novaQuantidade || itemOriginal.quantidade,
        id_profissional_executante: itemOriginal.id_profissional_executante
      }

      return this.create(novoItem)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }
}

const itensComandaService = new ItensComandaService()
export default itensComandaService 