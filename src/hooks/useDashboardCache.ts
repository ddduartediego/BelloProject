import { useState, useCallback, useRef, useEffect } from 'react'
import { DashboardMetrics } from './useDashboardMetrics'

// ============================================================================
// INTERFACES DE CACHE
// ============================================================================

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number // Time to live em ms
  key: string
  invalidationTags: string[]
}

interface CacheConfig {
  defaultTTL: number // 5 minutos default
  maxEntries: number // Máximo 100 entradas
  enableCompression: boolean
  enablePersistence: boolean
}

interface InvalidationRule {
  tag: string
  dependencies: string[]
  autoInvalidate: boolean
}

// ============================================================================
// HOOK DE CACHE AVANÇADO
// ============================================================================

export function useDashboardCache(config: Partial<CacheConfig> = {}) {
  const cacheConfig: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    maxEntries: 100,
    enableCompression: false,
    enablePersistence: true,
    ...config
  }

  // Estados do cache
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map())
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    invalidations: 0,
    totalRequests: 0
  })

  // Referências para debounce e cleanup
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const invalidationRules = useRef<Map<string, InvalidationRule>>(new Map())

  // ============================================================================
  // FUNÇÕES DE CACHE CORE
  // ============================================================================

  const generateCacheKey = useCallback((
    baseKey: string, 
    params?: Record<string, any>, 
    user?: string
  ): string => {
    const paramsString = params ? JSON.stringify(params) : ''
    const userString = user || 'default'
    return `${baseKey}:${userString}:${btoa(paramsString)}`
  }, [])

  const isExpired = useCallback((entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp > entry.ttl
  }, [])

  const set = useCallback(<T>(
    key: string, 
    data: T, 
    ttl: number = cacheConfig.defaultTTL,
    tags: string[] = []
  ): void => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      invalidationTags: tags
    }

    setCache(prev => {
      const newCache = new Map(prev)
      
      // Limpar cache se exceder máximo
      if (newCache.size >= cacheConfig.maxEntries) {
        const oldestKey = Array.from(newCache.keys())[0]
        newCache.delete(oldestKey)
      }

      newCache.set(key, entry)
      return newCache
    })

    // Persistir se habilitado
    if (cacheConfig.enablePersistence) {
      try {
        localStorage.setItem(`dashboard_cache_${key}`, JSON.stringify(entry))
      } catch (error) {
        console.warn('Erro ao persistir cache:', error)
      }
    }
  }, [cacheConfig.defaultTTL, cacheConfig.maxEntries, cacheConfig.enablePersistence])

  const get = useCallback(<T>(key: string): T | null => {
    setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }))

    const entry = cache.get(key)
    
    if (entry && !isExpired(entry)) {
      setStats(prev => ({ ...prev, hits: prev.hits + 1 }))
      return entry.data as T
    }

    setStats(prev => ({ ...prev, misses: prev.misses + 1 }))

    // Tentar carregar do localStorage se habilitado
    if (cacheConfig.enablePersistence) {
      try {
        const stored = localStorage.getItem(`dashboard_cache_${key}`)
        if (stored) {
          const storedEntry: CacheEntry<T> = JSON.parse(stored)
          if (!isExpired(storedEntry)) {
            set(key, storedEntry.data, storedEntry.ttl, storedEntry.invalidationTags)
            return storedEntry.data
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar cache persistido:', error)
      }
    }

    return null
  }, [cache, isExpired, cacheConfig.enablePersistence, set])

  // ============================================================================
  // SISTEMA DE INVALIDAÇÃO INTELIGENTE
  // ============================================================================

  const addInvalidationRule = useCallback((rule: InvalidationRule) => {
    invalidationRules.current.set(rule.tag, rule)
  }, [])

  const invalidateByTag = useCallback((tag: string, cascade: boolean = true) => {
    setCache(prev => {
      const newCache = new Map(prev)
      let invalidatedCount = 0

      // Invalidar entradas com a tag
      prev.forEach((entry, key) => {
        if (entry.invalidationTags.includes(tag)) {
          newCache.delete(key)
          invalidatedCount++
          
          // Remover do localStorage também
          if (cacheConfig.enablePersistence) {
            try {
              localStorage.removeItem(`dashboard_cache_${key}`)
            } catch (error) {
              console.warn('Erro ao remover cache persistido:', error)
            }
          }
        }
      })

      // Invalidação em cascata baseada nas regras
      if (cascade) {
        invalidationRules.current.forEach((rule, ruleTag) => {
          if (rule.dependencies.includes(tag)) {
            invalidateByTag(ruleTag, false) // Evitar loop infinito
          }
        })
      }

      setStats(prev => ({ ...prev, invalidations: prev.invalidations + invalidatedCount }))
      return newCache
    })
  }, [cacheConfig.enablePersistence])

  const invalidateByPrefix = useCallback((prefix: string) => {
    setCache(prev => {
      const newCache = new Map(prev)
      let invalidatedCount = 0

      prev.forEach((entry, key) => {
        if (key.startsWith(prefix)) {
          newCache.delete(key)
          invalidatedCount++
          
          if (cacheConfig.enablePersistence) {
            try {
              localStorage.removeItem(`dashboard_cache_${key}`)
            } catch (error) {
              console.warn('Erro ao remover cache persistido:', error)
            }
          }
        }
      })

      setStats(prev => ({ ...prev, invalidations: prev.invalidations + invalidatedCount }))
      return newCache
    })
  }, [cacheConfig.enablePersistence])

  // ============================================================================
  // DEBOUNCE AVANÇADO
  // ============================================================================

  const debouncedSet = useCallback(<T>(
    key: string,
    dataFetcher: () => Promise<T>,
    delay: number = 300,
    ttl?: number,
    tags?: string[]
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Limpar timer anterior se existir
      const existingTimer = debounceTimers.current.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Verificar se já tem no cache
      const cached = get<T>(key)
      if (cached) {
        resolve(cached)
        return
      }

      // Criar novo timer debounced
      const timer = setTimeout(async () => {
        try {
          const data = await dataFetcher()
          set(key, data, ttl, tags)
          resolve(data)
        } catch (error) {
          reject(error)
        } finally {
          debounceTimers.current.delete(key)
        }
      }, delay)

      debounceTimers.current.set(key, timer)
    })
  }, [get, set])

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  const clear = useCallback(() => {
    setCache(new Map())
    setStats({ hits: 0, misses: 0, invalidations: 0, totalRequests: 0 })
    
    // Limpar localStorage também
    if (cacheConfig.enablePersistence) {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('dashboard_cache_')) {
            localStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.warn('Erro ao limpar cache persistido:', error)
      }
    }
  }, [cacheConfig.enablePersistence])

  const getStats = useCallback(() => ({
    ...stats,
    hitRate: stats.totalRequests > 0 ? (stats.hits / stats.totalRequests) * 100 : 0,
    size: cache.size
  }), [stats, cache.size])

  const prune = useCallback(() => {
    setCache(prev => {
      const newCache = new Map(prev)
      let prunedCount = 0

      prev.forEach((entry, key) => {
        if (isExpired(entry)) {
          newCache.delete(key)
          prunedCount++
          
          if (cacheConfig.enablePersistence) {
            try {
              localStorage.removeItem(`dashboard_cache_${key}`)
            } catch (error) {
              console.warn('Erro ao remover cache expirado:', error)
            }
          }
        }
      })

      console.log(`Cache: removidas ${prunedCount} entradas expiradas`)
      return newCache
    })
  }, [isExpired, cacheConfig.enablePersistence])

  // ============================================================================
  // SETUP DE REGRAS DE INVALIDAÇÃO
  // ============================================================================

  useEffect(() => {
    // Regras de invalidação para dashboard
    addInvalidationRule({
      tag: 'vendas',
      dependencies: ['comandas', 'caixa'],
      autoInvalidate: true
    })

    addInvalidationRule({
      tag: 'profissionais',
      dependencies: ['vendas', 'agendamentos'],
      autoInvalidate: true
    })

    addInvalidationRule({
      tag: 'alertas',
      dependencies: ['vendas', 'caixa', 'profissionais'],
      autoInvalidate: true
    })

    addInvalidationRule({
      tag: 'comparativos',
      dependencies: ['vendas', 'comandas'],
      autoInvalidate: true
    })

    // Timer de limpeza automática (a cada 10 minutos)
    const pruneInterval = setInterval(prune, 10 * 60 * 1000)

    return () => {
      clearInterval(pruneInterval)
      
      // Limpar todos os timers de debounce
      debounceTimers.current.forEach(timer => clearTimeout(timer))
      debounceTimers.current.clear()
    }
  }, [addInvalidationRule, prune])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Funções principais
    set,
    get,
    clear,
    prune,

    // Invalidação
    invalidateByTag,
    invalidateByPrefix,
    addInvalidationRule,

    // Debounce
    debouncedSet,

    // Utilitários
    generateCacheKey,
    getStats,

    // Estado
    stats: getStats()
  }
}

export default useDashboardCache 