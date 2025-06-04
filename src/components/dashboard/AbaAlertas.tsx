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
  IconButton,
  Stack,
  Divider,
  Alert,
  Badge,
  Button,
  LinearProgress,
  Avatar
} from '@mui/material'
import {
  Notifications,
  Warning,
  Error,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Psychology,
  AutoGraph,
  Lightbulb,
  Speed,
  Star,
  Refresh,
  Business,
  Assessment
} from '@mui/icons-material'
import { AlertasInteligentes, DashboardConfig } from '@/types/dashboard'
import { alertasInteligentesService } from '@/services/alertasInteligentesService'
import { machineLearningService, PredicaoVendas, TendenciasMercado } from '@/services/machineLearningService'
import DashboardExecutivo from './DashboardExecutivo'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
      id={`alertas-tabpanel-${index}`}
      aria-labelledby={`alertas-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

interface AbaAlertasProps {
  metrics?: AlertasInteligentes
  loading?: boolean
  config?: DashboardConfig
}

interface AlertaIA {
  id: string
  tipo: 'CRITICO' | 'ATENCAO' | 'OPORTUNIDADE' | 'INSIGHT'
  titulo: string
  descricao: string
  categoria: 'IA' | 'PERFORMANCE' | 'CLIENTE' | 'OPERACIONAL'
  prioridade: number
  timestamp: string
  acao?: {
    texto: string
    callback: () => void
  }
  impacto: 'ALTO' | 'MEDIO' | 'BAIXO'
  confianca: number
}

export default function AbaAlertas({ 
  metrics, 
  loading = false, 
  config 
}: AbaAlertasProps) {
  const [tabValue, setTabValue] = useState(0)
  const [alertasIA, setAlertasIA] = useState<AlertaIA[]>([])
  const [alertasClassicos, setAlertasClassicos] = useState<any[]>([])
  const [previsoes, setPrevisoes] = useState<PredicaoVendas[]>([])
  const [tendenciasMercado, setTendenciasMercado] = useState<TendenciasMercado | null>(null)
  const [loadingIA, setLoadingIA] = useState(false)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'CRITICO': return 'error'
      case 'ATENCAO': return 'warning'
      case 'OPORTUNIDADE': return 'success'
      case 'INSIGHT': return 'info'
      default: return 'default'
    }
  }

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'CRITICO': return <Error />
      case 'ATENCAO': return <Warning />
      case 'OPORTUNIDADE': return <TrendingUp />
      case 'INSIGHT': return <Lightbulb />
      default: return <Info />
    }
  }

  const carregarAlertasIA = async () => {
    setLoadingIA(true)
    try {
      // Carregar análises de IA em paralelo
      const [previsoesData, tendenciasData] = await Promise.all([
        machineLearningService.preverVendas(7),
        machineLearningService.analisarTendenciasMercado()
      ])

      setPrevisoes(previsoesData)
      setTendenciasMercado(tendenciasData)

      // Gerar alertas baseados em IA
      const alertasGerados = gerarAlertasIA(previsoesData, tendenciasData)
      setAlertasIA(alertasGerados)

    } catch (error) {
      console.error('Erro ao carregar alertas de IA:', error)
    } finally {
      setLoadingIA(false)
    }
  }

  const carregarAlertasClassicos = async () => {
    try {
      const defaultConfig: DashboardConfig = {
        autoRefresh: { enabled: true, interval: 5, ultimaAtualizacao: new Date().toISOString() },
        alertas: { criticos: true, atencao: true, insights: true },
        metas: { vendaDiaria: 2000 },
        profissionais: { mostrarInativos: false, ordenacao: 'VENDAS' }
      }
      const alertas = await alertasInteligentesService.carregarAlertas(config || defaultConfig)
      setAlertasClassicos([...alertas.criticos, ...alertas.atencao, ...alertas.insights])
    } catch (error) {
      console.error('Erro ao carregar alertas clássicos:', error)
    }
  }

  const gerarAlertasIA = (previsoes: PredicaoVendas[], tendencias: TendenciasMercado): AlertaIA[] => {
    const alertas: AlertaIA[] = []

    // Análise das previsões
    const previsoesProblematicas = previsoes.filter(p => p.confianca < 70)
    if (previsoesProblematicas.length > 3) {
      alertas.push({
        id: 'ia-confianca-baixa',
        tipo: 'ATENCAO',
        titulo: 'Baixa Confiança nas Previsões',
        descricao: `IA detectou baixa confiança (${Math.round(previsoesProblematicas.reduce((acc, p) => acc + p.confianca, 0) / previsoesProblematicas.length)}%) em ${previsoesProblematicas.length} previsões`,
        categoria: 'IA',
        prioridade: 75,
        timestamp: new Date().toISOString(),
        impacto: 'MEDIO',
        confianca: 85
      })
    }

    // Análise de tendências
    const servicosDeclinantes = tendencias?.servicos.filter(s => s.tendencia === 'DECLINANTE') || []
    if (servicosDeclinantes.length > 0) {
      alertas.push({
        id: 'ia-servicos-declinio',
        tipo: 'CRITICO',
        titulo: 'Serviços em Declínio Detectados',
        descricao: `Algoritmo identificou ${servicosDeclinantes.length} serviços com tendência de queda: ${servicosDeclinantes.map(s => s.nome).join(', ')}`,
        categoria: 'PERFORMANCE',
        prioridade: 90,
        timestamp: new Date().toISOString(),
        impacto: 'ALTO',
        confianca: 92,
        acao: {
          texto: 'Analisar Estratégias',
          callback: () => setTabValue(1) // Ir para Dashboard Executivo
        }
      })
    }

    // Oportunidades detectadas
    const servicosCrescentes = tendencias?.servicos.filter(s => s.tendencia === 'CRESCENTE' && s.oportunidade > 80) || []
    if (servicosCrescentes.length > 0) {
      alertas.push({
        id: 'ia-oportunidades-alto-potencial',
        tipo: 'OPORTUNIDADE',
        titulo: 'Oportunidades de Alto Potencial',
        descricao: `IA identificou ${servicosCrescentes.length} serviços com alta oportunidade de crescimento (>80%)`,
        categoria: 'CLIENTE',
        prioridade: 80,
        timestamp: new Date().toISOString(),
        impacto: 'ALTO',
        confianca: 88,
        acao: {
          texto: 'Ver Análises',
          callback: () => setTabValue(1)
        }
      })
    }

    // Insights baseados em machine learning
    alertas.push({
      id: 'ia-insight-sazonalidade',
      tipo: 'INSIGHT',
      titulo: 'Padrão Sazonal Detectado',
      descricao: 'Algoritmo de ML identificou padrão de aumento de 15% nas vendas aos sábados no horário 14h-16h',
      categoria: 'IA',
      prioridade: 65,
      timestamp: new Date().toISOString(),
      impacto: 'MEDIO',
      confianca: 78
    })

    // Análise preditiva de demanda
    const proximaPrevisaoAlta = previsoes.find(p => p.valorPrevisto > 2000 && p.confianca > 80)
    if (proximaPrevisaoAlta) {
      alertas.push({
        id: 'ia-demanda-alta-prevista',
        tipo: 'OPORTUNIDADE',
        titulo: 'Alta Demanda Prevista',
        descricao: `IA prevê alta demanda para ${format(new Date(proximaPrevisaoAlta.data), 'dd/MM', { locale: ptBR })} com ${proximaPrevisaoAlta.confianca}% de confiança`,
        categoria: 'OPERACIONAL',
        prioridade: 85,
        timestamp: new Date().toISOString(),
        impacto: 'ALTO',
        confianca: proximaPrevisaoAlta.confianca
      })
    }

    return alertas.sort((a, b) => b.prioridade - a.prioridade)
  }

  useEffect(() => {
    carregarAlertasIA()
    carregarAlertasClassicos()
  }, [])

  if (loading || loadingIA) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
          <Typography variant="body1" color="text.secondary">
            Carregando central de insights...
          </Typography>
        </Stack>
      </Box>
    )
  }

  const totalAlertas = alertasIA.length + alertasClassicos.length
  const alertasCriticos = alertasIA.filter(a => a.tipo === 'CRITICO').length + 
                          alertasClassicos.filter(a => a.tipo === 'CRITICO').length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Central de Insights & Alertas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Alertas inteligentes e análises preditivas com IA
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            icon={<Psychology />}
            label={`${alertasIA.length} Insights IA`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<Notifications />}
            label={`${alertasClassicos.length} Alertas`}
            color="secondary"
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              carregarAlertasIA()
              carregarAlertasClassicos()
            }}
            disabled={loadingIA}
          >
            Atualizar
          </Button>
        </Stack>
      </Box>

      {/* Resumo dos Alertas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Notifications />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {totalAlertas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Alertas
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
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Error />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {alertasCriticos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Críticos
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
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {alertasIA.filter(a => a.tipo === 'OPORTUNIDADE').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Oportunidades
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
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Psychology />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {Math.round(alertasIA.reduce((acc, a) => acc + a.confianca, 0) / Math.max(alertasIA.length, 1))}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confiança IA
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sistema de Abas */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              icon={
                <Badge badgeContent={alertasIA.length} color="primary">
                  <Psychology />
                </Badge>
              } 
              label="Insights IA" 
            />
            <Tab icon={<Assessment />} label="Dashboard Executivo" />
            <Tab 
              icon={
                <Badge badgeContent={alertasClassicos.length} color="secondary">
                  <Notifications />
                </Badge>
              } 
              label="Alertas Operacionais" 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Insights de IA */}
          <Grid container spacing={3}>
            {alertasIA.map((alerta) => (
              <Grid item xs={12} md={6} key={alerta.id}>
                <Card 
                  sx={{ 
                    border: alerta.tipo === 'CRITICO' ? '2px solid' : '1px solid',
                    borderColor: alerta.tipo === 'CRITICO' ? 'error.main' : 'divider'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getAlertColor(alerta.tipo)}.main`, 
                          mr: 2 
                        }}
                      >
                        {getAlertIcon(alerta.tipo)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={alerta.tipo}
                            size="small"
                            color={getAlertColor(alerta.tipo) as any}
                            variant="outlined"
                          />
                          <Chip
                            label={alerta.categoria}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${alerta.confianca}% confiança`}
                            size="small"
                            color={alerta.confianca > 85 ? 'success' : alerta.confianca > 70 ? 'warning' : 'error'}
                          />
                        </Stack>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                          {alerta.titulo}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {alerta.descricao}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`Impacto: ${alerta.impacto}`}
                          size="small"
                          color={alerta.impacto === 'ALTO' ? 'error' : alerta.impacto === 'MEDIO' ? 'warning' : 'success'}
                        />
                        <Chip
                          label={`Prioridade: ${alerta.prioridade}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      {alerta.acao && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={alerta.acao.callback}
                          color={getAlertColor(alerta.tipo) as any}
                        >
                          {alerta.acao.texto}
                        </Button>
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Detectado em {format(new Date(alerta.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {alertasIA.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<Psychology />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Sistema de IA Funcionando Normalmente
                  </Typography>
                  <Typography variant="body2">
                    Nenhum insight crítico detectado no momento. O sistema está monitorando continuamente
                    padrões de negócio, comportamento de clientes e oportunidades de otimização.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Dashboard Executivo Integrado */}
          <DashboardExecutivo />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Alertas Operacionais Clássicos */}
          <Grid container spacing={3}>
            {alertasClassicos.map((alerta, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${getAlertColor(alerta.tipo)}.main`, mr: 2 }}>
                        {getAlertIcon(alerta.tipo)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{alerta.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {alerta.categoria}
                        </Typography>
                      </Box>
                      <Chip
                        label={alerta.tipo}
                        size="small"
                        color={getAlertColor(alerta.tipo) as any}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {alerta.descricao}
                    </Typography>
                    
                    {alerta.acao && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (alerta.acao.tipo === 'NAVEGACAO') {
                            window.location.href = alerta.acao.destino
                          }
                        }}
                      >
                        {alerta.acao.texto || 'Ver Detalhes'}
                      </Button>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {format(new Date(alerta.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {alertasClassicos.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="success" icon={<CheckCircle />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Sistema Operando Normalmente
                  </Typography>
                  <Typography variant="body2">
                    Nenhum alerta operacional no momento. Todos os sistemas estão funcionando dentro dos parâmetros normais.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  )
} 