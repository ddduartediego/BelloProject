// Tipos base
export type UUID = string
export type Timestamp = string

// Enums
export type TipoUsuario = 'ADMINISTRADOR' | 'PROFISSIONAL'
export type StatusAgendamento = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO'
export type StatusComanda = 'ABERTA' | 'FECHADA' | 'CANCELADA'
export type StatusCaixa = 'ABERTO' | 'FECHADO'
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'SANGRIA' | 'REFORCO'
export type MetodoPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'OUTRO'

// Tabelas do banco de dados
export interface Empresa {
  id: UUID
  nome_fantasia: string
  razao_social: string
  cnpj: string
  telefone: string
  endereco: string
  logo_url?: string
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Usuario {
  id: UUID // Referencia o ID do Supabase Auth
  email: string
  nome_completo: string
  tipo_usuario: TipoUsuario
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Cliente {
  id: UUID
  nome: string
  telefone: string
  email?: string
  data_nascimento?: string
  observacoes?: string
  id_empresa: UUID
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Profissional {
  id: UUID
  id_usuario: UUID
  id_empresa: UUID
  especialidades?: string[]
  horarios_trabalho?: Record<string, string[]> // Ex: { "seg": ["09:00-12:00", "14:00-18:00"] }
  google_calendar_id?: string
  google_auth_tokens?: Record<string, unknown> // Criptografado
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Servico {
  id: UUID
  id_empresa: UUID
  nome: string
  descricao?: string
  duracao_estimada_minutos: number
  preco: number
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Produto {
  id: UUID
  id_empresa: UUID
  nome: string
  descricao?: string
  preco_custo?: number
  preco_venda: number
  estoque_atual: number
  estoque_minimo?: number
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Agendamento {
  id: UUID
  id_cliente: UUID
  id_profissional: UUID
  id_empresa: UUID
  data_hora_inicio: Timestamp
  data_hora_fim: Timestamp
  observacoes?: string
  status: StatusAgendamento
  google_event_id?: string
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface AgendamentoServico {
  id_agendamento: UUID
  id_servico: UUID
  preco_cobrado_servico: number
}

export interface Caixa {
  id: UUID
  id_empresa: UUID
  id_profissional_abertura?: UUID
  id_profissional_fechamento?: UUID
  data_abertura: Timestamp
  data_fechamento?: Timestamp
  saldo_inicial: number
  saldo_final_calculado?: number
  saldo_final_informado?: number
  observacoes?: string
  status: StatusCaixa
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface Comanda {
  id: UUID
  id_cliente?: UUID
  nome_cliente_avulso?: string
  id_profissional_responsavel: UUID
  id_caixa: UUID
  id_empresa: UUID
  data_abertura: Timestamp
  data_fechamento?: Timestamp
  valor_total_servicos: number
  valor_total_produtos: number
  valor_desconto: number
  valor_total_pago: number
  metodo_pagamento?: MetodoPagamento
  status: StatusComanda
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface ItemComanda {
  id: UUID
  id_comanda: UUID
  id_servico?: UUID
  id_produto?: UUID
  nome_servico_avulso?: string
  descricao_servico_avulso?: string
  quantidade: number
  preco_unitario_registrado: number
  preco_total_item: number
  id_profissional_executante?: UUID
  criado_em: Timestamp
  atualizado_em: Timestamp
}

export interface MovimentacaoCaixa {
  id: UUID
  id_caixa: UUID
  id_comanda?: UUID
  tipo_movimentacao: TipoMovimentacao
  valor: number
  descricao: string
  id_profissional_responsavel?: UUID
  data_movimentacao: Timestamp
  criado_em: Timestamp
}

// Tipos para requests/responses da API
export interface CreateEmpresaRequest {
  nome_fantasia: string
  razao_social: string
  cnpj: string
  telefone: string
  endereco: string
  logo_url?: string
}

export interface CreateUsuarioRequest {
  email: string
  nome_completo: string
  tipo_usuario: TipoUsuario
  senha: string
}

export interface CreateClienteRequest {
  nome: string
  telefone: string
  email?: string
  data_nascimento?: string
  observacoes?: string
  id_empresa: UUID
}

// Tipos com relacionamentos para exibição
export interface AgendamentoComDetalhes extends Agendamento {
  cliente: Cliente
  profissional: Profissional & { usuario: Usuario }
  servicos: (AgendamentoServico & { servico: Servico })[]
}

export interface ComandaComDetalhes extends Comanda {
  cliente?: Cliente
  profissional_responsavel: Profissional
  caixa: Caixa
  itens: (ItemComanda & { 
    servico?: Servico
    produto?: Produto 
    profissional_executante?: Profissional
  })[]
}

export interface MovimentacaoCaixaComDetalhes extends MovimentacaoCaixa {
  comanda?: {
    id: string
    cliente?: Cliente
    nome_cliente_avulso?: string
  }
  caixa?: Caixa
  profissional_responsavel?: Profissional & { usuario: Usuario }
} 