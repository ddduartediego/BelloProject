'use client'

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Stack,
  Chip,
  useTheme
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import { DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface HorariosPicoProps {
  metrics?: DashboardMetrics | null
  title?: string
}

export default function HorariosPico({ 
  metrics, 
  title = 'Análise de Horários de Pico' 
}: HorariosPicoProps) {
  const theme = useTheme()

  const horarios = metrics?.performance?.horariosPico?.horarios || []
  const diasSemana = metrics?.performance?.horariosPico?.diasSemana || []

  const getIntensidadeColor = (percentual: number) => {
    if (percentual >= 15) return theme.palette.error.main
    if (percentual >= 10) return theme.palette.warning.main
    if (percentual >= 5) return theme.palette.info.main
    return theme.palette.grey[300]
  }

  const getIntensidadeAlpha = (percentual: number) => {
    return Math.max(0.1, Math.min(1, percentual / 20))
  }

  return (
    <Grid container spacing={3}>
      {/* Horários Mais Movimentados */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Horários Mais Movimentados
              </Typography>
            </Box>

            {horarios.length > 0 ? (
              <Stack spacing={2}>
                {horarios.slice(0, 8).map((horario, index) => (
                  <Box 
                    key={horario.hora}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `${getIntensidadeColor(horario.percentual)}${Math.floor(getIntensidadeAlpha(horario.percentual) * 255).toString(16).padStart(2, '0')}`,
                      border: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: index < 3 ? 'primary.main' : 'grey.400',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {horario.hora}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {horario.agendamentos} agendamentos
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {horario.percentual.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        do total
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Dados aparecerão conforme agendamentos forem realizados
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Dias da Semana Mais Movimentados */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Dias da Semana Populares
              </Typography>
            </Box>

            {diasSemana.length > 0 ? (
              <Stack spacing={2}>
                {diasSemana.map((dia, index) => (
                  <Box 
                    key={dia.diaSemana}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: index === 0 ? 'primary.light' + '20' : 'background.default'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {dia.diaSemana}
                      </Typography>
                      {index === 0 && (
                        <Chip 
                          label="Mais popular" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight="bold">
                        {dia.agendamentos} agendamentos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dia.percentual.toFixed(1)}% do total
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Dados aparecerão conforme agendamentos forem realizados
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Resumo e Insights */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Insights e Recomendações
            </Typography>
            
            {horarios.length > 0 && diasSemana.length > 0 ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'success.contrastText' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Horário de Pico
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {horarios[0]?.hora || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      {horarios[0]?.percentual.toFixed(1)}% dos agendamentos
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'info.contrastText' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Dia Mais Popular
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {diasSemana[0]?.diaSemana || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      {diasSemana[0]?.percentual.toFixed(1)}% dos agendamentos
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.contrastText' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Total Analisado
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {horarios.reduce((sum, h) => sum + h.agendamentos, 0)}
                    </Typography>
                    <Typography variant="body2">
                      agendamentos no período
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Com mais dados, aqui aparecerão insights automáticos sobre os melhores horários para otimizar a agenda.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
} 