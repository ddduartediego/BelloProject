import { StatusCaixa } from './database'

export interface CaixaFiltro {
  id: string
  data_abertura: string
  status: StatusCaixa
  saldo_final_calculado?: number
  label: string
} 