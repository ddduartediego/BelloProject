'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Star,
  Schedule,
  AttachMoney,
  Assignment,
  BarChart,
  Person,
  Visibility
} from '@mui/icons-material'
import { MetricasProfissionais, DashboardConfig, ProfissionalRanking } from '@/types/dashboard'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
)

interface AbaProfissionaisProps {
  metrics: MetricasProfissionais
  loading: boolean
  config: DashboardConfig
}

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
      id={`profissionais-tabpanel-${index}`}
      aria-labelledby={`profissionais-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AbaProfissionais({
  metrics,
  loading,
  config
}: AbaProfissionaisProps) {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 300,
          flexDirection: 'column',
          gap: 2 
        }}
      >
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        <Typography variant="body1" color="text.secondary">
          Carregando métricas de profissionais...
        </Typography>
      </Box>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp color="success" fontSize="small" />
    if (value < 0) return <TrendingDown color="error" fontSize="small" />
    return <Remove color="action" fontSize="small" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'success.main'
    if (value < 0) return 'error.main'
    return 'text.secondary'
  }

  // Dados para gráficos
  const getVendasChartData = () => {
    const nomes = metrics.ranking.map(p => p.nome)
    const vendas = metrics.ranking.map(p => p.metricas.vendas.semana)
    
    return {
      labels: nomes,
      datasets: [
        {
          label: 'Vendas da Semana',
          data: vendas,
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 2
        }
      ]
    }
  }

  const getOcupacaoChartData = () => {
    const nomes = metrics.ranking.map(p => p.nome)
    const ocupacao = metrics.ranking.map(p => p.metricas.ocupacao.percentual)
    
    return {
      labels: nomes,
      datasets: [
        {
          label: 'Ocupação (%)',
          data: ocupacao,
          backgroundColor: ocupacao.map(val => 
            val > 80 ? 'rgba(76, 175, 80, 0.6)' : 
            val > 60 ? 'rgba(255, 193, 7, 0.6)' : 'rgba(244, 67, 54, 0.6)'
          ),
          borderColor: ocupacao.map(val => 
            val > 80 ? 'rgba(76, 175, 80, 1)' : 
            val > 60 ? 'rgba(255, 193, 7, 1)' : 'rgba(244, 67, 54, 1)'
          ),
          borderWidth: 2
        }
      ]
    }
  }

  const getRadarChartData = () => {
    const topTres = metrics.ranking.slice(0, 3)
    
    return {
      labels: ['Vendas', 'Comandas', 'Ocupação', 'Satisfação', 'Ticket Médio'],
      datasets: topTres.map((prof, index) => ({
        label: prof.nome,
        data: [
          prof.metricas.vendas.semana / 100, // Normalizar para 0-100
          prof.metricas.comandas.semana * 2, // Ajustar escala
          prof.metricas.ocupacao.percentual,
          prof.metricas.satisfacao.media * 20, // Converter 0-5 para 0-100
          prof.metricas.comandas.ticketMedio / 10 // Ajustar escala
        ],
        backgroundColor: `rgba(${index === 0 ? '25, 118, 210' : index === 1 ? '76, 175, 80' : '156, 39, 176'}, 0.2)`,
        borderColor: `rgba(${index === 0 ? '25, 118, 210' : index === 1 ? '76, 175, 80' : '156, 39, 176'}, 1)`,
        pointBackgroundColor: `rgba(${index === 0 ? '25, 118, 210' : index === 1 ? '76, 175, 80' : '156, 39, 176'}, 1)`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `rgba(${index === 0 ? '25, 118, 210' : index === 1 ? '76, 175, 80' : '156, 39, 176'}, 1)`
      }))
    }
  }

  const getSatisfacaoChartData = () => {
    const labels = ['Excelente (4.5-5.0)', 'Bom (3.5-4.4)', 'Regular (2.5-3.4)', 'Ruim (0-2.4)']
    const faixas = [0, 0, 0, 0]
    
    metrics.ranking.forEach(prof => {
      const satisfacao = prof.metricas.satisfacao.media
      if (satisfacao >= 4.5) faixas[0]++
      else if (satisfacao >= 3.5) faixas[1]++
      else if (satisfacao >= 2.5) faixas[2]++
      else faixas[3]++
    })
    
    return {
      labels,
      datasets: [
        {
          data: faixas,
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(244, 67, 54, 0.8)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(255, 152, 0, 1)',
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

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  }

  const CardMetricaProfissional = ({ profissional }: { profissional: ProfissionalRanking }) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        {/* Header com Avatar e Posição */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ position: 'relative', mr: 2 }}>
            <Avatar 
              src={profissional.avatar} 
              sx={{ width: 60, height: 60 }}
            >
              {profissional.nome.charAt(0)}
            </Avatar>
            <Chip
              label={`#${profissional.posicao}`}
              size="small"
              color={profissional.posicao === 1 ? 'primary' : 'default'}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                fontWeight: 'bold'
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {profissional.nome}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={profissional.status} 
                size="small" 
                color={profissional.status === 'ATIVO' ? 'success' : 'default'}
                sx={{ fontSize: '0.7rem' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star color="warning" fontSize="small" />
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {profissional.metricas.satisfacao.media.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Métricas Principais */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vendas Semana
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(profissional.metricas.vendas.semana)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {getTrendIcon(profissional.metricas.vendas.crescimentoSemanal)}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 0.5,
                    color: getTrendColor(profissional.metricas.vendas.crescimentoSemanal)
                  }}
                >
                  {profissional.metricas.vendas.crescimentoSemanal > 0 ? '+' : ''}
                  {profissional.metricas.vendas.crescimentoSemanal}%
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Comandas
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {profissional.metricas.comandas.semana}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ticket: {formatCurrency(profissional.metricas.comandas.ticketMedio)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Ocupação */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ocupação
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {profissional.metricas.ocupacao.percentual.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={profissional.metricas.ocupacao.percentual}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: profissional.metricas.ocupacao.percentual > 80 ? 'success.main' : 
                                profissional.metricas.ocupacao.percentual > 60 ? 'warning.main' : 'error.main'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {profissional.metricas.ocupacao.horasAgendadas}h / {profissional.metricas.ocupacao.horasDisponiveis}h
          </Typography>
        </Box>

        {/* Ações */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Tooltip title="Ver Detalhes">
            <IconButton size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Análise">
            <IconButton size="small">
              <BarChart />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analytics de Profissionais
      </Typography>
      
      {/* Cards de Estatísticas Gerais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Profissionais
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {metrics.estatisticas.totalProfissionais}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Média Vendas/Dia
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(metrics.estatisticas.mediaVendasDia)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ticket Médio
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(metrics.estatisticas.mediaTicket)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ocupação Geral
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {metrics.estatisticas.ocupacaoGeral}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Abas de Análise */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Ranking" />
            <Tab label="Desempenho Individual" />
            <Tab label="Comparativos" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Ranking de Profissionais */}
          <Grid container spacing={3}>
            {metrics.ranking.map((profissional) => (
              <Grid item xs={12} sm={6} md={4} key={profissional.id}>
                <CardMetricaProfissional profissional={profissional} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Tabela Detalhada */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Profissional</TableCell>
                  <TableCell align="right">Vendas Hoje</TableCell>
                  <TableCell align="right">Vendas Semana</TableCell>
                  <TableCell align="right">Comandas</TableCell>
                  <TableCell align="right">Ticket Médio</TableCell>
                  <TableCell align="right">Ocupação</TableCell>
                  <TableCell align="right">Satisfação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.ranking.map((prof) => (
                  <TableRow key={prof.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={prof.avatar} sx={{ width: 32, height: 32, mr: 2 }}>
                          {prof.nome.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {prof.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{prof.posicao}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(prof.metricas.vendas.hoje)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(prof.metricas.vendas.semana)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {getTrendIcon(prof.metricas.vendas.crescimentoSemanal)}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            ml: 0.5,
                            color: getTrendColor(prof.metricas.vendas.crescimentoSemanal)
                          }}
                        >
                          {prof.metricas.vendas.crescimentoSemanal > 0 ? '+' : ''}
                          {prof.metricas.vendas.crescimentoSemanal}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {prof.metricas.comandas.semana}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(prof.metricas.comandas.ticketMedio)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {prof.metricas.ocupacao.percentual.toFixed(0)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Star color="warning" fontSize="small" />
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {prof.metricas.satisfacao.media.toFixed(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Análise Comparativa Visual
          </Typography>
          
          <Grid container spacing={3}>
            {/* Gráfico de Vendas */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vendas por Profissional (Semana)
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar data={getVendasChartData()} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico de Ocupação */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Taxa de Ocupação por Profissional
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar data={getOcupacaoChartData()} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Radar Chart - Top 3 */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: 450 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Comparativo Multidimensional - Top 3 Profissionais
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Análise de 5 métricas principais dos melhores profissionais
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <Radar data={getRadarChartData()} options={radarOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Distribuição de Satisfação */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: 450 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribuição de Satisfação
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Classificação por faixas de avaliação
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Doughnut 
                      data={getSatisfacaoChartData()} 
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

            {/* Cards de Insights */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Insights e Recomendações
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
                          🏆 Destaque da Semana
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          {metrics.ranking[0]?.nome} lidera com {formatCurrency(metrics.ranking[0]?.metricas.vendas.semana || 0)} em vendas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">
                          ⚠️ Atenção Necessária
                        </Typography>
                        <Typography variant="body2" color="warning.dark">
                          {metrics.ranking.filter(p => p.metricas.ocupacao.percentual < 60).length} profissional(is) com ocupação baixa
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="info.dark">
                          📊 Oportunidade
                        </Typography>
                        <Typography variant="body2" color="info.dark">
                          Ticket médio geral: {formatCurrency(metrics.estatisticas.mediaTicket)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Análise Detalhada
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" paragraph>
                        <strong>Performance de Vendas:</strong> O ranking atual mostra uma distribuição equilibrada de performance. 
                        O líder está {((metrics.ranking[0]?.metricas.vendas.semana || 0) / (metrics.ranking[1]?.metricas.vendas.semana || 1) * 100 - 100).toFixed(0)}% 
                        acima do segundo colocado.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Ocupação:</strong> A ocupação média da equipe está em {metrics.estatisticas.ocupacaoGeral.toFixed(0)}%. 
                        Profissionais com ocupação acima de 80% demonstram alta demanda e eficiência.
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" paragraph>
                        <strong>Satisfação do Cliente:</strong> A satisfação média da equipe está em {
                          (metrics.ranking.reduce((acc, p) => acc + p.metricas.satisfacao.media, 0) / metrics.ranking.length).toFixed(1)
                        } estrelas, indicando um bom nível de qualidade no atendimento.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Oportunidades:</strong> Focar no desenvolvimento de profissionais com menor ocupação e 
                        implementar estratégias para aumentar o ticket médio geral.
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  )
} 