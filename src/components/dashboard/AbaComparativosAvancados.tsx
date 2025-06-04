'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Button
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Timeline,
  Analytics,
  Group,
  Assignment,
  AttachMoney,
  CalendarMonth,
  Insights,
  Refresh,
  Compare
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { 
  analisesTemporaisService, 
  ComparativoTemporal, 
  TendenciaAnalise, 
  RankingServicos,
  AnalyticsClientes 
} from '@/services/analisesTemporaisService'
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
)

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AbaComparativosAvancados() {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState<Date>(subDays(new Date(), 7))
  const [dataFim, setDataFim] = useState<Date>(new Date())
  
  // Estados dos dados
  const [comparativo, setComparativo] = useState<ComparativoTemporal | null>(null)
  const [tendencias, setTendencias] = useState<TendenciaAnalise[]>([])
  const [rankingServicos, setRankingServicos] = useState<RankingServicos | null>(null)
  const [analyticsClientes, setAnalyticsClientes] = useState<AnalyticsClientes | null>(null)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTrendIcon = (tendencia: 'CRESCIMENTO' | 'QUEDA' | 'ESTAVEL') => {
    switch (tendencia) {
      case 'CRESCIMENTO':
        return <TrendingUp color="success" fontSize="small" />
      case 'QUEDA':
        return <TrendingDown color="error" fontSize="small" />
      default:
        return <Remove color="action" fontSize="small" />
    }
  }

  const getTrendColor = (tendencia: 'CRESCIMENTO' | 'QUEDA' | 'ESTAVEL') => {
    switch (tendencia) {
      case 'CRESCIMENTO':
        return 'success.main'
      case 'QUEDA':
        return 'error.main'
      default:
        return 'text.secondary'
    }
  }

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Carregar dados em paralelo
      const [comparativoData, vendasTrend, comandasTrend, servicosData, clientesData] = await Promise.all([
        analisesTemporaisService.criarComparativoTemporal(dataInicio, dataFim),
        analisesTemporaisService.analisarTendencias('VENDAS', { 
          inicio: dataInicio, 
          fim: dataFim, 
          descricao: 'Período selecionado',
          totalDias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
        }),
        analisesTemporaisService.analisarTendencias('COMANDAS', {
          inicio: dataInicio,
          fim: dataFim,
          descricao: 'Período selecionado', 
          totalDias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
        }),
        analisesTemporaisService.gerarRankingServicos({
          inicio: dataInicio,
          fim: dataFim,
          descricao: 'Período selecionado',
          totalDias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
        }),
        analisesTemporaisService.gerarAnalyticsClientes({
          inicio: dataInicio,
          fim: dataFim,
          descricao: 'Período selecionado',
          totalDias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
        })
      ])

      setComparativo(comparativoData)
      setTendencias([vendasTrend, comandasTrend])
      setRankingServicos(servicosData)
      setAnalyticsClientes(clientesData)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [dataInicio, dataFim])

  // Dados para gráficos
  const getTendenciaChartData = (tendencia: TendenciaAnalise) => {
    return {
      labels: tendencia.dados.map(d => format(new Date(d.data), 'dd/MM')),
      datasets: [
        {
          label: `${tendencia.tipo} - Valores`,
          data: tendencia.dados.map(d => d.valor),
          borderColor: tendencia.tendencia.direcao === 'CRESCENTE' ? 'rgba(76, 175, 80, 1)' : 
                      tendencia.tendencia.direcao === 'DECRESCENTE' ? 'rgba(244, 67, 54, 1)' : 
                      'rgba(158, 158, 158, 1)',
          backgroundColor: tendencia.tendencia.direcao === 'CRESCENTE' ? 'rgba(76, 175, 80, 0.1)' : 
                          tendencia.tendencia.direcao === 'DECRESCENTE' ? 'rgba(244, 67, 54, 0.1)' : 
                          'rgba(158, 158, 158, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Meta',
          data: tendencia.dados.map(d => d.meta || null),
          borderColor: 'rgba(255, 193, 7, 1)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    }
  }

  const getServicosChartData = () => {
    if (!rankingServicos) return { labels: [], datasets: [] }
    
    return {
      labels: rankingServicos.topQuantidade.map(s => s.nome),
      datasets: [
        {
          label: 'Quantidade',
          data: rankingServicos.topQuantidade.map(s => s.quantidade),
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 2
        }
      ]
    }
  }

  const getClientesSegmentacaoData = () => {
    if (!analyticsClientes) return { labels: [], datasets: [] }

    const segmentacao = analyticsClientes.segmentacao
    return {
      labels: ['Novos', 'Recorrentes', 'VIPs', 'Em Risco'],
      datasets: [
        {
          data: [
            segmentacao.novos.quantidade,
            segmentacao.recorrentes.quantidade,
            segmentacao.vips.quantidade,
            segmentacao.emRisco.quantidade
          ],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(25, 118, 210, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(244, 67, 54, 0.8)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(25, 118, 210, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(244, 67, 54, 1)'
          ],
          borderWidth: 2
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
          <Typography variant="body1" color="text.secondary">
            Carregando análises comparativas...
          </Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Análises Comparativas Avançadas
      </Typography>

      {/* Controles de Período */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Início"
                  value={dataInicio}
                  onChange={(newValue) => newValue && setDataInicio(new Date(newValue.toString()))}
                  format="dd/MM/yyyy"
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Fim"
                  value={dataFim}
                  onChange={(newValue) => newValue && setDataFim(new Date(newValue.toString()))}
                  format="dd/MM/yyyy"
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={carregarDados}
                disabled={loading}
                size="small"
                fullWidth
              >
                Atualizar
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<CalendarMonth />}
                  label={`${Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))} dias`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<Compare />}
                  label="vs Período Anterior"
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cards de Resumo Comparativo */}
      {comparativo && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Vendas</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(comparativo.metricas.vendas.atual)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getTrendIcon(comparativo.metricas.vendas.tendencia)}
                  <Typography 
                    variant="body2" 
                    sx={{ ml: 0.5, color: getTrendColor(comparativo.metricas.vendas.tendencia) }}
                  >
                    {comparativo.metricas.vendas.percentual > 0 ? '+' : ''}
                    {comparativo.metricas.vendas.percentual.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  vs {formatCurrency(comparativo.metricas.vendas.anterior)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assignment color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Comandas</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {comparativo.metricas.comandas.atual}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color={comparativo.metricas.comandas.crescimento > 0 ? 'success' : 'error'} fontSize="small" />
                  <Typography 
                    variant="body2" 
                    sx={{ ml: 0.5, color: comparativo.metricas.comandas.crescimento > 0 ? 'success.main' : 'error.main' }}
                  >
                    {comparativo.metricas.comandas.crescimento > 0 ? '+' : ''}
                    {comparativo.metricas.comandas.crescimento.toFixed(0)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  vs {comparativo.metricas.comandas.anterior}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Group color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Clientes</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {comparativo.metricas.clientes.unicos.atual}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color={comparativo.metricas.clientes.unicos.crescimento > 0 ? 'success' : 'error'} fontSize="small" />
                  <Typography 
                    variant="body2" 
                    sx={{ ml: 0.5, color: comparativo.metricas.clientes.unicos.crescimento > 0 ? 'success.main' : 'error.main' }}
                  >
                    {comparativo.metricas.clientes.unicos.crescimento > 0 ? '+' : ''}
                    {comparativo.metricas.clientes.unicos.crescimento.toFixed(0)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  vs {comparativo.metricas.clientes.unicos.anterior}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Analytics color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Ticket Médio</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(comparativo.metricas.comandas.ticketMedio.atual)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color={comparativo.metricas.comandas.ticketMedio.crescimento > 0 ? 'success' : 'error'} fontSize="small" />
                  <Typography 
                    variant="body2" 
                    sx={{ ml: 0.5, color: comparativo.metricas.comandas.ticketMedio.crescimento > 0 ? 'success.main' : 'error.main' }}
                  >
                    {comparativo.metricas.comandas.ticketMedio.crescimento > 0 ? '+' : ''}
                    {formatCurrency(comparativo.metricas.comandas.ticketMedio.crescimento)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  vs {formatCurrency(comparativo.metricas.comandas.ticketMedio.anterior)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Insights e Recomendações */}
      {comparativo && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Alert severity="info" icon={<Insights />}>
              <Typography variant="subtitle2" fontWeight="bold">
                Insights Principais
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                {comparativo.insights.map((insight, index) => (
                  <li key={index}>
                    <Typography variant="body2">{insight}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert severity="warning">
              <Typography variant="subtitle2" fontWeight="bold">
                Recomendações
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                {comparativo.recomendacoes.map((recomendacao, index) => (
                  <li key={index}>
                    <Typography variant="body2">{recomendacao}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          </Grid>
        </Grid>
      )}

      {/* Abas de Análise Detalhada */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Timeline />} label="Tendências" />
            <Tab icon={<Assignment />} label="Serviços" />
            <Tab icon={<Group />} label="Clientes" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Análise de Tendências */}
          <Grid container spacing={3}>
            {tendencias.map((tendencia, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tendência de {tendencia.tipo}
                    </Typography>
                    <Box sx={{ height: 300, mb: 2 }}>
                      <Line data={getTendenciaChartData(tendencia)} options={chartOptions} />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Direção
                        </Typography>
                        <Chip 
                          label={tendencia.tendencia.direcao}
                          color={
                            tendencia.tendencia.direcao === 'CRESCENTE' ? 'success' :
                            tendencia.tendencia.direcao === 'DECRESCENTE' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Confiança
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {tendencia.tendencia.confianca}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Ranking de Serviços */}
          {rankingServicos && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Serviços por Quantidade
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <Bar data={getServicosChartData()} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Analytics de Serviços
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Mais Popular
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rankingServicos.analytics.servicoMaisPopular}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Mais Lucrativo
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rankingServicos.analytics.servicoMaisLucrativo}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Categoria Destaque
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rankingServicos.analytics.categoriaDestaque}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Crescimento Médio
                        </Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          color={rankingServicos.analytics.crescimentoMedio > 0 ? 'success.main' : 'error.main'}
                        >
                          {rankingServicos.analytics.crescimentoMedio > 0 ? '+' : ''}
                          {rankingServicos.analytics.crescimentoMedio.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Serviço</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Receita</TableCell>
                        <TableCell align="right">Crescimento</TableCell>
                        <TableCell align="right">% do Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rankingServicos.topQuantidade.map((servico) => (
                        <TableRow key={servico.id} hover>
                          <TableCell>{servico.nome}</TableCell>
                          <TableCell>
                            <Chip label={servico.categoria} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{servico.quantidade}</TableCell>
                          <TableCell align="right">{formatCurrency(servico.receita)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {servico.crescimento > 0 ? 
                                <TrendingUp color="success" fontSize="small" /> : 
                                <TrendingDown color="error" fontSize="small" />
                              }
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  ml: 0.5,
                                  color: servico.crescimento > 0 ? 'success.main' : 'error.main'
                                }}
                              >
                                {servico.crescimento > 0 ? '+' : ''}
                                {servico.crescimento}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{servico.percentualTotal.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Analytics de Clientes */}
          {analyticsClientes && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Segmentação de Clientes
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Doughnut 
                        data={getClientesSegmentacaoData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Analytics Detalhados
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                          <Typography variant="h4" fontWeight="bold" color="success.dark">
                            {analyticsClientes.segmentacao.novos.quantidade}
                          </Typography>
                          <Typography variant="body2" color="success.dark">
                            Novos Clientes
                          </Typography>
                          <Typography variant="caption" color="success.dark">
                            Ticket: {formatCurrency(analyticsClientes.segmentacao.novos.ticketMedio)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                          <Typography variant="h4" fontWeight="bold" color="info.dark">
                            {analyticsClientes.segmentacao.recorrentes.quantidade}
                          </Typography>
                          <Typography variant="body2" color="info.dark">
                            Recorrentes
                          </Typography>
                          <Typography variant="caption" color="info.dark">
                            Frequência: {analyticsClientes.segmentacao.recorrentes.frequenciaMedia.toFixed(1)}x/mês
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
                          <Typography variant="h4" fontWeight="bold" color="secondary.dark">
                            {analyticsClientes.segmentacao.vips.quantidade}
                          </Typography>
                          <Typography variant="body2" color="secondary.dark">
                            VIPs
                          </Typography>
                          <Typography variant="caption" color="secondary.dark">
                            Ticket: {formatCurrency(analyticsClientes.segmentacao.vips.ticketMedio)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                          <Typography variant="h4" fontWeight="bold" color="error.dark">
                            {analyticsClientes.segmentacao.emRisco.quantidade}
                          </Typography>
                          <Typography variant="body2" color="error.dark">
                            Em Risco
                          </Typography>
                          <Typography variant="caption" color="error.dark">
                            {analyticsClientes.segmentacao.emRisco.diasSemVisita} dias sem visita
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Métricas de Retenção
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Taxa 30 dias
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analyticsClientes.retencao.taxa30dias}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" fontWeight="bold">
                          {analyticsClientes.retencao.taxa30dias}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Taxa 60 dias
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analyticsClientes.retencao.taxa60dias}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" fontWeight="bold">
                          {analyticsClientes.retencao.taxa60dias}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Churn Rate
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analyticsClientes.retencao.churnRate}
                          color="error"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {analyticsClientes.retencao.churnRate}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          LTV Médio
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          {formatCurrency(analyticsClientes.retencao.ltv)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Card>
    </Box>
  )
} 