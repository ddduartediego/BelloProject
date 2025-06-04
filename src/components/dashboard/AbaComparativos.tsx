'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Insights as InsightsIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { MetricasComparativos, DashboardConfig } from '@/types/dashboard'
import { tendenciasSemanaisService, TendenciasDiaSemana, AnalyseTendenciasSemanais } from '@/services/tendenciasSemanaisService'
import { Line, Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  RadialLinearScale,
  Filler
)

// ============================================================================
// INTERFACES
// ============================================================================

interface AbaComparativosProps {
  metrics: MetricasComparativos
  loading: boolean
  config: DashboardConfig
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// COMPONENTE DE TAB PANEL
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`comparativos-tabpanel-${index}`}
      aria-labelledby={`comparativos-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AbaComparativos = memo(function AbaComparativos({
  metrics,
  loading,
  config
}: AbaComparativosProps) {

  // Estados
  const [tabAtiva, setTabAtiva] = useState(0)
  const [tendenciasSemanais, setTendenciasSemanais] = useState<AnalyseTendenciasSemanais | null>(null)
  const [loadingTendencias, setLoadingTendencias] = useState(false)

  // ============================================================================
  // CARREGAMENTO DE TENDÊNCIAS SEMANAIS
  // ============================================================================

  const carregarTendenciasSemanais = useCallback(async () => {
    setLoadingTendencias(true)
    try {
      const analise = await tendenciasSemanaisService.carregarAnaliseCompleta()
      setTendenciasSemanais(analise)
    } catch (error) {
      console.error('Erro ao carregar tendências semanais:', error)
    } finally {
      setLoadingTendencias(false)
    }
  }, [])

  useEffect(() => {
    carregarTendenciasSemanais()
  }, [carregarTendenciasSemanais])

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }, [])

  const formatPercentual = useCallback((value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }, [])

  const getTrendIcon = useCallback((value: number) => {
    if (value > 5) return <TrendingUpIcon color="success" />
    if (value < -5) return <TrendingDownIcon color="error" />
    return <TrendingFlatIcon color="info" />
  }, [])

  const getTrendColor = useCallback((value: number) => {
    if (value > 5) return 'success.main'
    if (value < -5) return 'error.main'
    return 'info.main'
  }, [])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabAtiva(newValue)
  }

  // ============================================================================
  // DADOS DOS GRÁFICOS
  // ============================================================================

  const dadosGraficoSemanal = React.useMemo(() => {
    if (!tendenciasSemanais?.semanaAtual) return null

    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const vendas = tendenciasSemanais.semanaAtual.map(dia => dia.vendas.total)
    const comandas = tendenciasSemanais.semanaAtual.map(dia => dia.comandas.quantidade)

    return {
      labels: dias,
      datasets: [
        {
          label: 'Vendas (R$)',
          data: vendas,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Comandas',
          data: comandas,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1'
        }
      ]
    }
  }, [tendenciasSemanais])

  const dadosGraficoRadar = React.useMemo(() => {
    if (!tendenciasSemanais?.semanaAtual) return null

    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const percentuais = tendenciasSemanais.semanaAtual.map(dia => dia.vendas.percentualDoTotal)

    return {
      labels: dias,
      datasets: [
        {
          label: 'Distribuição Semanal (%)',
          data: percentuais,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }
      ]
    }
  }, [tendenciasSemanais])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !tendenciasSemanais) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header com informações gerais */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Análise Comparativa e Tendências
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comparativos temporais, padrões semanais e insights estratégicos
        </Typography>
      </Box>

      {/* Sistema de abas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabAtiva}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<TimelineIcon />} 
            label="Tendências Semanais" 
            id="comparativos-tab-0"
            aria-controls="comparativos-tabpanel-0"
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="Análise Comparativa" 
            id="comparativos-tab-1"
            aria-controls="comparativos-tabpanel-1"
          />
          <Tab 
            icon={<InsightsIcon />} 
            label="Insights Estratégicos" 
            id="comparativos-tab-2"
            aria-controls="comparativos-tabpanel-2"
          />
        </Tabs>

        {/* Tab 1: Tendências Semanais */}
        <TabPanel value={tabAtiva} index={0}>
          {loadingTendencias ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : tendenciasSemanais ? (
            <Grid container spacing={3}>
              
              {/* Resumo da semana */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📊 Resumo da Semana
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {formatCurrency(
                              tendenciasSemanais.semanaAtual.reduce((acc, dia) => acc + dia.vendas.total, 0)
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total de Vendas
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary">
                            {tendenciasSemanais.semanaAtual.reduce((acc, dia) => acc + dia.comandas.quantidade, 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total de Comandas
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {tendenciasSemanais.insights.melhorDiaSemana.dia}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Melhor Dia
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="error.main">
                            {tendenciasSemanais.insights.piorDiaSemana.dia}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dia Mais Fraco
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de tendências */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Vendas e Comandas por Dia
                    </Typography>
                    {dadosGraficoSemanal && (
                      <Box sx={{ height: 300 }}>
                        <Line
                          data={dadosGraficoSemanal}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              mode: 'index' as const,
                              intersect: false,
                            },
                            scales: {
                              x: {
                                display: true,
                                title: {
                                  display: true,
                                  text: 'Dia da Semana'
                                }
                              },
                              y: {
                                type: 'linear' as const,
                                display: true,
                                position: 'left' as const,
                                title: {
                                  display: true,
                                  text: 'Vendas (R$)'
                                },
                              },
                              y1: {
                                type: 'linear' as const,
                                display: true,
                                position: 'right' as const,
                                title: {
                                  display: true,
                                  text: 'Comandas'
                                },
                                grid: {
                                  drawOnChartArea: false,
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico radar de distribuição */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎯 Distribuição Semanal
                    </Typography>
                    {dadosGraficoRadar && (
                      <Box sx={{ height: 300 }}>
                        <Radar
                          data={dadosGraficoRadar}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              r: {
                                beginAtZero: true,
                                max: Math.max(...tendenciasSemanais.semanaAtual.map(d => d.vendas.percentualDoTotal)) + 5
                              }
                            }
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Lista dos dias com detalhes */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📅 Detalhamento por Dia
                    </Typography>
                    <List>
                      {tendenciasSemanais.semanaAtual.map((dia, index) => (
                        <React.Fragment key={dia.dia}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: dia.dia === tendenciasSemanais.insights.melhorDiaSemana.dia ? 'success.main' :
                                        dia.dia === tendenciasSemanais.insights.piorDiaSemana.dia ? 'error.main' : 'primary.main'
                              }}>
                                <CalendarIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {dia.dia.charAt(0).toUpperCase() + dia.dia.slice(1)}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={`${dia.vendas.percentualDoTotal.toFixed(1)}%`}
                                    color={dia.vendas.percentualDoTotal > 20 ? 'success' : 
                                           dia.vendas.percentualDoTotal > 10 ? 'warning' : 'default'}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    Vendas: {formatCurrency(dia.vendas.total)} • 
                                    Comandas: {dia.comandas.quantidade} • 
                                    Ticket: {formatCurrency(dia.comandas.ticketMedio)}
                                  </Typography>
                                  {dia.horariosPico.length > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      Pico: {dia.horariosPico[0].hora}h ({formatCurrency(dia.horariosPico[0].vendas)})
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ textAlign: 'right' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={dia.vendas.percentualDoTotal * 5} // Escala visual
                                  sx={{ width: 60, mb: 0.5 }}
                                  color={dia.vendas.percentualDoTotal > 20 ? 'success' : 
                                         dia.vendas.percentualDoTotal > 10 ? 'warning' : 'inherit'}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {dia.profissionaisMaisAtivos.length} profissionais
                                </Typography>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < tendenciasSemanais.semanaAtual.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          ) : (
            <Alert severity="warning">
              Dados de tendências semanais não disponíveis
            </Alert>
          )}
        </TabPanel>

        {/* Tab 2: Análise Comparativa */}
        <TabPanel value={tabAtiva} index={1}>
          <Typography variant="h6" gutterBottom>
            🔍 Análise Comparativa de Períodos
          </Typography>
          
          {metrics ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Comparativo Mensal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Em desenvolvimento - Comparativos de períodos históricos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Análise de Sazonalidade
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Em desenvolvimento - Padrões sazonais detectados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              Carregando métricas comparativas...
            </Alert>
          )}
        </TabPanel>

        {/* Tab 3: Insights Estratégicos */}
        <TabPanel value={tabAtiva} index={2}>
          {tendenciasSemanais?.insights && (
            <Grid container spacing={3}>
              
              {/* Insights principais */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🧠 Insights Automáticos
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <SuccessIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Horário Mais Produtivo"
                          secondary={`${tendenciasSemanais.insights.horarioMaisProdutivo.hora}h na ${tendenciasSemanais.insights.horarioMaisProdutivo.dia} - ${formatCurrency(tendenciasSemanais.insights.horarioMaisProdutivo.vendas)}`}
                        />
                      </ListItem>
                      
                      {tendenciasSemanais.insights.padroesSazonais.map((padrao, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                              <InfoIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={padrao} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Oportunidades identificadas */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💡 Oportunidades Identificadas
                    </Typography>
                    <List>
                      {tendenciasSemanais.insights.oportunidades.map((oportunidade, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              <WarningIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={oportunidade} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Previsões */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔮 Previsões dos Próximos Dias
                    </Typography>
                    <Grid container spacing={2}>
                      {tendenciasSemanais.previsoes?.proximosDias.map((previsao, index) => (
                        <Grid item xs={12} sm={4} key={index}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="primary">
                                {previsao.dia}
                              </Typography>
                              <Typography variant="h5" gutterBottom>
                                {formatCurrency(previsao.vendasEsperadas)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={previsao.confianca}
                                  sx={{ width: 60 }}
                                  color={previsao.confianca > 70 ? 'success' : 
                                         previsao.confianca > 50 ? 'warning' : 'error'}
                                />
                                <Typography variant="caption">
                                  {previsao.confianca}% confiança
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Box>
  )
})

export default AbaComparativos 