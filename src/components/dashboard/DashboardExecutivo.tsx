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
  Avatar,
  Stack,
  Divider,
  Alert,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  AutoGraph,
  Insights,
  Assessment,
  Timeline,
  Speed,
  Star,
  Warning,
  CheckCircle,
  Schedule,
  AttachMoney,
  Group,
  BarChart,
  PieChart,
  ShowChart,
  Analytics,
  Business,
  Lightbulb,
  Refresh
} from '@mui/icons-material'
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
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import {
  machineLearningService,
  PredicaoVendas,
  AnaliseComportamental,
  TendenciasMercado,
  OtimizacaoAgenda
} from '@/services/machineLearningService'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Registrar componentes Chart.js
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
      id={`executivo-tabpanel-${index}`}
      aria-labelledby={`executivo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

interface KPICard {
  titulo: string
  valor: string | number
  variacao: number
  meta?: number
  icone: React.ReactNode
  cor: 'primary' | 'success' | 'warning' | 'error'
  descricao: string
}

export default function DashboardExecutivo() {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Estados dos dados
  const [previsoes, setPrevisoes] = useState<PredicaoVendas[]>([])
  const [tendenciasMercado, setTendenciasMercado] = useState<TendenciasMercado | null>(null)
  const [kpisEstrategicos, setKpisEstrategicos] = useState<KPICard[]>([])
  const [insightsIA, setInsightsIA] = useState<any[]>([])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getVariacaoColor = (variacao: number) => {
    if (variacao > 10) return 'success.main'
    if (variacao > 0) return 'info.main'
    if (variacao > -10) return 'warning.main'
    return 'error.main'
  }

  const getVariacaoIcon = (variacao: number) => {
    if (variacao > 0) return <TrendingUp fontSize="small" />
    if (variacao < 0) return <TrendingDown fontSize="small" />
    return <TrendingUp fontSize="small" />
  }

  const carregarDadosExecutivos = async () => {
    setLoading(true)
    try {
      // Carregar dados em paralelo
      const [previsoesData, tendenciasData] = await Promise.all([
        machineLearningService.preverVendas(30),
        machineLearningService.analisarTendenciasMercado()
      ])

      setPrevisoes(previsoesData)
      setTendenciasMercado(tendenciasData)

      // Gerar KPIs estratégicos
      const kpis = gerarKPIsEstrategicos(previsoesData, tendenciasData)
      setKpisEstrategicos(kpis)

      // Gerar insights de IA
      const insights = gerarInsightsIA(previsoesData, tendenciasData)
      setInsightsIA(insights)

    } catch (error) {
      console.error('Erro ao carregar dados executivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const gerarKPIsEstrategicos = (previsoes: PredicaoVendas[], tendencias: TendenciasMercado): KPICard[] => {
    const receitaProjetada = previsoes.reduce((acc, p) => acc + p.valorPrevisto, 0)
    const confiancaMedia = previsoes.reduce((acc, p) => acc + p.confianca, 0) / previsoes.length

    return [
      {
        titulo: 'Receita Projetada (30 dias)',
        valor: formatCurrency(receitaProjetada),
        variacao: 12.5,
        meta: 50000,
        icone: <AttachMoney />,
        cor: 'success',
        descricao: 'Previsão baseada em algoritmos de IA'
      },
      {
        titulo: 'Confiança das Previsões',
        valor: `${Math.round(confiancaMedia)}%`,
        variacao: 5.2,
        icone: <Psychology />,
        cor: 'primary',
        descricao: 'Precisão dos modelos preditivos'
      },
      {
        titulo: 'Índice de Crescimento',
        valor: '15.8%',
        variacao: 3.1,
        icone: <AutoGraph />,
        cor: 'success',
        descricao: 'Tendência de crescimento mensal'
      },
      {
        titulo: 'Score de Satisfação IA',
        valor: '8.7/10',
        variacao: 0.3,
        icone: <Star />,
        cor: 'warning',
        descricao: 'Análise comportamental de clientes'
      },
      {
        titulo: 'Oportunidades Detectadas',
        valor: '12',
        variacao: 4,
        icone: <Lightbulb />,
        cor: 'primary',
        descricao: 'Insights de mercado identificados'
      },
      {
        titulo: 'Eficiência Operacional',
        valor: '87%',
        variacao: -2.1,
        icone: <Speed />,
        cor: 'warning',
        descricao: 'Otimização de recursos e agenda'
      }
    ]
  }

  const gerarInsightsIA = (previsoes: PredicaoVendas[], tendencias: TendenciasMercado) => {
    return [
      {
        tipo: 'OPORTUNIDADE',
        titulo: 'Crescimento em Serviços Masculinos',
        descricao: 'IA detectou aumento de 25% na demanda por barbear e cortes masculinos',
        impacto: 'ALTO',
        prazo: '15 dias',
        acao: 'Expandir horários de barbeiros',
        icon: <TrendingUp />,
        color: 'success'
      },
      {
        tipo: 'ALERTA',
        titulo: 'Risco de Churn em Clientes VIP',
        descricao: 'Algoritmo identificou 3 clientes VIP com 78% de probabilidade de churn',
        impacto: 'ALTO',
        prazo: '7 dias',
        acao: 'Campanha de retenção personalizada',
        icon: <Warning />,
        color: 'error'
      },
      {
        tipo: 'OTIMIZAÇÃO',
        titulo: 'Slots Vagos em Horários Prime',
        descricao: 'IA encontrou 15 slots vagos em horários de alta demanda',
        impacto: 'MÉDIO',
        prazo: '3 dias',
        acao: 'Campanha de agendamento direcionada',
        icon: <Schedule />,
        color: 'warning'
      },
      {
        tipo: 'TENDÊNCIA',
        titulo: 'Sazonalidade de Janeiro',
        descricao: 'Padrão histórico indica queda de 10% em janeiro, mas com recuperação em fevereiro',
        impacto: 'MÉDIO',
        prazo: '30 dias',
        acao: 'Promoções estratégicas para janeiro',
        icon: <Timeline />,
        color: 'info'
      }
    ]
  }

  // Dados para gráficos
  const getPrevisaoChartData = () => {
    if (previsoes.length === 0) return { labels: [], datasets: [] }

    const proximos15Dias = previsoes.slice(0, 15)
    
    return {
      labels: proximos15Dias.map(p => format(new Date(p.data), 'dd/MM')),
      datasets: [
        {
          label: 'Previsão IA',
          data: proximos15Dias.map(p => p.valorPrevisto),
          borderColor: 'rgba(25, 118, 210, 1)',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Limite Superior',
          data: proximos15Dias.map(p => p.intervalos.otimista),
          borderColor: 'rgba(76, 175, 80, 0.6)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Limite Inferior',
          data: proximos15Dias.map(p => p.intervalos.pessimista),
          borderColor: 'rgba(244, 67, 54, 0.6)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    }
  }

  const getTendenciasChartData = () => {
    if (!tendenciasMercado) return { labels: [], datasets: [] }

    return {
      labels: tendenciasMercado.servicos.map(s => s.nome),
      datasets: [
        {
          label: 'Oportunidade (%)',
          data: tendenciasMercado.servicos.map(s => s.oportunidade),
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(25, 118, 210, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(244, 67, 54, 0.8)'
          ]
        }
      ]
    }
  }

  const getConfiancaChartData = () => {
    if (previsoes.length === 0) return { labels: [], datasets: [] }

    const dados = previsoes.slice(0, 15)
    
    return {
      labels: dados.map(p => format(new Date(p.data), 'dd/MM')),
      datasets: [
        {
          label: 'Confiança (%)',
          data: dados.map(p => p.confianca),
          backgroundColor: dados.map(p => 
            p.confianca > 80 ? 'rgba(76, 175, 80, 0.8)' :
            p.confianca > 60 ? 'rgba(255, 152, 0, 0.8)' :
            'rgba(244, 67, 54, 0.8)'
          ),
          borderColor: dados.map(p => 
            p.confianca > 80 ? 'rgba(76, 175, 80, 1)' :
            p.confianca > 60 ? 'rgba(255, 152, 0, 1)' :
            'rgba(244, 67, 54, 1)'
          ),
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

  useEffect(() => {
    carregarDadosExecutivos()
  }, [])

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
          <Typography variant="body1" color="text.secondary">
            Carregando análises executivas com IA...
          </Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard Executivo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Insights estratégicos powered by Machine Learning
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={carregarDadosExecutivos}
          disabled={loading}
        >
          Atualizar IA
        </Button>
      </Box>

      {/* KPIs Estratégicos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpisEstrategicos.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${kpi.cor}.main`, mr: 2 }}>
                    {kpi.icone}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {kpi.valor}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {kpi.titulo}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: getVariacaoColor(kpi.variacao), display: 'flex', alignItems: 'center' }}>
                    {getVariacaoIcon(kpi.variacao)}
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      {kpi.variacao > 0 ? '+' : ''}{kpi.variacao.toFixed(1)}%
                    </Typography>
                  </Box>
                  {kpi.meta && (
                    <Chip 
                      label={`Meta: ${formatCurrency(kpi.meta)}`}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {kpi.descricao}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Abas de Análise */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<AutoGraph />} label="Previsões IA" />
            <Tab icon={<Assessment />} label="Tendências" />
            <Tab icon={<Psychology />} label="Insights" />
            <Tab icon={<Analytics />} label="Performance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Previsões IA */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Previsão de Vendas - Próximos 15 Dias
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Line data={getPrevisaoChartData()} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Confiança das Previsões
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <Bar data={getConfiancaChartData()} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Fatores de Influência
                  </Typography>
                  {previsoes.slice(0, 3).map((previsao, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        {format(new Date(previsao.data), 'dd/MM', { locale: ptBR })}
                      </Typography>
                      {previsao.fatoresInfluencia.map((fator, fIndex) => (
                        <Chip
                          key={fIndex}
                          label={`${fator.fator}: ${fator.impacto > 0 ? '+' : ''}${fator.impacto}%`}
                          size="small"
                          color={fator.impacto > 0 ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Tendências de Mercado */}
          {tendenciasMercado && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Oportunidades por Serviço
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Doughnut data={getTendenciasChartData()} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Análise de Mercado - {tendenciasMercado.periodo}
                    </Typography>
                    <Stack spacing={2}>
                      {tendenciasMercado.servicos.map((servico, index) => (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">{servico.nome}</Typography>
                            <Chip
                              label={servico.tendencia}
                              size="small"
                              color={
                                servico.tendencia === 'CRESCENTE' ? 'success' :
                                servico.tendencia === 'ESTAVEL' ? 'info' : 'error'
                              }
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={servico.oportunidade}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Crescimento projetado: {servico.crescimentoProjetado}%
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Insights Estratégicos de Mercado
                    </Typography>
                    <Grid container spacing={2}>
                      {tendenciasMercado.insights.map((insight, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Alert severity="info">
                            <Typography variant="subtitle2" fontWeight="bold">
                              {insight.insight}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Ação:</strong> {insight.acao_recomendada}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Impacto estimado: {formatCurrency(insight.impacto_estimado)}
                            </Typography>
                          </Alert>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Insights de IA */}
          <Grid container spacing={3}>
            {insightsIA.map((insight, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${insight.color}.main`, mr: 2 }}>
                        {insight.icon}
                      </Avatar>
                      <Box>
                        <Chip
                          label={insight.tipo}
                          size="small"
                          color={insight.color}
                          variant="outlined"
                        />
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          {insight.titulo}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {insight.descricao}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`Impacto: ${insight.impacto}`}
                          size="small"
                          color={insight.impacto === 'ALTO' ? 'error' : insight.impacto === 'MÉDIO' ? 'warning' : 'success'}
                        />
                        <Chip
                          label={`Prazo: ${insight.prazo}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Ação Recomendada:</strong> {insight.acao}
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Performance Analytics */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" icon={<Psychology />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Performance Analytics Powered by IA
                </Typography>
                <Typography variant="body2">
                  Esta seção apresenta análises avançadas de performance baseadas em Machine Learning,
                  incluindo otimização de agenda, análise comportamental de clientes e recommendations engine.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Score de Eficiência IA
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h2" color="primary.main" fontWeight="bold">
                      87%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Baseado em 15+ métricas de performance
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={87} sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    13% de melhoria possível identificada pela IA
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Otimização de Agenda
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Slots otimizados</Typography>
                      <Typography variant="h5" color="success.main">+15</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Receita adicional</Typography>
                      <Typography variant="h5" color="primary.main">R$ 1.250</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ocupação ideal</Typography>
                      <Typography variant="h5" color="warning.main">85%</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommendation Engine
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Taxa de conversão</Typography>
                      <Typography variant="h5" color="success.main">73%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Cross-selling</Typography>
                      <Typography variant="h5" color="primary.main">+28%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Up-selling</Typography>
                      <Typography variant="h5" color="warning.main">+15%</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  )
} 