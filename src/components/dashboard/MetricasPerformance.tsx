'use client'

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  useTheme,
  Stack
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material'
import { DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface MetricasPerformanceProps {
  metrics?: DashboardMetrics | null
  title?: string
}

export default function MetricasPerformance({ 
  metrics, 
  title = 'Métricas de Performance' 
}: MetricasPerformanceProps) {
  const theme = useTheme()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // KPI Cards Data
  const kpis = [
    {
      id: 'ticket-medio',
      title: 'Ticket Médio',
      value: formatCurrency(metrics?.vendas?.ticketMedio || 0),
      subtitle: `${metrics?.vendas?.totalComandas || 0} comandas no mês`,
      icon: <TrendingUpIcon />,
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light + '20',
      trend: metrics?.vendas?.percentualCrescimento || 0,
      description: 'Valor médio por comanda fechada'
    },
    {
      id: 'taxa-retorno',
      title: 'Taxa de Retorno',
      value: formatPercent(metrics?.performance?.taxaRetorno?.percentual || 0),
      subtitle: `${metrics?.performance?.taxaRetorno?.clientesRecorrentes || 0} de ${metrics?.performance?.taxaRetorno?.clientesTotais || 0} clientes`,
      icon: <PeopleIcon />,
      color: theme.palette.secondary.main,
      bgColor: theme.palette.secondary.light + '20',
      trend: 0, // TODO: Implementar comparativo período anterior
      description: 'Percentual de clientes que retornaram no período'
    },
    {
      id: 'ocupacao',
      title: 'Ocupação Média',
      value: formatPercent(metrics?.performance?.ocupacao?.media || 0),
      subtitle: `${metrics?.performance?.ocupacao?.profissionais?.length || 0} profissionais`,
      icon: <ScheduleIcon />,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light + '20',
      trend: 0, // TODO: Implementar comparativo período anterior
      description: 'Taxa média de ocupação dos profissionais'
    },
    {
      id: 'servicos-populares',
      title: 'Serviço Top',
      value: metrics?.vendaDetalhada?.servicosPopulares?.[0]?.servico || 'N/A',
      subtitle: `${metrics?.vendaDetalhada?.servicosPopulares?.[0]?.quantidade || 0} vendas`,
      icon: <StarIcon />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light + '20',
      trend: 0,
      description: 'Serviço mais vendido do período'
    }
  ]

  const renderKpiCard = (kpi: typeof kpis[0]) => (
    <Grid item xs={12} sm={6} md={3} key={kpi.id}>
      <Card 
        sx={{ 
          height: '100%',
          position: 'relative',
          overflow: 'visible',
          border: 1,
          borderColor: 'divider',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header com ícone */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {kpi.title}
            </Typography>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: kpi.bgColor,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {kpi.icon}
            </Box>
          </Box>

          {/* Valor principal */}
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            color="text.primary"
            sx={{ mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {kpi.value}
          </Typography>

          {/* Subtitle */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {kpi.subtitle}
          </Typography>

          {/* Trend indicator */}
          {kpi.trend !== 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: kpi.trend > 0 ? 'success.main' : 'error.main',
                  fontSize: '0.875rem',
                  fontWeight: 'medium'
                }}
              >
                <TrendingUpIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 0.5,
                    transform: kpi.trend < 0 ? 'rotate(180deg)' : 'none'
                  }}
                />
                {kpi.trend > 0 ? '+' : ''}{formatPercent(Math.abs(kpi.trend))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                vs período anterior
              </Typography>
            </Stack>
          )}

          {/* Description tooltip */}
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block',
              mt: 1,
              fontSize: '0.75rem',
              fontStyle: 'italic'
            }}
          >
            {kpi.description}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )

  // Top Serviços Component
  const renderTopServicos = () => (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Top 5 Serviços
            </Typography>
          </Box>

          {metrics?.vendaDetalhada?.servicosPopulares?.length ? (
            <Stack spacing={2}>
              {metrics.vendaDetalhada.servicosPopulares.slice(0, 5).map((servico, index) => (
                <Box key={servico.servico} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#CD7F32' : 'grey.300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: index < 3 ? 'white' : 'text.secondary'
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {servico.servico}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {servico.quantidade} vendas
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(servico.valor)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Dados aparecerão conforme serviços forem vendidos
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  )

  // Performance por Profissional Component
  const renderPerformanceProfissionais = () => (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PeopleIcon sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Performance por Profissional
            </Typography>
          </Box>

          {metrics?.vendaDetalhada?.porProfissional?.length ? (
            <Stack spacing={2}>
              {metrics.vendaDetalhada.porProfissional.slice(0, 5).map((prof, index) => (
                <Box key={prof.profissional}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {prof.profissional}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(prof.vendas)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {prof.comandas} comandas • Ticket: {formatCurrency(prof.ticketMedio)}
                    </Typography>
                  </Box>
                  {/* Barra de progresso visual */}
                  <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.200', borderRadius: 2 }}>
                    <Box
                      sx={{
                        width: `${Math.min(100, (prof.vendas / (metrics?.vendaDetalhada?.porProfissional?.[0]?.vendas || 1)) * 100)}%`,
                        height: '100%',
                        bgcolor: index === 0 ? 'primary.main' : 'secondary.main',
                        borderRadius: 2,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Dados aparecerão conforme comandas forem finalizadas
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  )

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header da seção */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Indicadores-chave de performance para gestão estratégica do salão
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* KPI Cards */}
        {kpis.map(renderKpiCard)}

        {/* Top Serviços */}
        {renderTopServicos()}

        {/* Performance Profissionais */}
        {renderPerformanceProfissionais()}
      </Grid>
    </Box>
  )
} 