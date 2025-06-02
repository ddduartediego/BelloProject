import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardMetrics } from './useDashboardMetrics'

interface CacheEntry {
  data: DashboardMetrics
  timestamp: number
  filters?: any
  periodoAtual?: any
  periodoComparacao?: any
}

interface CacheConfig {
  maxAge: number // tempo em milissegundos
  maxSize: number // número máximo de entradas
}

const defaultConfig: CacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutos
  maxSize: 50 // máximo 50 entradas em cache
}

export interface UseDashboardCacheReturn {
  getCachedData: (key: string) => DashboardMetrics | null
  setCachedData: (key: string, data: DashboardMetrics, metadata?: any) => void
  invalidateCache: (pattern?: string) => void
  clearCache: () => void
  getCacheStats: () => {
    size: number
    hits: number
    misses: number
    hitRate: number
  }
  isDataStale: (key: string) => boolean
}

export function useDashboardCache(config: Partial<CacheConfig> = {}): UseDashboardCacheReturn {
  const cacheConfig = { ...defaultConfig, ...config }
  const cache = useRef<Map<string, CacheEntry>>(new Map())
  const stats = useRef({ hits: 0, misses: 0 })

  // Função para gerar chave de cache baseada nos filtros
  const generateCacheKey = useCallback((filters?: any, periodoAtual?: any, periodoComparacao?: any) => {
    const keyParts = [
      filters?.periodoPreset || 'default',
      filters?.profissionalSelecionado || 'all',
      filters?.clienteSelecionado || 'all',
      filters?.tipoMetrica || 'todas',
      periodoAtual?.inicio?.toISOString() || '',
      periodoAtual?.fim?.toISOString() || '',
      periodoComparacao?.inicio?.toISOString() || '',
      filters?.exibirComparacao ? 'comp' : 'nocomp'
    ]
    return keyParts.join('|')
  }, [])

  // Função para limpar entradas expiradas
  const cleanExpiredEntries = useCallback(() => {
    const now = Date.now()
    const expiredKeys: string[] = []

    cache.current.forEach((entry, key) => {
      if (now - entry.timestamp > cacheConfig.maxAge) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => cache.current.delete(key))
  }, [cacheConfig.maxAge])

  // Função para remover entradas mais antigas quando atingir o limite
  const evictOldestEntries = useCallback(() => {
    if (cache.current.size <= cacheConfig.maxSize) return

    const entries = Array.from(cache.current.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toRemove = entries.slice(0, cache.current.size - cacheConfig.maxSize + 1)
    toRemove.forEach(([key]) => cache.current.delete(key))
  }, [cacheConfig.maxSize])

  // Limpar cache periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredEntries()
    }, 60 * 1000) // limpar a cada 1 minuto

    return () => clearInterval(interval)
  }, [cleanExpiredEntries])

  const getCachedData = useCallback((key: string): DashboardMetrics | null => {
    const entry = cache.current.get(key)
    
    if (!entry) {
      stats.current.misses++
      return null
    }

    // Verificar se dados estão expirados
    if (Date.now() - entry.timestamp > cacheConfig.maxAge) {
      cache.current.delete(key)
      stats.current.misses++
      return null
    }

    stats.current.hits++
    return entry.data
  }, [cacheConfig.maxAge])

  const setCachedData = useCallback((
    key: string, 
    data: DashboardMetrics, 
    metadata?: any
  ) => {
    cleanExpiredEntries()
    evictOldestEntries()

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ...metadata
    }

    cache.current.set(key, entry)
  }, [cleanExpiredEntries, evictOldestEntries])

  const invalidateCache = useCallback((pattern?: string) => {
    if (!pattern) {
      cache.current.clear()
      return
    }

    // Invalidar entradas que correspondem ao padrão
    const keysToDelete: string[] = []
    cache.current.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => cache.current.delete(key))
  }, [])

  const clearCache = useCallback(() => {
    cache.current.clear()
    stats.current = { hits: 0, misses: 0 }
  }, [])

  const getCacheStats = useCallback(() => {
    const totalRequests = stats.current.hits + stats.current.misses
    return {
      size: cache.current.size,
      hits: stats.current.hits,
      misses: stats.current.misses,
      hitRate: totalRequests > 0 ? (stats.current.hits / totalRequests) * 100 : 0
    }
  }, [])

  const isDataStale = useCallback((key: string): boolean => {
    const entry = cache.current.get(key)
    if (!entry) return true
    
    return Date.now() - entry.timestamp > cacheConfig.maxAge
  }, [cacheConfig.maxAge])

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    clearCache,
    getCacheStats,
    isDataStale,
    generateCacheKey
  } as UseDashboardCacheReturn & { generateCacheKey: typeof generateCacheKey }
}

export default useDashboardCache 