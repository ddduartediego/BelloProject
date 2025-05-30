import { BaseService, ServiceResponse } from './base.service'
import { Caixa, StatusCaixa } from '@/types/database'
import empresaService from './empresa.service'

export interface CreateCaixaData {
  saldo_inicial: number
  observacoes_abertura?: string
}

export interface FecharCaixaData {
  saldo_final_declarado: number
  observacoes_fechamento?: string
}

export interface CaixaComMovimentacoes extends Caixa {
  movimentacoes?: Array<{
    id: string
    tipo_movimentacao: string
    valor: number
    descricao: string
    data_movimentacao: string
    id_comanda?: string
  }>
  total_entradas?: number
  total_saidas?: number
  saldo_calculado?: number
  saldo_final_declarado?: number
}

class CaixaService extends BaseService {

  async getCaixaAtivo(empresaId?: string): Promise<ServiceResponse<Caixa | null>> {
    try {
      const idEmpresa = empresaId || await empresaService.getEmpresaAtualId()
      if (!idEmpresa) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      const { data: caixa, error } = await this.supabase
        .from('caixa')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .eq('status', 'ABERTO')
        .order('data_abertura', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        return { data: null, error: this.handleError(error) }
      }

      return { data: caixa, error: null }
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getById(id: string): Promise<ServiceResponse<CaixaComMovimentacoes>> {
    const query = this.supabase
      .from('caixa')
      .select(`
        *,
        movimentacoes:movimentacao_caixa(
          id,
          tipo_movimentacao,
          valor,
          descricao,
          data_movimentacao,
          id_comanda,
          profissional_responsavel:id_profissional_responsavel(
            id,
            usuario:id_usuario(nome)
          )
        )
      `)
      .eq('id', id)
      .single()

    return this.handleRequest(query)
  }

  async abrir(data: CreateCaixaData): Promise<ServiceResponse<Caixa>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      // Verificar se já existe caixa aberto
      const { data: caixaExistente } = await this.getCaixaAtivo(empresaId)
      if (caixaExistente) {
        return {
          data: null,
          error: 'Já existe um caixa aberto. Feche o caixa atual antes de abrir um novo.'
        }
      }

      const caixaData = {
        id_empresa: empresaId,
        data_abertura: new Date().toISOString(),
        saldo_inicial: data.saldo_inicial,
        status: 'ABERTO' as StatusCaixa,
        observacoes_abertura: data.observacoes_abertura,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }

      const query = this.supabase
        .from('caixa')
        .insert([caixaData])
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

  async fechar(id: string, dados: FecharCaixaData): Promise<ServiceResponse<CaixaComMovimentacoes>> {
    try {
      // Buscar caixa com movimentações para calcular totais
      const { data: caixa, error: caixaError } = await this.getById(id)
      
      if (caixaError || !caixa) {
        return { data: null, error: caixaError || 'Caixa não encontrado' }
      }

      if (caixa.status !== 'ABERTO') {
        return { data: null, error: 'Apenas caixas abertos podem ser fechados' }
      }

      // Calcular totais de movimentações
      const totalEntradas = caixa.movimentacoes
        ?.filter(mov => mov.tipo_movimentacao === 'ENTRADA' || mov.tipo_movimentacao === 'REFORCO')
        .reduce((total, mov) => total + mov.valor, 0) || 0

      const totalSaidas = caixa.movimentacoes
        ?.filter(mov => mov.tipo_movimentacao === 'SAIDA' || mov.tipo_movimentacao === 'SANGRIA')
        .reduce((total, mov) => total + mov.valor, 0) || 0

      const saldoCalculado = caixa.saldo_inicial + totalEntradas - totalSaidas
      const diferenca = dados.saldo_final_declarado - saldoCalculado

      // Atualizar caixa
      const { data: caixaFechado, error: updateError } = await this.supabase
        .from('caixa')
        .update({
          status: 'FECHADO' as StatusCaixa,
          data_fechamento: new Date().toISOString(),
          saldo_final_declarado: dados.saldo_final_declarado,
          saldo_final_calculado: saldoCalculado,
          diferenca: diferenca,
          observacoes_fechamento: dados.observacoes_fechamento,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        return { data: null, error: this.handleError(updateError) }
      }

      // Retornar caixa com movimentações
      return this.getById(id)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getHistorico(
    periodo?: { inicio: string; fim: string },
    empresaId?: string
  ): Promise<ServiceResponse<Caixa[]>> {
    try {
      const idEmpresa = empresaId || await empresaService.getEmpresaAtualId()
      if (!idEmpresa) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('caixa')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .order('data_abertura', { ascending: false })

      if (periodo) {
        query = query
          .gte('data_abertura', periodo.inicio)
          .lte('data_abertura', periodo.fim)
      }

      return this.handleRequest(query)
    } catch (err) {
      return {
        data: null,
        error: this.handleError(err as Error)
      }
    }
  }

  async getRelatorioFechamento(id: string): Promise<ServiceResponse<{
    caixa: CaixaComMovimentacoes
    resumo: {
      saldo_inicial: number
      total_entradas: number
      total_saidas: number
      saldo_calculado: number
      saldo_declarado: number
      diferenca: number
    }
    movimentacoes_por_tipo: {
      vendas: { quantidade: number; valor: number }
      reforcos: { quantidade: number; valor: number }
      sangrias: { quantidade: number; valor: number }
      outras_saidas: { quantidade: number; valor: number }
    }
  }>> {
    try {
      const { data: caixa, error } = await this.getById(id)
      
      if (error || !caixa) {
        return { data: null, error: error || 'Caixa não encontrado' }
      }

      // Calcular totais
      const movimentacoes = caixa.movimentacoes || []
      
      const vendas = movimentacoes.filter(mov => 
        mov.tipo_movimentacao === 'ENTRADA' && mov.id_comanda
      )
      
      const reforcos = movimentacoes.filter(mov => 
        mov.tipo_movimentacao === 'REFORCO'
      )
      
      const sangrias = movimentacoes.filter(mov => 
        mov.tipo_movimentacao === 'SANGRIA'
      )
      
      const outrasSaidas = movimentacoes.filter(mov => 
        mov.tipo_movimentacao === 'SAIDA'
      )

      const totalEntradas = [...vendas, ...reforcos].reduce((total, mov) => total + mov.valor, 0)
      const totalSaidas = [...sangrias, ...outrasSaidas].reduce((total, mov) => total + mov.valor, 0)
      const saldoCalculado = caixa.saldo_inicial + totalEntradas - totalSaidas

      return {
        data: {
          caixa,
          resumo: {
            saldo_inicial: caixa.saldo_inicial,
            total_entradas: totalEntradas,
            total_saidas: totalSaidas,
            saldo_calculado: saldoCalculado,
            saldo_declarado: caixa.saldo_final_declarado || 0,
            diferenca: (caixa.saldo_final_declarado || 0) - saldoCalculado
          },
          movimentacoes_por_tipo: {
            vendas: {
              quantidade: vendas.length,
              valor: vendas.reduce((total, mov) => total + mov.valor, 0)
            },
            reforcos: {
              quantidade: reforcos.length,
              valor: reforcos.reduce((total, mov) => total + mov.valor, 0)
            },
            sangrias: {
              quantidade: sangrias.length,
              valor: sangrias.reduce((total, mov) => total + mov.valor, 0)
            },
            outras_saidas: {
              quantidade: outrasSaidas.length,
              valor: outrasSaidas.reduce((total, mov) => total + mov.valor, 0)
            }
          }
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

  // Estatísticas gerais
  async getEstatisticas(periodo?: { inicio: string; fim: string }): Promise<ServiceResponse<{
    total_caixas: number
    caixas_abertos: number
    caixas_fechados: number
    total_faturamento: number
    media_diaria: number
    maior_diferenca: number
    menor_diferenca: number
  }>> {
    try {
      const empresaId = await empresaService.getEmpresaAtualId()
      if (!empresaId) {
        return { data: null, error: 'Empresa não encontrada' }
      }

      let query = this.supabase
        .from('caixa')
        .select('status, saldo_final_calculado, diferenca')
        .eq('id_empresa', empresaId)

      if (periodo) {
        query = query
          .gte('data_abertura', periodo.inicio)
          .lte('data_abertura', periodo.fim)
      }

      const { data: caixas, error } = await query

      if (error) {
        return { data: null, error: this.handleError(error) }
      }

      const stats = caixas?.reduce((acc, caixa) => {
        acc.total_caixas++
        
        if (caixa.status === 'ABERTO') {
          acc.caixas_abertos++
        } else {
          acc.caixas_fechados++
          acc.total_faturamento += caixa.saldo_final_calculado || 0
          
          if (caixa.diferenca !== null) {
            acc.maior_diferenca = Math.max(acc.maior_diferenca, caixa.diferenca)
            acc.menor_diferenca = Math.min(acc.menor_diferenca, caixa.diferenca)
          }
        }
        
        return acc
      }, {
        total_caixas: 0,
        caixas_abertos: 0,
        caixas_fechados: 0,
        total_faturamento: 0,
        maior_diferenca: 0,
        menor_diferenca: 0
      }) || {
        total_caixas: 0,
        caixas_abertos: 0,
        caixas_fechados: 0,
        total_faturamento: 0,
        maior_diferenca: 0,
        menor_diferenca: 0
      }

      return {
        data: {
          ...stats,
          media_diaria: stats.caixas_fechados > 0 
            ? stats.total_faturamento / stats.caixas_fechados 
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

const caixaService = new CaixaService()
export default caixaService 