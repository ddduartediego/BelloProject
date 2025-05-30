import { useEffect, useRef, useCallback } from 'react'

export interface UseAutoRefreshOptions {
  interval?: number // intervalo em ms (padrão: 30 segundos)
  enabled?: boolean // se deve fazer refresh automático
  onRefresh?: () => void // callback para refresh
}

export function useAutoRefresh({
  interval = 30000, // 30 segundos por padrão
  enabled = false,
  onRefresh
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onRefreshRef = useRef(onRefresh)

  // Atualizar ref quando callback muda
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  // Função para iniciar/parar o refresh automático
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      onRefreshRef.current?.()
    }, interval)
  }, [interval])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Controlar o refresh automático baseado no enabled
  useEffect(() => {
    if (enabled && onRefresh) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [enabled, onRefresh, startAutoRefresh, stopAutoRefresh])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopAutoRefresh()
    }
  }, [stopAutoRefresh])

  return {
    startAutoRefresh,
    stopAutoRefresh,
    isRunning: intervalRef.current !== null
  }
}

export default useAutoRefresh 