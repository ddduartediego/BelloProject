'use client'

import React, { memo, useMemo, useCallback } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material'
import {
  AccountBalance as CaixaIcon,
  TrendingUp as VendasIcon,
  Receipt as ComandasIcon,
  People as ProfissionaisIcon,
  CalendarToday as SemanaIcon,
  Groups as ClientesIcon
} from '@mui/icons-material'
import { MetricasExecutivas, DashboardConfig } from '@/types/dashboard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================================
// INTERFACES
// ============================================================================

interface CardsExecutivosProps {
  metrics: MetricasExecutivas
  loading: boolean
  config: DashboardConfig
}

interface CardExecutivoProps {
  title: string
  icon: React.ReactNode
  value: string | number
  subtitle?: string | React.ReactNode
  trend?: {
    value: number
    label: string
    type: 'positive' | 'negative' | 'neutral'
  }
  info?: string | React.ReactNode
  loading?: boolean
}

// ============================================================================
// COMPONENTE DE CARD EXECUTIVO OTIMIZADO
// ============================================================================

const CardExecutivo = memo(function CardExecutivo({
  title,
  icon,
  value,
  subtitle,
  trend,
  info,
  loading = false
}: CardExecutivoProps) {
  const theme = useTheme()

  // Memoizar funções que não dependem de props que mudam frequentemente
  const getTrendColor = useCallback((type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return theme.palette.success.main
      case 'negative': return theme.palette.error.main
      default: return theme.palette.info.main
    }
  }, [theme.palette])

  const getTrendIcon = useCallback((type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return '↗'
      case 'negative': return '↘'
      default: return '→'
    }
  }, [])

  // Memoizar estilos que são computados
  const cardStyles = useMemo(() => ({
    height: '100%',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4]
    }
  }), [theme.shadows])

  const iconContainerStyles = useMemo(() => ({
    bgcolor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    p: 1.5,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }), [theme.palette.primary])

  // Memoizar chip do trend
  const trendChip = useMemo(() => {
    if (!trend) return null

    return (
      <Chip
        size="small"
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>{getTrendIcon(trend.type)}</span>
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </Box>
        }
        sx={{
          bgcolor: getTrendColor(trend.type),
          color: 'white',
          fontWeight: 'bold'
        }}
      />
    )
  }, [trend, getTrendColor, getTrendIcon])

  if (loading) {
    return (
      <Card sx={cardStyles}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={cardStyles}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={iconContainerStyles}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          {value}
        </Typography>

        {subtitle && (
          <Box sx={{ mb: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
            {subtitle}
          </Box>
        )}

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {trendChip}
            <Typography variant="caption" color="text.secondary">
              {trend.label}
            </Typography>
          </Box>
        )}

        {info && (
          <Box sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {info}
          </Box>
        )}
      </CardContent>
    </Card>
  )
})

// ============================================================================
// COMPONENTE PRINCIPAL OTIMIZADO
// ============================================================================

const CardsExecutivos = memo(function CardsExecutivos({
  metrics,
  loading,
  config
}: CardsExecutivosProps) {
  
  // Função para formatar valores monetários - memoizada
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }, [])

  // Função para formatar tempo - memoizada
  const formatTempo = useCallback((minutos: number) => {
    if (minutos < 60) {
      return `${minutos}min`
    }
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h${mins > 0 ? `${mins}min` : ''}`
  }, [])

  // Função para determinar tipo de trend - memoizada
  const getTrendType = useCallback((value: number): 'positive' | 'negative' | 'neutral' => {
    if (value > 0) return 'positive'
    if (value < 0) return 'negative'
    return 'neutral'
  }, [])

  // Função para formatar horário relativo - memoizada
  const formatTempoRelativo = useCallback((timestamp: string) => {
    try {
      const agora = new Date()
      const tempo = new Date(timestamp)
      const diferencaMinutos = Math.floor((agora.getTime() - tempo.getTime()) / (1000 * 60))
      
      if (diferencaMinutos < 1) return 'agora'
      if (diferencaMinutos < 60) return `há ${diferencaMinutos}min`
      
      const diferencaHoras = Math.floor(diferencaMinutos / 60)
      if (diferencaHoras < 24) return `há ${diferencaHoras}h`
      
      return format(tempo, 'dd/MM HH:mm', { locale: ptBR })
    } catch {
      return 'N/A'
    }
  }, [])

  // Memoizar dados dos cards para evitar recálculos desnecessários
  const cardsData = useMemo(() => {
    if (!metrics) return []

    return [
      // Card do Caixa
      {
        id: 'caixa',
        title: 'Status do Caixa',
        icon: <CaixaIcon />,
        value: formatCurrency(metrics.caixa.saldoAtual),
        subtitle: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              size="small" 
              label={metrics.caixa.status}
              color={metrics.caixa.status === 'ABERTO' ? 'success' : 'default'}
              variant={metrics.caixa.status === 'ABERTO' ? 'filled' : 'outlined'}
            />
            {metrics.caixa.status === 'ABERTO' && (
              <Typography variant="caption" color="text.secondary">
                há {formatTempo(metrics.caixa.tempoAberto)}
              </Typography>
            )}
          </Box>
        ),
        trend: metrics.caixa.comparativoOntem !== 0 ? {
          value: metrics.caixa.comparativoOntem,
          label: 'movimento vs ontem',
          type: getTrendType(metrics.caixa.comparativoOntem)
        } : undefined,
        info: `Última movimentação: ${formatTempoRelativo(metrics.caixa.ultimaMovimentacao)}`
      },

      // Card de Vendas  
      {
        id: 'vendas',
        title: 'Vendas Hoje',
        icon: <VendasIcon />,
        value: formatCurrency(metrics.vendas.totalDia),
        subtitle: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {metrics.vendas.metaDiaria && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Meta: {formatCurrency(metrics.vendas.metaDiaria)}
                </Typography>
                <Chip 
                  size="small" 
                  label={`${Math.round(metrics.vendas.percentualMeta)}%`}
                  color={metrics.vendas.percentualMeta >= 100 ? 'success' : 
                         metrics.vendas.percentualMeta >= 50 ? 'warning' : 'error'}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        ),
        trend: {
          value: metrics.vendas.percentualVsOntem,
          label: 'vs ontem',
          type: getTrendType(metrics.vendas.percentualVsOntem)
        },
        info: `Última venda: ${formatTempoRelativo(metrics.vendas.ultimaVenda)}`
      },

      // Card de Comandas
      {
        id: 'comandas',
        title: 'Comandas Hoje',
        icon: <ComandasIcon />,
        value: metrics.comandas.quantidadeHoje,
        subtitle: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ticket médio:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(metrics.comandas.ticketMedio)}
            </Typography>
          </Box>
        ),
        trend: metrics.comandas.comparativoOntem !== 0 ? {
          value: Math.abs(metrics.comandas.comparativoOntem),
          label: `${metrics.comandas.comparativoOntem > 0 ? '+' : ''}${metrics.comandas.comparativoOntem} vs ontem`,
          type: getTrendType(metrics.comandas.comparativoOntem)
        } : undefined,
        info: `Última comanda: ${formatTempoRelativo(metrics.comandas.ultimaComanda)}`
      },

      // Card de Profissionais
      {
        id: 'profissionais',
        title: 'Profissionais Ativos',
        icon: <ProfissionaisIcon />,
        value: metrics.profissionaisAtivos.totalAtivos,
        subtitle: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Top do dia:
            </Typography>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {metrics.profissionaisAtivos.topProfissional.nome}
            </Typography>
          </Box>
        ),
        info: (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Vendas hoje: {formatCurrency(metrics.profissionaisAtivos.topProfissional.vendas)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ocupação: {metrics.profissionaisAtivos.ocupacaoMedia}%
            </Typography>
          </Box>
        )
      },

      // Card da Semana
      {
        id: 'semana',
        title: 'Semana Atual',
        icon: <SemanaIcon />,
        value: formatCurrency(metrics.semanaAtual.vendas),
        trend: {
          value: metrics.semanaAtual.percentualVsSemanaPassada,
          label: 'vs semana passada',
          type: getTrendType(metrics.semanaAtual.percentualVsSemanaPassada)
        }
      },

      // Card de Clientes
      {
        id: 'clientes',
        title: 'Clientes',
        icon: <ClientesIcon />,
        value: metrics.clientes.totalAtivos,
        subtitle: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              size="small" 
              label={`${metrics.clientes.novosHoje} novos hoje`}
              color="primary"
              variant="outlined"
            />
          </Box>
        ),
        info: (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Taxa retorno: {metrics.clientes.taxaRetorno}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Satisfação: {metrics.clientes.satisfacaoMedia.toFixed(1)}⭐
            </Typography>
          </Box>
        )
      }
    ]
  }, [metrics, formatCurrency, formatTempo, getTrendType, formatTempoRelativo])

  return (
    <Grid container spacing={3}>
      {cardsData.map((cardData) => (
        <Grid item xs={12} sm={6} md={4} key={cardData.id}>
          <CardExecutivo
            title={cardData.title}
            icon={cardData.icon}
            value={cardData.value}
            subtitle={cardData.subtitle}
            trend={cardData.trend}
            info={cardData.info}
            loading={loading}
          />
        </Grid>
      ))}
    </Grid>
  )
})

export default CardsExecutivos 