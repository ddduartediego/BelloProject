'use client'

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
} from '@mui/material'
import {
  Info as InfoIcon,
  Cake as CakeIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  LocalAtm as CashIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  People as PeopleIcon,
  ContentCut as ServiceIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface Alerta {
  id: number
  tipo: 'error' | 'warning' | 'info'
  titulo: string
  descricao: string
  icon: React.ReactNode
  items: string[]
  prioridade: 'alta' | 'media' | 'baixa'
}

interface AlertasImportantesProps {
  title?: string
  metrics?: DashboardMetrics | null
}

export default function AlertasImportantes({ 
  title = 'Alertas Importantes',
  metrics 
}: AlertasImportantesProps) {
  const [expandidos, setExpandidos] = React.useState<number[]>([])

  const toggleExpanded = (alertaId: number) => {
    setExpandidos(prev => 
      prev.includes(alertaId) 
        ? prev.filter(id => id !== alertaId)
        : [...prev, alertaId]
    )
  }

  const getSeverityColor = (tipo: string): 'error' | 'warning' | 'info' => {
    switch (tipo) {
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
      default:
        return 'info'
    }
  }

  const getPrioridadeColor = (prioridade: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (prioridade) {
      case 'alta':
        return 'error'
      case 'media':
        return 'warning'
      case 'baixa':
        return 'info'
      default:
        return 'default'
    }
  }

  // Gerar alertas baseados nas métricas reais
  const gerarAlertas = (): Alerta[] => {
    if (!metrics) {
      return []
    }

    const alertas: Alerta[] = []

    // Alerta de agendamentos pendentes
    if (metrics.agendamentos.pendentes > 0) {
      alertas.push({
        id: 1,
        tipo: metrics.agendamentos.pendentes >= 5 ? 'warning' : 'info',
        titulo: 'Agendamentos Pendentes',
        descricao: `${metrics.agendamentos.pendentes} agendamentos aguardando confirmação`,
        icon: <ScheduleIcon />,
        items: [
          `${metrics.agendamentos.pendentes} agendamentos pendentes`,
          `${metrics.agendamentos.confirmados} já confirmados`,
          `${metrics.agendamentos.hojeTotal} agendamentos para hoje`,
          `${metrics.agendamentos.proximaSemana} para próxima semana`
        ],
        prioridade: metrics.agendamentos.pendentes >= 5 ? 'media' : 'baixa'
      })
    }

    // Alerta de aniversariantes
    if (metrics.clientes.aniversariantesEssaSemana > 0) {
      alertas.push({
        id: 2,
        tipo: 'info',
        titulo: 'Aniversariantes da Semana',
        descricao: `${metrics.clientes.aniversariantesEssaSemana} clientes fazem aniversário esta semana`,
        icon: <CakeIcon />,
        items: [
          `${metrics.clientes.aniversariantesEssaSemana} aniversariantes esta semana`,
          'Envie felicitações para fidelizar',
          'Considere ofertas especiais',
          'Agende serviços com antecedência'
        ],
        prioridade: 'baixa'
      })
    }

    // Alerta sobre novos clientes
    if (metrics.clientes.novosEsseMes > 0) {
      alertas.push({
        id: 3,
        tipo: 'info',
        titulo: 'Novos Clientes Este Mês',
        descricao: `${metrics.clientes.novosEsseMes} novos clientes cadastrados`,
        icon: <PeopleIcon />,
        items: [
          `${metrics.clientes.novosEsseMes} novos cadastros este mês`,
          `Total de ${metrics.clientes.total} clientes ativos`,
          'Faça follow-up dos novos clientes',
          'Colete feedback dos primeiros atendimentos'
        ],
        prioridade: 'baixa'
      })
    }

    // Alerta sobre desempenho dos serviços
    if (metrics.servicos.total > 0) {
      const servicosPopulares = Object.entries(metrics.servicos.porCategoria)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)

      alertas.push({
        id: 4,
        tipo: 'info',
        titulo: 'Performance dos Serviços',
        descricao: `${metrics.servicos.total} serviços disponíveis no catálogo`,
        icon: <ServiceIcon />,
        items: [
          `Preço médio: R$ ${metrics.servicos.precoMedio.toFixed(2)}`,
          `Duração média: ${metrics.servicos.duracaoMedia} minutos`,
          ...servicosPopulares.map(([categoria, quantidade]) => 
            `${categoria}: ${quantidade} serviços`
          )
        ],
        prioridade: 'baixa'
      })
    }

    // Alerta sobre profissionais
    if (metrics.profissionais.total === 0) {
      alertas.push({
        id: 5,
        tipo: 'error',
        titulo: 'Nenhum Profissional Cadastrado',
        descricao: 'É necessário cadastrar pelo menos um profissional',
        icon: <PeopleIcon />,
        items: [
          'Acesse a seção de Profissionais',
          'Cadastre os dados do profissional',
          'Defina as especialidades',
          'Configure os horários de trabalho'
        ],
        prioridade: 'alta'
      })
    } else if (metrics.profissionais.total < 2) {
      alertas.push({
        id: 6,
        tipo: 'warning',
        titulo: 'Poucos Profissionais',
        descricao: `Apenas ${metrics.profissionais.total} profissional cadastrado`,
        icon: <PeopleIcon />,
        items: [
          'Considere cadastrar mais profissionais',
          'Evite sobrecarga de agendamentos',
          'Melhore a disponibilidade de horários',
          'Especialidades disponíveis: ' + Object.keys(metrics.profissionais.porEspecialidade).join(', ')
        ],
        prioridade: 'media'
      })
    }

    // Alerta padrão do caixa (simulado)
    alertas.push({
      id: 7,
      tipo: 'warning',
      titulo: 'Status do Caixa',
      descricao: 'Caixa aberto - lembre-se de fechar ao final do dia',
      icon: <CashIcon />,
      items: [
        'Status: ABERTO',
        'Última movimentação: em tempo real',
        'Feche o caixa ao final do expediente',
        'Confira o saldo antes de fechar'
      ],
      prioridade: 'media'
    })

    return alertas
  }

  const alertas = gerarAlertas()

  const alertasOrdenados = alertas.sort((a, b) => {
    const prioridadeOrder = { alta: 3, media: 2, baixa: 1 }
    return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade]
  })

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
            {!metrics && (
              <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                (Carregando...)
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitore situações que precisam de atenção
          </Typography>
        </Box>

        {!metrics ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Resumo de alertas */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                label={`${alertas.filter(a => a.prioridade === 'alta').length} Alta`}
                color="error"
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${alertas.filter(a => a.prioridade === 'media').length} Média`}
                color="warning"
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${alertas.filter(a => a.prioridade === 'baixa').length} Baixa`}
                color="info"
                size="small"
                variant="outlined"
              />
            </Box>

            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {alertasOrdenados.map((alerta) => (
                <Alert
                  key={alerta.id}
                  severity={getSeverityColor(alerta.tipo)}
                  sx={{ 
                    mb: 2,
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={alerta.prioridade.toUpperCase()}
                        color={getPrioridadeColor(alerta.prioridade)}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(alerta.id)}
                      >
                        {expandidos.includes(alerta.id) ? 
                          <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                      </IconButton>
                    </Box>
                  }
                >
                  <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {alerta.icon}
                    {alerta.titulo}
                  </AlertTitle>
                  {alerta.descricao}
                  
                  <Collapse in={expandidos.includes(alerta.id)}>
                    <List dense sx={{ mt: 1 }}>
                      {alerta.items.map((item, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{
                              variant: 'body2',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Alert>
              ))}
            </Box>

            {alertas.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InfoIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.main">
                  Tudo em ordem!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Não há alertas importantes no momento
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Última atualização */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Última atualização: {format(new Date(), 'HH:mm:ss')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
} 