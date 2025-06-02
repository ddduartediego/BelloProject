import { useState, useEffect } from 'react'
import { caixaService } from '@/services'
import { CaixaFiltro } from '@/types/filtros'

export function useCaixas() {
  const [caixas, setCaixas] = useState<CaixaFiltro[]>([])
  const [caixaSelecionado, setCaixaSelecionado] = useState<CaixaFiltro | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar caixas para filtro
  const carregarCaixas = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: caixasData, error: caixasError } = await caixaService.getCaixasParaFiltro()
      if (caixasError) {
        setError(caixasError)
        return
      }

      setCaixas(caixasData || [])

      // Encontrar caixa aberto ou mais recente para seleção inicial
      const caixaAberto = caixasData?.find((c: CaixaFiltro) => c.status === 'ABERTO')
      const maisRecente = caixasData?.[0] // Já ordenado por data DESC
      
      // Prioridade: caixa aberto > mais recente > null
      const caixaInicial = caixaAberto || maisRecente || null
      setCaixaSelecionado(caixaInicial)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar caixas')
    } finally {
      setLoading(false)
    }
  }

  // Recarregar quando necessário
  useEffect(() => {
    carregarCaixas()
  }, [])

  return {
    caixas,
    caixaSelecionado,
    setCaixaSelecionado,
    loading,
    error,
    recarregar: carregarCaixas
  }
} 