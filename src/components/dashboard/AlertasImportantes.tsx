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
} from '@mui/material'
import {
  Info as InfoIcon,
  Cake as CakeIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  LocalAtm as CashIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'

// Dados simulados para demonstração
const alertas = [
  {
    id: 1,
    tipo: 'error',
    titulo: 'Produtos com Estoque Baixo',
    descricao: '3 produtos precisam de reposição urgente',
    icon: <InventoryIcon />,
    items: [
      'Shampoo Loreal - 2 unidades restantes',
      'Tinta Cor Chocolate - 1 unidade restante', 
      'Escova Térmica 45mm - 0 unidades'
    ],
    prioridade: 'alta'
  },
  {
    id: 2,
    tipo: 'warning',
    titulo: 'Caixa Aberto há 12 horas',
    descricao: 'Lembre-se de fechar o caixa ao final do dia',
    icon: <CashIcon />,
    items: [
      'Aberto desde: 08:00',
      'Última movimentação: 17:45',
      'Valor atual: R$ 1.850,00'
    ],
    prioridade: 'media'
  },
  {
    id: 3,
    tipo: 'info',
    titulo: 'Aniversariantes da Semana',
    descricao: '5 clientes fazem aniversário esta semana',
    icon: <CakeIcon />,
    items: [
      'Maria Silva - Hoje',
      'João Santos - Amanhã',
      'Amanda Costa - Quinta-feira',
      'Pedro Oliveira - Sexta-feira',
      'Ana Souza - Sábado'
    ],
    prioridade: 'baixa'
  },
  {
    id: 4,
    tipo: 'warning',
    titulo: 'Agendamentos Não Confirmados',
    descricao: '8 agendamentos aguardando confirmação',
    icon: <ScheduleIcon />,
    items: [
      '3 para hoje - confirmar urgente',
      '5 para amanhã - confirmar por telefone',
      'Horários mais procurados: 14:00-18:00'
    ],
    prioridade: 'media'
  }
]

interface AlertasImportantesProps {
  title?: string
}

export default function AlertasImportantes({ title = 'Alertas Importantes' }: AlertasImportantesProps) {
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

  const alertasOrdenados = alertas.sort((a, b) => {
    const prioridadeOrder = { alta: 3, media: 2, baixa: 1 }
    return prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] - 
           prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder]
  })

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitore situações que precisam de atenção
          </Typography>
        </Box>

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