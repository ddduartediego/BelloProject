'use client'

// ============================================================================
// SISTEMA DE MICRO-ANIMAÇÕES PARA DASHBOARD
// Transições suaves, loading states e efeitos visuais modernos
// ============================================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Fade,
  Grow,
  Slide,
  Zoom,
  Collapse,
  Typography,
  Chip,
  Avatar,
  Skeleton,
  IconButton,
  useTheme
} from '@mui/material'
import { keyframes, styled } from '@mui/material/styles'
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Psychology,
  Refresh,
  CheckCircle,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material'

// ============================================================================
// DEFINIÇÕES DE ANIMAÇÕES KEYFRAMES
// ============================================================================

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`

const shimmerAnimation = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`

const slideInAnimation = keyframes`
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

const countUpAnimation = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

const gradientShiftAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

// ============================================================================
// COMPONENTES STYLED COM ANIMAÇÕES
// ============================================================================

const AnimatedCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isLoading' && prop !== 'hasError'
})<{ isLoading?: boolean; hasError?: boolean }>(({ theme, isLoading, hasError }) => ({
  transition: 'all 0.3s ease-in-out',
  transform: 'translateY(0)',
  animation: `${slideInAnimation} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  ...(isLoading && {
    animation: `${pulseAnimation} 2s infinite`,
  }),
  ...(hasError && {
    borderLeft: `4px solid ${theme.palette.error.main}`,
    backgroundColor: theme.palette.error.light + '10',
  }),
}))

const ShimmerSkeleton = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, ${theme.palette.grey[300]} 25%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[300]} 75%)`,
  backgroundSize: '200px 100%',
  animation: `${shimmerAnimation} 1.5s infinite linear`,
  borderRadius: theme.shape.borderRadius,
}))

const CountUpText = styled(Typography)(({ theme }) => ({
  animation: `${countUpAnimation} 0.8s ease-out`,
  fontWeight: 'bold',
  display: 'inline-block',
}))

const GradientProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  background: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundSize: '200% 200%',
    animation: `${gradientShiftAnimation} 3s ease infinite`,
    borderRadius: 4,
  },
}))

const PulsingAvatar = styled(Avatar)<{ alert?: boolean }>(({ theme, alert }) => ({
  transition: 'all 0.3s ease',
  ...(alert && {
    animation: `${pulseAnimation} 1.5s infinite`,
    boxShadow: `0 0 20px ${theme.palette.warning.main}60`,
  }),
}))

// ============================================================================
// HOOK PARA ANIMAÇÕES DE NÚMEROS
// ============================================================================

interface UseCountUpOptions {
  duration?: number
  start?: number
  decimals?: number
  prefix?: string
  suffix?: string
}

function useCountUp(end: number, options: UseCountUpOptions = {}) {
  const {
    duration = 1000,
    start = 0,
    decimals = 0,
    prefix = '',
    suffix = ''
  } = options

  const [current, setCurrent] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (end === current) return

    setIsAnimating(true)
    startTimeRef.current = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - (startTimeRef.current || now)
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const value = start + (end - start) * easeOut

      setCurrent(Number(value.toFixed(decimals)))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [end, start, duration, decimals, current])

  const formattedValue = `${prefix}${current.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}${suffix}`

  return { value: current, formattedValue, isAnimating }
}

// ============================================================================
// COMPONENTES DE LOADING ANIMADOS
// ============================================================================

interface AnimatedLoadingProps {
  type?: 'skeleton' | 'shimmer' | 'progress' | 'pulse'
  width?: number | string
  height?: number | string
  children?: React.ReactNode
}

export function AnimatedLoading({ 
  type = 'skeleton', 
  width = '100%', 
  height = 60,
  children 
}: AnimatedLoadingProps) {
  const theme = useTheme()

  switch (type) {
    case 'shimmer':
      return (
        <ShimmerSkeleton 
          sx={{ width, height }}
        />
      )

    case 'progress':
      return (
        <Box sx={{ width, mb: 2 }}>
          <GradientProgress />
          {children && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {children}
            </Typography>
          )}
        </Box>
      )

    case 'pulse':
      return (
        <Box 
          sx={{ 
            width, 
            height,
            backgroundColor: theme.palette.grey[100],
            borderRadius: 1,
            animation: `${pulseAnimation} 1.5s infinite`
          }}
        />
      )

    default:
      return (
        <Skeleton 
          variant="rectangular" 
          width={width} 
          height={height}
          animation="wave"
          sx={{ borderRadius: 1 }}
        />
      )
  }
}

// ============================================================================
// CARD ANIMADO COM MÉTRICAS
// ============================================================================

interface AnimatedMetricCardProps {
  title: string
  value: number
  previousValue?: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error'
  loading?: boolean
  error?: string | null
  decimals?: number
  showTrend?: boolean
  delay?: number
}

export function AnimatedMetricCard({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  icon,
  color = 'primary',
  loading = false,
  error = null,
  decimals = 0,
  showTrend = true,
  delay = 0
}: AnimatedMetricCardProps) {
  const [mounted, setMounted] = useState(false)
  const { formattedValue } = useCountUp(value, {
    duration: 1200,
    decimals,
    prefix,
    suffix
  })

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const trend = previousValue ? ((value - previousValue) / previousValue) * 100 : 0
  const isPositiveTrend = trend > 0

  if (loading) {
    return (
      <AnimatedCard isLoading>
        <CardContent>
          <AnimatedLoading type="shimmer" height={20} width="60%" />
          <Box sx={{ mt: 2 }}>
            <AnimatedLoading type="shimmer" height={40} width="80%" />
          </Box>
          <Box sx={{ mt: 1 }}>
            <AnimatedLoading type="shimmer" height={16} width="40%" />
          </Box>
        </CardContent>
      </AnimatedCard>
    )
  }

  return (
    <Grow in={mounted} timeout={600} style={{ transitionDelay: `${delay}ms` }}>
      <AnimatedCard hasError={!!error}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon && (
              <PulsingAvatar 
                sx={{ bgcolor: `${color}.main`, mr: 2 }}
                alert={color === 'warning' || color === 'error'}
              >
                {icon}
              </PulsingAvatar>
            )}
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>

          {error ? (
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
              <ErrorIcon sx={{ mr: 1 }} />
              <Typography variant="body2">{error}</Typography>
            </Box>
          ) : (
            <>
              <CountUpText variant="h4" color={`${color}.main`}>
                {formattedValue}
              </CountUpText>

              {showTrend && previousValue && (
                <Fade in={mounted} timeout={1000} style={{ transitionDelay: '400ms' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {isPositiveTrend ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} fontSize="small" />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} fontSize="small" />
                    )}
                    <Chip
                      label={`${isPositiveTrend ? '+' : ''}${trend.toFixed(1)}%`}
                      size="small"
                      color={isPositiveTrend ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                </Fade>
              )}
            </>
          )}
        </CardContent>
      </AnimatedCard>
    </Grow>
  )
}

// ============================================================================
// CONTAINER ANIMADO PARA ABAS
// ============================================================================

interface AnimatedTabPanelProps {
  children: React.ReactNode
  value: number
  index: number
  direction?: 'left' | 'right' | 'up' | 'down'
}

export function AnimatedTabPanel({ 
  children, 
  value, 
  index, 
  direction = 'left' 
}: AnimatedTabPanelProps) {
  const isActive = value === index
  
  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      id={`animated-tabpanel-${index}`}
    >
      {isActive && (
        <Slide 
          direction={direction} 
          in={isActive} 
          mountOnEnter 
          unmountOnExit
          timeout={400}
        >
          <Box sx={{ pt: 3 }}>
            {children}
          </Box>
        </Slide>
      )}
    </Box>
  )
}

// ============================================================================
// NOTIFICAÇÃO ANIMADA
// ============================================================================

interface AnimatedNotificationProps {
  open: boolean
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  onClose?: () => void
  autoHideDuration?: number
}

export function AnimatedNotification({
  open,
  type,
  message,
  onClose,
  autoHideDuration = 4000
}: AnimatedNotificationProps) {
  const theme = useTheme()

  useEffect(() => {
    if (open && autoHideDuration && onClose) {
      const timer = setTimeout(onClose, autoHideDuration)
      return () => clearTimeout(timer)
    }
  }, [open, autoHideDuration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle />
      case 'warning': return <Warning />
      case 'error': return <ErrorIcon />
      default: return <Assessment />
    }
  }

  const getColor = () => {
    switch (type) {
      case 'success': return theme.palette.success.main
      case 'warning': return theme.palette.warning.main
      case 'error': return theme.palette.error.main
      default: return theme.palette.info.main
    }
  }

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Card
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          minWidth: 300,
          maxWidth: 500,
          zIndex: 1400,
          borderLeft: `4px solid ${getColor()}`,
          animation: `${slideInAnimation} 0.5s ease-out`,
          boxShadow: theme.shadows[8]
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: getColor(), mr: 2 }}>
            {getIcon()}
          </Avatar>
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            {message}
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              ×
            </IconButton>
          )}
        </CardContent>
      </Card>
    </Slide>
  )
}

// ============================================================================
// BOTÃO DE REFRESH ANIMADO
// ============================================================================

interface AnimatedRefreshButtonProps {
  loading: boolean
  onClick: () => void
  size?: 'small' | 'medium' | 'large'
}

export function AnimatedRefreshButton({ 
  loading, 
  onClick, 
  size = 'medium' 
}: AnimatedRefreshButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      disabled={loading}
      size={size}
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.1)',
        },
        '& .refresh-icon': {
          transition: 'transform 0.6s ease',
          transform: loading ? 'rotate(360deg)' : 'rotate(0deg)',
        }
      }}
    >
      <Refresh 
        className="refresh-icon"
        sx={{
          animation: loading ? `${pulseAnimation} 1s infinite` : 'none'
        }}
      />
    </IconButton>
  )
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export {
  useCountUp,
  AnimatedCard,
  ShimmerSkeleton,
  CountUpText,
  GradientProgress,
  PulsingAvatar
} 