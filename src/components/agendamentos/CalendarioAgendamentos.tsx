'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Button,
  Chip,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { Agendamento } from '@/types/database'

dayjs.locale('pt-br')

interface CalendarioAgendamentosProps {
  agendamentos: Agendamento[]
  onDateSelect: (date: Dayjs) => void
  onAgendamentoClick: (agendamento: Agendamento) => void
  selectedDate: Dayjs
}

// Dados simulados para demonstração
const agendamentosSimulados: Agendamento[] = [
  {
    id: '1',
    id_empresa: 'empresa-1',
    id_cliente: '1',
    id_profissional: '1', 
    data_hora_inicio: dayjs().hour(9).minute(0).toISOString(),
    data_hora_fim: dayjs().hour(10).minute(30).toISOString(),
    status: 'CONFIRMADO',
    observacoes: 'Cliente pediu corte bem curto',
    criado_em: dayjs().toISOString(),
    atualizado_em: dayjs().toISOString(),
  },
  {
    id: '2',
    id_empresa: 'empresa-1',
    id_cliente: '2',
    id_profissional: '2',
    data_hora_inicio: dayjs().hour(14).minute(0).toISOString(),
    data_hora_fim: dayjs().hour(17).minute(0).toISOString(),
    status: 'CONFIRMADO',
    observacoes: 'Coloração completa - primeira vez',
    criado_em: dayjs().toISOString(),
    atualizado_em: dayjs().toISOString(),
  },
  {
    id: '3',
    id_empresa: 'empresa-1',
    id_cliente: '3',
    id_profissional: '3',
    data_hora_inicio: dayjs().add(1, 'day').hour(10).minute(0).toISOString(),
    data_hora_fim: dayjs().add(1, 'day').hour(11).minute(30).toISOString(),
    status: 'PENDENTE',
    observacoes: '',
    criado_em: dayjs().toISOString(),
    atualizado_em: dayjs().toISOString(),
  },
  {
    id: '4',
    id_empresa: 'empresa-1',
    id_cliente: '1',
    id_profissional: '1',
    data_hora_inicio: dayjs().add(2, 'day').hour(16).minute(0).toISOString(),
    data_hora_fim: dayjs().add(2, 'day').hour(17).minute(0).toISOString(),
    status: 'CANCELADO',
    observacoes: 'Cliente cancelou - reagendar',
    criado_em: dayjs().toISOString(),
    atualizado_em: dayjs().toISOString(),
  },
]

const clientesData = {
  '1': { nome: 'Maria Silva Santos', telefone: '(11) 99999-1111' },
  '2': { nome: 'João Carlos Oliveira', telefone: '(11) 99999-2222' },
  '3': { nome: 'Amanda Costa Ferreira', telefone: '(11) 99999-3333' },
}

const profissionaisData = {
  '1': { nome: 'Ana Carolina' },
  '2': { nome: 'Roberto Silva' },
  '3': { nome: 'Carla Santos' },
}

export default function CalendarioAgendamentos({
  agendamentos = agendamentosSimulados,
  onDateSelect,
  onAgendamentoClick,
  selectedDate
}: CalendarioAgendamentosProps) {
  const [viewDate, setViewDate] = useState<Dayjs>(dayjs())

  // Filtrar agendamentos da data selecionada
  const agendamentosDoDia = agendamentos.filter(agendamento =>
    dayjs(agendamento.data_hora_inicio).isSame(selectedDate, 'day')
  )

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'success'
      case 'PENDENTE':
        return 'warning'
      case 'CANCELADO':
        return 'error'
      case 'CONCLUIDO':
        return 'info'
      default:
        return 'default'
    }
  }

  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'Confirmado'
      case 'PENDENTE':
        return 'Pendente'
      case 'CANCELADO':
        return 'Cancelado'
      case 'CONCLUIDO':
        return 'Concluído'
      default:
        return status
    }
  }

  // Função para verificar se uma data tem agendamentos
  const hasAgendamentos = (date: Dayjs) => {
    return agendamentos.some(agendamento =>
      dayjs(agendamento.data_hora_inicio).isSame(date, 'day')
    )
  }

  // Função para obter a quantidade de agendamentos de uma data
  const getAgendamentosCount = (date: Dayjs) => {
    return agendamentos.filter(agendamento =>
      dayjs(agendamento.data_hora_inicio).isSame(date, 'day')
    ).length
  }

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      onDateSelect(date)
    }
  }

  const handleTodayClick = () => {
    const today = dayjs()
    setViewDate(today)
    onDateSelect(today)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Grid container spacing={3}>
        {/* Calendário */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Calendário
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={handleTodayClick}
                sx={{ textTransform: 'none' }}
              >
                Hoje
              </Button>
            </Box>

            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              views={['day']}
              showDaysOutsideCurrentMonth
              dayOfWeekFormatter={(date) => dayjs(date).format('dd')}
            />
          </Paper>
        </Grid>

        {/* Lista de Agendamentos do Dia */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Agendamentos de {selectedDate.format('DD/MM/YYYY')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDate.format('dddd')} • {agendamentosDoDia.length} agendamento(s)
                </Typography>
              </Box>
              <Chip
                label={agendamentosDoDia.length}
                color="primary"
                size="small"
              />
            </Box>

            {agendamentosDoDia.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                color: 'text.secondary'
              }}>
                <EventIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhum agendamento
                </Typography>
                <Typography variant="body2">
                  Não há agendamentos para esta data.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {agendamentosDoDia
                  .sort((a, b) => dayjs(a.data_hora_inicio).diff(dayjs(b.data_hora_inicio)))
                  .map((agendamento) => {
                    const cliente = clientesData[agendamento.id_cliente as keyof typeof clientesData]
                    const profissional = profissionaisData[agendamento.id_profissional as keyof typeof profissionaisData]
                    const inicio = dayjs(agendamento.data_hora_inicio)
                    const fim = dayjs(agendamento.data_hora_fim)
                    const duracao = fim.diff(inicio, 'minute')

                    return (
                      <Card
                        key={agendamento.id}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 3,
                          },
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                        onClick={() => onAgendamentoClick(agendamento)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {cliente?.nome || 'Cliente não encontrado'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ScheduleIcon fontSize="small" color="primary" />
                                <Typography variant="body2">
                                  {inicio.format('HH:mm')} - {fim.format('HH:mm')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({Math.floor(duracao / 60)}h {duracao % 60}min)
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {profissional?.nome || 'Profissional não encontrado'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                              <Chip
                                label={getStatusText(agendamento.status)}
                                color={getStatusColor(agendamento.status) as any}
                                size="small"
                              />
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                A calcular
                              </Typography>
                            </Box>
                          </Box>
                          
                          {agendamento.observacoes && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              &quot;{agendamento.observacoes}&quot;
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </LocalizationProvider>
  )
} 