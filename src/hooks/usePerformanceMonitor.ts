// ============================================================================
// HOOK DE MONITORAMENTO DE PERFORMANCE EM TEMPO REAL
// Sistema avançado para tracking de métricas de renderização e cache
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// INTERFACES DE PERFORMANCE
// ============================================================================

interface PerformanceMetrics {
  renderTime: number
  componentCount: number
  memoryUsage: number
  cacheHitRate: number
  loadTime: number
  fps: number
  bundleSize: number
  networkLatency: number
}

interface ComponentPerformance {
  name: string
  renderTime: number
  rerenderCount: number
  lastRender: Date
  averageRenderTime: number
  memoryFootprint: number
}

interface PerformanceAlert {
  type: 'WARNING' | 'CRITICAL'
  metric: string
  value: number
  threshold: number
  message: string
  timestamp: Date
}

interface PerformanceConfig {
  enableRealTimeMonitoring: boolean
  alertThresholds: {
    renderTime: number // ms
    memoryUsage: number // MB
    cacheHitRate: number // %
    fps: number
  }
  sampleInterval: number // ms
  maxHistorySize: number
}

// ============================================================================
// CLASSE DE MONITORAMENTO DE PERFORMANCE
// ============================================================================

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private componentMetrics = new Map<string, ComponentPerformance>()
  private alerts: PerformanceAlert[] = []
  private config: PerformanceConfig
  private observers: PerformanceObserver[] = []
  private intervalId: NodeJS.Timeout | null = null
  private frameId: number | null = null
  private lastFrameTime = 0
  private frameCount = 0

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableRealTimeMonitoring: true,
      alertThresholds: {
        renderTime: 16, // 60fps
        memoryUsage: 100, // 100MB
        cacheHitRate: 80, // 80%
        fps: 30
      },
      sampleInterval: 1000, // 1 segundo
      maxHistorySize: 100,
      ...config
    }

    if (this.config.enableRealTimeMonitoring) {
      this.startMonitoring()
    }
  }

  /**
   * Iniciar monitoramento em tempo real
   */
  private startMonitoring(): void {
    // Monitoramento de FPS
    this.startFPSMonitoring()

    // Monitoramento de métricas gerais
    this.intervalId = setInterval(() => {
      this.collectMetrics()
    }, this.config.sampleInterval)

    // Observer para Performance API
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupPerformanceObservers()
    }
  }

  /**
   * Monitoramento de FPS
   */
  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime
        this.frameCount++
        
        // Calcular FPS a cada segundo
        if (delta >= 1000) {
          const fps = Math.round((this.frameCount * 1000) / delta)
          this.updateFPS(fps)
          this.frameCount = 0
          this.lastFrameTime = timestamp
        }
      } else {
        this.lastFrameTime = timestamp
      }

      this.frameId = requestAnimationFrame(measureFPS)
    }

    this.frameId = requestAnimationFrame(measureFPS)
  }

  /**
   * Configurar observers da Performance API
   */
  private setupPerformanceObservers(): void {
    try {
      // Observer para medidas de navegação
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry as PerformanceNavigationTiming)
          }
        })
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // Observer para medidas de recursos
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming)
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)

    } catch (error) {
      console.warn('[PerformanceMonitor] Erro ao configurar observers:', error)
    }
  }

  /**
   * Processar entrada de navegação
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.fetchStart
    const networkLatency = entry.responseStart - entry.requestStart

    this.updateMetric('loadTime', loadTime)
    this.updateMetric('networkLatency', networkLatency)
  }

  /**
   * Processar entrada de recurso
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Calcular tamanho do bundle para recursos JS
    if (entry.name.includes('.js') && entry.transferSize) {
      this.updateMetric('bundleSize', entry.transferSize)
    }
  }

  /**
   * Coletar métricas gerais
   */
  private collectMetrics(): void {
    const currentMetrics: PerformanceMetrics = {
      renderTime: this.calculateAverageRenderTime(),
      componentCount: this.componentMetrics.size,
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: this.getCacheHitRate(),
      loadTime: this.getMetric('loadTime') || 0,
      fps: this.getMetric('fps') || 60,
      bundleSize: this.getMetric('bundleSize') || 0,
      networkLatency: this.getMetric('networkLatency') || 0
    }

    this.addMetrics(currentMetrics)
    this.checkAlerts(currentMetrics)
  }

  /**
   * Adicionar métricas ao histórico
   */
  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)

    // Limitar tamanho do histórico
    if (this.metrics.length > this.config.maxHistorySize) {
      this.metrics.shift()
    }
  }

  /**
   * Verificar alertas baseados em thresholds
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    const { alertThresholds } = this.config

    // Verificar tempo de renderização
    if (metrics.renderTime > alertThresholds.renderTime) {
      this.addAlert('WARNING', 'renderTime', metrics.renderTime, alertThresholds.renderTime,
        `Tempo de renderização alto: ${metrics.renderTime.toFixed(2)}ms`)
    }

    // Verificar uso de memória
    if (metrics.memoryUsage > alertThresholds.memoryUsage) {
      this.addAlert('CRITICAL', 'memoryUsage', metrics.memoryUsage, alertThresholds.memoryUsage,
        `Uso de memória alto: ${metrics.memoryUsage.toFixed(2)}MB`)
    }

    // Verificar taxa de cache
    if (metrics.cacheHitRate < alertThresholds.cacheHitRate) {
      this.addAlert('WARNING', 'cacheHitRate', metrics.cacheHitRate, alertThresholds.cacheHitRate,
        `Taxa de cache baixa: ${metrics.cacheHitRate.toFixed(1)}%`)
    }

    // Verificar FPS
    if (metrics.fps < alertThresholds.fps) {
      this.addAlert('WARNING', 'fps', metrics.fps, alertThresholds.fps,
        `FPS baixo: ${metrics.fps}`)
    }
  }

  /**
   * Adicionar alerta
   */
  private addAlert(type: 'WARNING' | 'CRITICAL', metric: string, value: number, threshold: number, message: string): void {
    const alert: PerformanceAlert = {
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: new Date()
    }

    this.alerts.push(alert)

    // Limitar alertas
    if (this.alerts.length > 50) {
      this.alerts.shift()
    }

    // Log do alerta
    console.warn(`[PerformanceMonitor] ${type}: ${message}`)
  }

  /**
   * Registrar performance de componente
   */
  trackComponent(name: string, renderTime: number): void {
    const existing = this.componentMetrics.get(name)

    if (existing) {
      existing.rerenderCount++
      existing.lastRender = new Date()
      existing.renderTime = renderTime
      existing.averageRenderTime = (existing.averageRenderTime + renderTime) / 2
    } else {
      this.componentMetrics.set(name, {
        name,
        renderTime,
        rerenderCount: 1,
        lastRender: new Date(),
        averageRenderTime: renderTime,
        memoryFootprint: 0
      })
    }
  }

  /**
   * Calcular tempo médio de renderização
   */
  private calculateAverageRenderTime(): number {
    if (this.componentMetrics.size === 0) return 0

    const total = Array.from(this.componentMetrics.values())
      .reduce((sum, comp) => sum + comp.averageRenderTime, 0)

    return total / this.componentMetrics.size
  }

  /**
   * Obter uso de memória
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / (1024 * 1024) // MB
    }
    return 0
  }

  /**
   * Obter taxa de hit do cache
   */
  private getCacheHitRate(): number {
    // Integração com o sistema de cache
    try {
      const cacheMetrics = localStorage.getItem('bello_cache_metrics')
      if (cacheMetrics) {
        const metrics = JSON.parse(cacheMetrics)
        return metrics.hitRate || 0
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Erro ao obter métricas de cache:', error)
    }
    return 0
  }

  /**
   * Atualizar métrica específica
   */
  private updateMetric(key: string, value: number): void {
    // Implementação simples de storage de métricas
    if (typeof window !== 'undefined') {
      const metrics = JSON.parse(localStorage.getItem('bello_performance_metrics') || '{}')
      metrics[key] = value
      localStorage.setItem('bello_performance_metrics', JSON.stringify(metrics))
    }
  }

  /**
   * Obter métrica específica
   */
  private getMetric(key: string): number | null {
    if (typeof window !== 'undefined') {
      const metrics = JSON.parse(localStorage.getItem('bello_performance_metrics') || '{}')
      return metrics[key] || null
    }
    return null
  }

  /**
   * Atualizar FPS
   */
  private updateFPS(fps: number): void {
    this.updateMetric('fps', fps)
  }

  /**
   * Obter métricas atuais
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  /**
   * Obter histórico de métricas
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Obter métricas de componentes
   */
  getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values())
  }

  /**
   * Obter alertas
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  /**
   * Limpar alertas
   */
  clearAlerts(): void {
    this.alerts = []
  }

  /**
   * Parar monitoramento
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }

    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

const globalPerformanceMonitor = new PerformanceMonitor()

export function usePerformanceMonitor(componentName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformance[]>([])
  
  const renderStartTime = useRef<number | undefined>(undefined)

  /**
   * Marcar início de renderização
   */
  const startRender = useCallback(() => {
    renderStartTime.current = performance.now()
  }, [])

  /**
   * Marcar fim de renderização
   */
  const endRender = useCallback(() => {
    if (renderStartTime.current && componentName) {
      const renderTime = performance.now() - renderStartTime.current
      globalPerformanceMonitor.trackComponent(componentName, renderTime)
    }
  }, [componentName])

  /**
   * Atualizar métricas
   */
  const updateMetrics = useCallback(() => {
    setMetrics(globalPerformanceMonitor.getCurrentMetrics())
    setAlerts(globalPerformanceMonitor.getAlerts())
    setComponentMetrics(globalPerformanceMonitor.getComponentMetrics())
  }, [])

  /**
   * Limpar alertas
   */
  const clearAlerts = useCallback(() => {
    globalPerformanceMonitor.clearAlerts()
    setAlerts([])
  }, [])

  // Atualizar métricas periodicamente
  useEffect(() => {
    const interval = setInterval(updateMetrics, 2000)
    updateMetrics() // Primeira atualização

    return () => clearInterval(interval)
  }, [updateMetrics])

  // Auto-tracking de renderização se componentName fornecido
  useEffect(() => {
    if (componentName) {
      startRender()
      return () => {
        endRender()
      }
    }
  }, [componentName, startRender, endRender])

  return {
    metrics,
    alerts,
    componentMetrics,
    startRender,
    endRender,
    updateMetrics,
    clearAlerts,
    getHistory: () => globalPerformanceMonitor.getMetricsHistory()
  }
}

/**
 * HOC para monitoramento automático de performance
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function MonitoredComponent(props: P) {
    const { startRender, endRender } = usePerformanceMonitor(componentName)

    useEffect(() => {
      startRender()
      return () => {
        endRender()
      }
    }, [startRender, endRender])

    return React.createElement(WrappedComponent, props)
  }
}

export default usePerformanceMonitor 