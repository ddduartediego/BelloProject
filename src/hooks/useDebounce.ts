import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook para debounce de valores, evitando execuções excessivas
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce de callbacks, útil para otimizar funções
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook específico para debounce de filtros do dashboard
 */
export function useDashboardDebounce<T>(
  filters: T,
  onFiltersChange: (filters: T) => void,
  delay: number = 500
) {
  const debouncedFilters = useDebounce(filters, delay)
  const previousFiltersRef = useRef<T>(filters)

  useEffect(() => {
    // Só executar se os filtros realmente mudaram
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(previousFiltersRef.current)) {
      onFiltersChange(debouncedFilters)
      previousFiltersRef.current = debouncedFilters
    }
  }, [debouncedFilters, onFiltersChange])

  return debouncedFilters
}

export default useDebounce 