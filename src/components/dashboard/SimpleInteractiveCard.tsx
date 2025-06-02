'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Collapse,
  Box,
  Tooltip,
  Chip,
  LinearProgress,
  Zoom,
  useTheme,
  alpha
} from '@mui/material'
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info
} from '@mui/icons-material'

interface SimpleInteractiveCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down' | 'flat'
    value: number
    label?: string
  }
  expandableContent?: React.ReactNode
  loading?: boolean
  error?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  progress?: number
  tooltip?: string
  onClick?: () => void
  animated?: boolean
}

export default function SimpleInteractiveCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  expandableContent,
  loading = false,
  error,
  color = 'primary',
  progress,
  tooltip,
  onClick,
  animated = true
}: SimpleInteractiveCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const theme = useTheme()

  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp color="success" sx={{ fontSize: 18 }} />
      case 'down':
        return <TrendingDown color="error" sx={{ fontSize: 18 }} />
      case 'flat':
        return <TrendingFlat color="warning" sx={{ fontSize: 18 }} />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text.secondary'
    
    switch (trend.direction) {
      case 'up':
        return 'success.main'
      case 'down':
        return 'error.main'
      case 'flat':
        return 'warning.main'
      default:
        return 'text.secondary'
    }
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const cardContent = (
    <Card
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        minHeight: 160,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered 
          ? `0 8px 25px ${alpha(theme.palette[color].main, 0.15)}`
          : theme.shadows[1],
        border: `1px solid ${alpha(theme.palette[color].main, 0.12)}`,
        position: 'relative',
        '&:hover': {
          borderColor: alpha(theme.palette[color].main, 0.3),
        }
      }}
    >
      {/* Indicador de progresso no topo */}
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          color={color}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: '4px 4px 0 0'
          }}
        />
      )}

      <CardHeader
        avatar={icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              transition: 'all 0.3s ease'
            }}
          >
            {icon}
          </Box>
        )}
        action={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {tooltip && (
              <Tooltip title={tooltip}>
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {expandableContent && (
              <IconButton
                onClick={handleExpandClick}
                size="small"
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <ExpandMore />
              </IconButton>
            )}
          </Box>
        }
        title={
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        }
        subheader={subtitle}
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <LinearProgress color={color} />
            <Typography variant="body2" color="text.secondary">
              Carregando dados...
            </Typography>
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <Box>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 700,
                color: theme.palette[color].main,
                mb: 1
              }}
            >
              {value}
            </Typography>

            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTrendIcon()}
                <Chip
                  label={`${trend.value > 0 ? '+' : ''}${trend.value}%`}
                  size="small"
                  sx={{
                    backgroundColor: alpha(getTrendColor() as string, 0.1),
                    color: getTrendColor(),
                    fontWeight: 600
                  }}
                />
                {trend.label && (
                  <Typography variant="body2" color="text.secondary">
                    {trend.label}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Conteúdo expansível */}
      {expandableContent && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0, borderTop: 1, borderColor: 'divider' }}>
            {expandableContent}
          </CardContent>
        </Collapse>
      )}
    </Card>
  )

  if (animated) {
    return (
      <Zoom in timeout={500}>
        <div>{cardContent}</div>
      </Zoom>
    )
  }

  return cardContent
} 