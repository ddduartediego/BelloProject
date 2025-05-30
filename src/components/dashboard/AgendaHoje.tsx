'use client'

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Stack,
} from '@mui/material'
import {
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Dados simulados para demonstração
const agendamentosHoje = [
  {
    id: 1,
    cliente: 'Maria Silva',
    telefone: '(11) 99999-1111',
    horario: '09:00',
    servico: 'Corte + Escova',
    profissional: 'Ana Paula',
    status: 'CONFIRMADO',
    duracao: 90,
  },
  {
    id: 2,
    cliente: 'João Santos',
    telefone: '(11) 99999-2222',
    horario: '10:30',
    servico: 'Corte Masculino',
    profissional: 'Carlos',
    status: 'PENDENTE',
    duracao: 45,
  },
  {
    id: 3,
    cliente: 'Amanda Costa',
    telefone: '(11) 99999-3333',
    horario: '14:00',
    servico: 'Coloração + Corte',
    profissional: 'Ana Paula',
    status: 'CONFIRMADO',
    duracao: 180,
  },
  {
    id: 4,
    cliente: 'Pedro Oliveira',
    telefone: '(11) 99999-4444',
    horario: '16:00',
    servico: 'Barba + Cabelo',
    profissional: 'Carlos',
    status: 'PENDENTE',
    duracao: 75,
  },
  {
    id: 5,
    cliente: 'Lucia Ferreira',
    telefone: '(11) 99999-5555',
    horario: '18:30',
    servico: 'Escova + Hidratação',
    profissional: 'Ana Paula',
    status: 'CONFIRMADO',
    duracao: 120,
  },
]

interface AgendaHojeProps {
  title?: string
}

export default function AgendaHoje({ title = 'Agenda de Hoje' }: AgendaHojeProps) {
  const hoje = new Date()
  
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'CONFIRMADO':
        return 'success'
      case 'PENDENTE':
        return 'warning'
      case 'CANCELADO':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return <CheckIcon fontSize="small" />
      case 'CANCELADO':
        return <CancelIcon fontSize="small" />
      default:
        return <TimeIcon fontSize="small" />
    }
  }

  const calcularHorarioFim = (horarioInicio: string, duracao: number) => {
    const [hora, minuto] = horarioInicio.split(':').map(Number)
    const inicioEmMinutos = hora * 60 + minuto
    const fimEmMinutos = inicioEmMinutos + duracao
    const horaFim = Math.floor(fimEmMinutos / 60)
    const minutoFim = fimEmMinutos % 60
    return `${horaFim.toString().padStart(2, '0')}:${minutoFim.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Typography>
        </Box>

        {/* Resumo do dia */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            label={`${agendamentosHoje.length} agendamentos`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip 
            label={`${agendamentosHoje.filter(a => a.status === 'CONFIRMADO').length} confirmados`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip 
            label={`${agendamentosHoje.filter(a => a.status === 'PENDENTE').length} pendentes`}
            color="warning"
            variant="outlined"
            size="small"
          />
        </Box>

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {agendamentosHoje.map((agendamento, index) => (
            <React.Fragment key={agendamento.id}>
              <ListItem
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: agendamento.status === 'CONFIRMADO' ? 'success.50' : 'background.paper',
                  border: 1,
                  borderColor: agendamento.status === 'CONFIRMADO' ? 'success.200' : 'divider',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                
                {/* Estrutura manual sem ListItemText para evitar HTML inválido */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Nome do cliente e status */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                      {agendamento.cliente}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(agendamento.status)}
                      label={agendamento.status}
                      color={getStatusColor(agendamento.status)}
                      size="small"
                    />
                  </Stack>

                  {/* Detalhes do agendamento */}
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Serviço:</strong> {agendamento.servico}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Profissional:</strong> {agendamento.profissional}
                    </Typography>
                    
                    {/* Horário e telefone */}
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {agendamento.horario} - {calcularHorarioFim(agendamento.horario, agendamento.duracao)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {agendamento.telefone}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {agendamento.horario}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agendamento.duracao}min
                  </Typography>
                </Box>
              </ListItem>
              
              {index < agendamentosHoje.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
        </List>

        {agendamentosHoje.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TimeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum agendamento para hoje
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Que tal aproveitar para organizar o salão?
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
} 