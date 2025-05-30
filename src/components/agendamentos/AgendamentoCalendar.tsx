'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Grid,
  Button,
  Chip,
  Tooltip,
  Paper,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoAdapter, type AgendamentoCompleto, type CalendarEvent } from '@/utils/agendamento-adapter'

// Tipos e interfaces
interface AgendamentoEvent {
  id: string
  title: string
  cliente: string
  profissional: string
  servico: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido'
  observacoes?: string
}

interface AgendamentoCalendarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onEventClick: (agendamento: any) => void
  onEventEdit: (agendamento: any) => void
  statusFilter: string
  profissionalFilter: string
  refreshKey: number
}

export default function AgendamentoCalendar({
  currentDate,
  onDateChange,
  onEventClick,
  onEventEdit,
  statusFilter,
  profissionalFilter,
  refreshKey,
}: AgendamentoCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  
  // Cache básico para eventos por mês
  const [eventsCache, setEventsCache] = useState<Map<string, CalendarEvent[]>>(new Map())

  // Gerar chave de cache baseada no mês e filtros
  const cacheKey = useMemo(() => {
    const monthKey = format(currentDate, 'yyyy-MM')
    return `${monthKey}-${statusFilter}-${profissionalFilter}`
  }, [currentDate, statusFilter, profissionalFilter])

  // Carregar eventos usando useCallback para otimização
  const loadEvents = useCallback(async () => {
    // Verificar cache primeiro
    if (eventsCache.has(cacheKey)) {
      setEvents(eventsCache.get(cacheKey) || [])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      
      // Buscar agendamentos para o mês inteiro
      const filters = AgendamentoAdapter.toBackendFilters({
        statusFilter: statusFilter !== 'todos' ? statusFilter : undefined,
        profissionalFilter: profissionalFilter !== 'todos' ? profissionalFilter : undefined,
      })

      // Adicionar filtro de data para o mês
      const filtersWithDate = {
        ...filters,
        dataInicio: format(startDate, 'yyyy-MM-dd'),
        dataFim: format(endDate, 'yyyy-MM-dd')
      }

      const response = await agendamentosService.getAll(
        { page: 1, limit: 1000 }, // Buscar todos os eventos do mês
        filtersWithDate
      )

      if (response.data) {
        const agendamentos = response.data.data
        const calendarEvents = AgendamentoAdapter.toCalendarEvents(agendamentos)
        
        // Atualizar cache
        setEventsCache(prev => new Map(prev.set(cacheKey, calendarEvents)))
        setEvents(calendarEvents)
      } else {
        throw new Error(response.error || 'Erro ao carregar agendamentos')
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
      setError('Erro ao carregar agendamentos do calendário')
    } finally {
      setLoading(false)
    }
  }, [currentDate, statusFilter, profissionalFilter, cacheKey, eventsCache])

  // Carregar eventos do mês atual
  useEffect(() => {
    loadEvents()
  }, [loadEvents, refreshKey])

  // Limpar cache quando refreshKey muda (para atualizar dados)
  useEffect(() => {
    setEventsCache(new Map())
  }, [refreshKey])

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    const today = new Date()
    onDateChange(today)
  }

  const handleDayClick = (date: Date) => {
    onDateChange(date)
  }

  const handleEventClick = (event: React.MouseEvent<HTMLElement>, calendarEvent: CalendarEvent) => {
    event.stopPropagation()
    setSelectedEvent(calendarEvent)
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedEvent(null)
  }

  const handleViewEvent = () => {
    if (selectedEvent) {
      // Converter CalendarEvent de volta para AgendamentoCompleto
      const agendamento: AgendamentoCompleto = {
        id: selectedEvent.id,
        title: selectedEvent.title,
        cliente: {
          nome: selectedEvent.cliente
        },
        profissional: {
          id: '', // Será preenchido ao carregar detalhes
          nome: selectedEvent.profissional
        },
        servico: {
          nome: selectedEvent.servico
        },
        data_agendamento: format(selectedEvent.start, 'yyyy-MM-dd'),
        hora_inicio: format(selectedEvent.start, 'HH:mm'),
        hora_fim: format(selectedEvent.end, 'HH:mm'),
        status: selectedEvent.status as any,
      }
      onEventClick(agendamento)
    }
    handleMenuClose()
  }

  const handleEditEvent = () => {
    if (selectedEvent) {
      // Converter CalendarEvent de volta para AgendamentoCompleto
      const agendamento: AgendamentoCompleto = {
        id: selectedEvent.id,
        title: selectedEvent.title,
        cliente: {
          nome: selectedEvent.cliente
        },
        profissional: {
          id: '', // Será preenchido ao carregar detalhes
          nome: selectedEvent.profissional
        },
        servico: {
          nome: selectedEvent.servico
        },
        data_agendamento: format(selectedEvent.start, 'yyyy-MM-dd'),
        hora_inicio: format(selectedEvent.start, 'HH:mm'),
        hora_fim: format(selectedEvent.end, 'HH:mm'),
        status: selectedEvent.status as any,
      }
      onEventEdit(agendamento)
    }
    handleMenuClose()
  }

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter(event => 
      isSameDay(event.start, date)
    )
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'agendado': '#2196F3',
      'confirmado': '#4CAF50',
      'cancelado': '#F44336',
      'concluido': '#9E9E9E'
    }
    return colorMap[status as keyof typeof colorMap] || '#9E9E9E'
  }

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Domingo
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = []
    let currentDay = calendarStart

    // Headers dos dias da semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const headerRow = (
      <Grid container key="header" sx={{ mb: 1 }}>
        {weekDays.map((day) => (
          <Grid item xs key={day}>
            <Typography
              variant="subtitle2"
              align="center"
              color="text.secondary"
              fontWeight="bold"
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
    )

    days.push(headerRow)

    // Gerar as semanas
    while (currentDay <= calendarEnd) {
      const week = []
      
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDay(currentDay)
        const isCurrentMonth = isSameMonth(currentDay, currentDate)
        const isCurrentDay = isToday(currentDay)
        const dateToRender = currentDay

        week.push(
          <Grid item xs key={currentDay.toString()}>
            <Paper
              variant="outlined"
              sx={{
                minHeight: 120,
                p: 1,
                cursor: 'pointer',
                bgcolor: isCurrentDay ? 'primary.50' : 'background.paper',
                borderColor: isCurrentDay ? 'primary.main' : 'divider',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => handleDayClick(dateToRender)}
            >
              <Typography
                variant="body2"
                color={isCurrentMonth ? 'text.primary' : 'text.disabled'}
                fontWeight={isCurrentDay ? 'bold' : 'normal'}
                align="center"
                sx={{ mb: 0.5 }}
              >
                {format(dateToRender, 'd')}
              </Typography>

              {/* Eventos do dia */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {dayEvents.slice(0, 3).map((event) => (
                  <Tooltip
                    key={event.id}
                    title={`${event.cliente} - ${event.servico} (${format(event.start, 'HH:mm')})`}
                    arrow
                  >
                    <Chip
                      label={event.title}
                      size="small"
                      onClick={(e) => handleEventClick(e, event)}
                      sx={{
                        bgcolor: getStatusColor(event.status),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                        '& .MuiChip-label': {
                          px: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%'
                        }
                      }}
                    />
                  </Tooltip>
                ))}
                
                {dayEvents.length > 3 && (
                  <Typography variant="caption" color="text.secondary" align="center">
                    +{dayEvents.length - 3} mais
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )

        currentDay = addDays(currentDay, 1)
      }

      days.push(
        <Grid container spacing={1} key={`week-${currentDay.toString()}`}>
          {week}
        </Grid>
      )
    }

    return days
  }

  return (
    <Card>
      <CardContent>
        {/* Header do calendário */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="h5" fontWeight="bold" sx={{ minWidth: 200, textAlign: 'center' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </Typography>
            
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>

          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Hoje
          </Button>
        </Box>

        {/* Estados de loading e erro */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Grid do calendário */}
        {!loading && !error && (
          <Box sx={{ mb: 3 }}>
            {renderCalendarGrid()}
          </Box>
        )}

        {/* Legenda de status */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 3, 
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          {[
            { status: 'agendado', label: 'Agendado' },
            { status: 'confirmado', label: 'Confirmado' },
            { status: 'cancelado', label: 'Cancelado' },
            { status: 'concluido', label: 'Concluído' }
          ].map(({ status, label }) => (
            <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(status)
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Menu de ações dos eventos */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewEvent}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver Detalhes</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleEditEvent}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
} 