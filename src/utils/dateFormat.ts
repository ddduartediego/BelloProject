/**
 * Utilitários para formatação de datas de forma consistente
 * Resolve problemas de hidratação do Next.js
 */

/**
 * Formata uma data para exibição no formato brasileiro
 * Retorna string vazia durante SSR para evitar hidratação mismatch
 */
export function formatDate(date: string | Date, isClientSide: boolean = true): string {
  if (!isClientSide) return '' // Durante SSR, retorna vazio
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

/**
 * Formata uma data e hora para exibição no formato brasileiro
 * Retorna string vazia durante SSR para evitar hidratação mismatch
 */
export function formatDateTime(date: string | Date, isClientSide: boolean = true): string {
  if (!isClientSide) return '' // Durante SSR, retorna vazio
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

/**
 * Formata apenas a hora para exibição
 * Retorna string vazia durante SSR para evitar hidratação mismatch
 */
export function formatTime(date: string | Date, isClientSide: boolean = true): string {
  if (!isClientSide) return '' // Durante SSR, retorna vazio
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
} 