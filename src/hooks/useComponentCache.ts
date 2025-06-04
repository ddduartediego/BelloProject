// ============================================================================
// HOOK DE CACHE AVANÇADO PARA COMPONENTES PESADOS
// Sistema inteligente com TTL, lazy loading e invalidação cascata
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import React from 'react'

// ============================================================================
// INTERFACES DO SISTEMA DE CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  componentName: string
  dependencies: string[]
  accessCount: number
  lastAccess: number
}

interface CacheConfig {
  defaultTTL: number // 5 minutos
  maxEntries: number // 50 entradas
  enableMetrics: boolean
  persistToStorage: boolean
  compressionEnabled: boolean
}

interface CacheMetrics {
  hits: number
  misses: number
  invalidations: number
  totalRequests: number
  hitRate: number
  avgResponseTime: number
}

interface ComponentCacheOptions {
  ttl?: number
  dependencies?: string[]
  enableLazyLoad?: boolean
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  preload?: boolean
}

// ============================================================================
// CLASSE PRINCIPAL DE CACHE DE COMPONENTES
// ============================================================================

class ComponentCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    totalRequests: 0,
    hitRate: 0,
    avgResponseTime: 0
  }
  private config: CacheConfig
  private cleanupInterval: NodeJS.Timeout | null = null
  private loadingStates = new Map<string, boolean>()
  private pendingRequests = new Map<string, Promise<any>>()

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxEntries: 50,
      enableMetrics: true,
      persistToStorage: true,
      compressionEnabled: false,
      ...config
    }

    // Auto-limpeza a cada minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)

    // Carregar cache persistido
    if (this.config.persistToStorage) {
      this.loadFromStorage()
    }
  }

  /**
   * Buscar dados do cache ou executar função de carregamento
   */
  async get<T>(
    key: string,
    loader: () => Promise<T>,
    options: ComponentCacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now()
    this.metrics.totalRequests++

    // Verificar se está carregando
    if (this.loadingStates.get(key)) {
      // Aguardar requisição pendente
      if (this.pendingRequests.has(key)) {
        return await this.pendingRequests.get(key)
      }
    }

    // Verificar cache existente
    const cached = this.cache.get(key)
    if (cached && this.isValid(cached)) {
      this.metrics.hits++
      cached.accessCount++
      cached.lastAccess = Date.now()
      this.updateMetrics(startTime)
      return cached.data
    }

    // Cache miss - carregar dados
    this.metrics.misses++
    this.loadingStates.set(key, true)

    try {
      // Criar promise para requisição pendente
      const loadPromise = this.loadData(key, loader, options)
      this.pendingRequests.set(key, loadPromise)

      const data = await loadPromise
      this.updateMetrics(startTime)
      return data

    } finally {
      this.loadingStates.delete(key)
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Carregar dados e armazenar no cache
   */
  private async loadData<T>(
    key: string,
    loader: () => Promise<T>,
    options: ComponentCacheOptions
  ): Promise<T> {
    const data = await loader()

    // Armazenar no cache
    this.set(key, data, options)

    return data
  }

  /**
   * Armazenar dados no cache
   */
  set<T>(key: string, data: T, options: ComponentCacheOptions = {}): void {
    // Verificar limite de entradas
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      componentName: this.extractComponentName(key),
      dependencies: options.dependencies || [],
      accessCount: 1,
      lastAccess: Date.now()
    }

    this.cache.set(key, entry)

    // Persistir se habilitado
    if (this.config.persistToStorage) {
      this.saveToStorage()
    }
  }

  /**
   * Invalidar entradas baseado em dependências
   */
  invalidate(pattern: string | string[]): number {
    const patterns = Array.isArray(pattern) ? pattern : [pattern]
    let invalidated = 0

    for (const [key, entry] of this.cache.entries()) {
      // Verificar se deve invalidar
      const shouldInvalidate = patterns.some(p => 
        key.includes(p) || 
        entry.dependencies.some(dep => dep.includes(p)) ||
        entry.componentName.includes(p)
      )

      if (shouldInvalidate) {
        this.cache.delete(key)
        invalidated++
        this.metrics.invalidations++
      }
    }

    return invalidated
  }

  /**
   * Verificar se entrada é válida
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Extrair nome do componente da chave
   */
  private extractComponentName(key: string): string {
    const parts = key.split(':')
    return parts[0] || 'unknown'
  }

  /**
   * Remover entrada menos usada (LRU)
   */
  private evictLRU(): void {
    let oldestKey = ''
    let oldestAccess = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key)
    })

    // Log de limpeza se habilitado
    if (expiredKeys.length > 0 && this.config.enableMetrics) {
      console.log(`[ComponentCache] Removidas ${expiredKeys.length} entradas expiradas`)
    }
  }

  /**
   * Atualizar métricas de performance
   */
  private updateMetrics(startTime: number): void {
    if (!this.config.enableMetrics) return

    const responseTime = Date.now() - startTime
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests
    )
    this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100
  }

  /**
   * Salvar cache no localStorage
   */
  private saveToStorage(): void {
    try {
      const serializedCache = JSON.stringify([...this.cache.entries()])
      localStorage.setItem('bello_component_cache', serializedCache)
    } catch (error) {
      console.warn('[ComponentCache] Erro ao salvar no localStorage:', error)
    }
  }

  /**
   * Carregar cache do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('bello_component_cache')
      if (stored) {
        const entries = JSON.parse(stored) as Array<[string, CacheEntry<any>]>
        entries.forEach(([key, entry]) => {
          // Verificar se ainda é válido
          if (this.isValid(entry)) {
            this.cache.set(key, entry)
          }
        })
      }
    } catch (error) {
      console.warn('[ComponentCache] Erro ao carregar do localStorage:', error)
    }
  }

  /**
   * Obter métricas do cache
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear()
    this.loadingStates.clear()
    this.pendingRequests.clear()
    
    if (this.config.persistToStorage) {
      localStorage.removeItem('bello_component_cache')
    }
  }

  /**
   * Destruir instância
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

// Instância global do cache manager
const globalCacheManager = new ComponentCacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxEntries: 100,
  enableMetrics: true,
  persistToStorage: true,
  compressionEnabled: false
})

export function useComponentCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: ComponentCacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const loaderRef = useRef(loader)
  const optionsRef = useRef(options)
  
  // Atualizar refs
  useEffect(() => {
    loaderRef.current = loader
    optionsRef.current = options
  }, [loader, options])

  /**
   * Carregar dados com cache
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      if (forceRefresh) {
        globalCacheManager.invalidate(key)
      }

      const result = await globalCacheManager.get(
        key,
        loaderRef.current,
        optionsRef.current
      )

      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      console.error(`[ComponentCache] Erro ao carregar ${key}:`, error)
    } finally {
      setLoading(false)
    }
  }, [key, loading])

  /**
   * Invalidar cache específico
   */
  const invalidateCache = useCallback(() => {
    globalCacheManager.invalidate(key)
    setData(null)
    setLastUpdated(null)
  }, [key])

  /**
   * Refresh dos dados
   */
  const refresh = useCallback(() => {
    return loadData(true)
  }, [loadData])

  // Carregar dados na inicialização
  useEffect(() => {
    loadData()
  }, [loadData])

  // Lazy loading se habilitado
  const shouldLazyLoad = useMemo(() => {
    return options.enableLazyLoad !== false
  }, [options.enableLazyLoad])

  // Preload se habilitado
  useEffect(() => {
    if (options.preload && !data && !loading) {
      loadData()
    }
  }, [options.preload, data, loading, loadData])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    invalidateCache,
    shouldLazyLoad,
    metrics: globalCacheManager.getMetrics()
  }
}

// ============================================================================
// HOOKS ESPECIALIZADOS POR COMPONENTE
// ============================================================================

/**
 * Cache para métricas do dashboard
 */
export function useDashboardMetricsCache() {
  return useComponentCache(
    'dashboard:metrics',
    async () => {
      // Loader será fornecido pelo componente
      return null
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutos
      dependencies: ['vendas', 'comandas', 'profissionais'],
      priority: 'HIGH',
      preload: true
    }
  )
}

/**
 * Cache para gráficos pesados
 */
export function useChartDataCache(chartType: string) {
  return useComponentCache(
    `charts:${chartType}`,
    async () => null,
    {
      ttl: 5 * 60 * 1000, // 5 minutos
      dependencies: ['analytics', 'comparativos'],
      priority: 'MEDIUM',
      enableLazyLoad: true
    }
  )
}

/**
 * Cache para análises de IA
 */
export function useMLAnalysisCache() {
  return useComponentCache(
    'ml:analysis',
    async () => null,
    {
      ttl: 10 * 60 * 1000, // 10 minutos
      dependencies: ['machine-learning'],
      priority: 'HIGH',
      preload: false
    }
  )
}

// ============================================================================
// UTILITÁRIOS DE CACHE
// ============================================================================

/**
 * Invalidar cache por padrão
 */
export function invalidateCachePattern(pattern: string | string[]): number {
  return globalCacheManager.invalidate(pattern)
}

/**
 * Limpar todo o cache
 */
export function clearAllCache(): void {
  globalCacheManager.clear()
}

/**
 * Obter métricas globais
 */
export function getCacheMetrics(): CacheMetrics {
  return globalCacheManager.getMetrics()
}

/**
 * HOC para componentes com cache automático
 */
export function withComponentCache<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  cacheKey: string,
  options: ComponentCacheOptions = {}
): React.ComponentType<P & { refresh?: () => Promise<void> }> {
  return function CachedComponent(props: P) {
    const { data, loading, error, refresh } = useComponentCache(
      cacheKey,
      async () => props,
      options
    )

    if (loading || error || !data) {
      return null
    }

    return React.createElement(WrappedComponent, { ...data, refresh })
  }
}

export default useComponentCache 