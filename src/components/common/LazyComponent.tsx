'use client'

import React, { Suspense, useState, useEffect, useRef } from 'react'
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Card, 
  CardContent,
  Skeleton,
  Alert
} from '@mui/material'

interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  loadingMessage?: string
  minHeight?: number | string
  enableIntersectionObserver?: boolean
  rootMargin?: string
  threshold?: number
}

export default function LazyComponent({
  children,
  fallback,
  errorFallback,
  loadingMessage = 'Carregando...',
  minHeight = 200,
  enableIntersectionObserver = false,
  rootMargin = '100px',
  threshold = 0.1
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(!enableIntersectionObserver)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer para lazy loading baseado em visibilidade
  useEffect(() => {
    if (!enableIntersectionObserver || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [enableIntersectionObserver, isVisible, rootMargin, threshold])

  // Error boundary para capturar erros no componente lazy
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Erro no componente lazy:', error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const defaultFallback = (
    <Card sx={{ minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {loadingMessage}
        </Typography>
      </CardContent>
    </Card>
  )

  const defaultErrorFallback = (
    <Card sx={{ minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CardContent sx={{ width: '100%' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Erro ao carregar componente
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Tente recarregar a página ou entre em contato com o suporte.
        </Typography>
      </CardContent>
    </Card>
  )

  if (hasError) {
    return errorFallback || defaultErrorFallback
  }

  return (
    <Box ref={containerRef} sx={{ minHeight }}>
      {isVisible ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </Box>
  )
}

/**
 * Hook para lazy loading de dados com Intersection Observer
 */
export function useLazyLoad(
  threshold: number = 0.1,
  rootMargin: string = '100px'
) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, hasLoaded])

  return { ref, isVisible, hasLoaded }
}

/**
 * Componente de skeleton para loading states
 */
export function ComponentSkeleton({ 
  height = 200, 
  lines = 3,
  showHeader = true 
}: { 
  height?: number, 
  lines?: number,
  showHeader?: boolean 
}) {
  return (
    <Card sx={{ height, p: 2 }}>
      <CardContent>
        {showHeader && (
          <Skeleton 
            variant="text" 
            height={32} 
            width="40%" 
            sx={{ mb: 2 }} 
          />
        )}
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton 
            key={index}
            variant="text" 
            height={24} 
            width={index === lines - 1 ? '60%' : '100%'}
            sx={{ mb: 1 }}
          />
        ))}
        <Skeleton 
          variant="rectangular" 
          height={height - 120} 
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  )
} 