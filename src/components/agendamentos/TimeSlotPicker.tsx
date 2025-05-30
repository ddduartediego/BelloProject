'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
  Paper,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Coffee as BreakIcon,
} from '@mui/icons-material'
import { format, addMinutes, parseISO, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoAdapter, type AgendamentoCompleto } from '@/utils/agendamento-adapter'

interface TimeSlot {
  time: string
  available: boolean
  conflictType?: 'occupied' | 'close' | 'break'
  conflictInfo?: string
}

interface TimeSlotPickerProps {
  selectedDate: string
  selectedProfissional?: {
    id: string
    nome: string
  }
  servicoDuracao?: number // em minutos
  onTimeSelect: (time: string) => void
  selectedTime?: string
  workingHours?: {
    start: string
    end: string
    breakStart?: string
    breakEnd?: string
  }
  agendamentoId?: string // Para edição (excluir da verificação)
  disabled?: boolean
}

export default function TimeSlotPicker({
  selectedDate,
  selectedProfissional,
  servicoDuracao = 60,
  onTimeSelect,
  selectedTime,
  workingHours = {
    start: '08:00',
    end: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00'
  },
  agendamentoId,
  disabled = false
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [slotInterval, setSlotInterval] = useState<number>(30) // minutos
  const [agendamentosExistentes, setAgendamentosExistentes] = useState<AgendamentoCompleto[]>([])
  const [error, setError] = useState<string | null>(null)

  // Carregar agendamentos usando useCallback para otimização
  const loadAgendamentosExistentes = useCallback(async () => {
    if (!selectedDate || !selectedProfissional?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await agendamentosService.getAll(
        { page: 1, limit: 100 },
        {
          profissional: selectedProfissional.id,
          dataInicio: selectedDate,
          dataFim: selectedDate
        }
      )

      if (response.data) {
        const agendamentos = AgendamentoAdapter.toFrontendList(response.data.data)
        // Filtrar apenas agendamentos não cancelados
        const agendamentosAtivos = agendamentos.filter(ag => 
          ag.status !== 'cancelado' && ag.id !== agendamentoId
        )
        setAgendamentosExistentes(agendamentosAtivos)
      } else {
        throw new Error(response.error || 'Erro ao carregar agendamentos')
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
      setError('Erro ao carregar horários disponíveis')
      setAgendamentosExistentes([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedProfissional?.id, agendamentoId])

  // Verificação de conflitos otimizada
  const checkTimeSlotConflict = useCallback((timeString: string, duration: number) => {
    const slotStart = parseISO(`${selectedDate}T${timeString}:00`)
    const slotEnd = addMinutes(slotStart, duration)

    for (const agendamento of agendamentosExistentes) {
      const agStart = parseISO(`${agendamento.data_agendamento}T${agendamento.hora_inicio}:00`)
      const agEnd = parseISO(`${agendamento.data_agendamento}T${agendamento.hora_fim}:00`)

      // Verificar sobreposição exata
      const hasOverlap = (
        (slotStart >= agStart && slotStart < agEnd) ||
        (slotEnd > agStart && slotEnd <= agEnd) ||
        (slotStart <= agStart && slotEnd >= agEnd)
      )

      if (hasOverlap) {
        return {
          hasConflict: true,
          type: 'occupied' as const,
          info: `${agendamento.cliente.nome} - ${agendamento.servico.nome}`
        }
      }

      // Verificar proximidade (menos de 15 min)
      const timeDiff = Math.abs(slotStart.getTime() - agStart.getTime())
      const minutesDiff = timeDiff / (1000 * 60)

      if (minutesDiff < 15 && minutesDiff > 0) {
        return {
          hasConflict: true,
          type: 'close' as const,
          info: `Muito próximo de ${agendamento.cliente.nome} (${agendamento.hora_inicio})`
        }
      }
    }

    return {
      hasConflict: false,
      type: undefined,
      info: undefined
    }
  }, [selectedDate, agendamentosExistentes])

  // Gerar slots usando useCallback para otimização  
  const generateTimeSlots = useCallback(() => {
    if (!selectedDate || !selectedProfissional) {
      setTimeSlots([])
      return
    }

    const slots: TimeSlot[] = []
    const startTime = parseTime(workingHours.start)
    const endTime = parseTime(workingHours.end)
    const breakStart = workingHours.breakStart ? parseTime(workingHours.breakStart) : null
    const breakEnd = workingHours.breakEnd ? parseTime(workingHours.breakEnd) : null

    let currentTime = startTime

    while (currentTime < endTime) {
      const timeString = formatTime(currentTime)
      const slotEndTime = addMinutes(currentTime, servicoDuracao)

      // Verificar se está no intervalo de almoço
      let isBreakTime = false
      if (breakStart && breakEnd) {
        isBreakTime = currentTime >= breakStart && currentTime < breakEnd
      }

      // Verificar se há conflito com agendamentos existentes
      const conflictInfo = checkTimeSlotConflict(timeString, servicoDuracao)

      const slot: TimeSlot = {
        time: timeString,
        available: !isBreakTime && !conflictInfo.hasConflict,
        conflictType: isBreakTime ? 'break' : conflictInfo.type,
        conflictInfo: isBreakTime ? 'Horário de intervalo' : conflictInfo.info
      }

      slots.push(slot)
      currentTime = addMinutes(currentTime, slotInterval)
    }

    setTimeSlots(slots)
  }, [selectedDate, selectedProfissional, servicoDuracao, agendamentosExistentes, slotInterval, workingHours, checkTimeSlotConflict])

  // Carregar agendamentos quando data/profissional mudam
  useEffect(() => {
    if (selectedDate && selectedProfissional?.id) {
      loadAgendamentosExistentes()
    } else {
      setTimeSlots([])
      setAgendamentosExistentes([])
    }
  }, [selectedDate, selectedProfissional?.id, loadAgendamentosExistentes])

  // Gerar slots quando agendamentos carregam ou dependências mudam
  useEffect(() => {
    if (selectedDate && selectedProfissional && typeof agendamentosExistentes.length === 'number') {
      generateTimeSlots()
    }
  }, [selectedDate, selectedProfissional, agendamentosExistentes.length, generateTimeSlots])

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm')
  }

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.time === selectedTime) {
      return 'primary'
    }
    
    if (!slot.available) {
      if (slot.conflictType === 'break') {
        return 'warning'
      }
      return 'error'
    }
    
    return 'success'
  }

  const getSlotIcon = (slot: TimeSlot) => {
    if (slot.time === selectedTime) {
      return <CheckIcon />
    }
    
    if (!slot.available) {
      if (slot.conflictType === 'break') {
        return <BreakIcon />
      }
      return <CancelIcon />
    }
    
    return <TimeIcon />
  }

  const getSlotVariant = (slot: TimeSlot) => {
    if (slot.time === selectedTime) {
      return 'filled'
    }
    
    return slot.available ? 'outlined' : 'filled'
  }

  const handleTimeSelect = (time: string) => {
    if (!disabled) {
      onTimeSelect(time)
    }
  }

  const handleIntervalChange = (event: SelectChangeEvent<number>) => {
    setSlotInterval(event.target.value as number)
  }

  if (!selectedDate || !selectedProfissional) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Selecione uma data e profissional
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Para visualizar os horários disponíveis
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header com controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          Horários Disponíveis
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Intervalo</InputLabel>
          <Select
            value={slotInterval}
            label="Intervalo"
            onChange={handleIntervalChange}
            disabled={loading || disabled}
          >
            <MenuItem value={15}>15 min</MenuItem>
            <MenuItem value={30}>30 min</MenuItem>
            <MenuItem value={60}>60 min</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Info da seleção */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              Data Selecionada
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: ptBR })}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              Profissional
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {selectedProfissional.nome}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              Duração do Serviço
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {servicoDuracao} minutos
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Estados de loading e erro */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Carregando horários disponíveis...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grid de horários */}
      {!loading && !error && (
        <>
          <Grid container spacing={1}>
            {timeSlots.map((slot) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={slot.time}>
                <Tooltip
                  title={slot.conflictInfo || (slot.available ? 'Disponível' : 'Indisponível')}
                  arrow
                >
                  <Box>
                    <Chip
                      label={slot.time}
                      icon={getSlotIcon(slot)}
                      color={getSlotColor(slot)}
                      variant={getSlotVariant(slot)}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      sx={{
                        width: '100%',
                        height: 40,
                        fontSize: '0.9rem',
                        cursor: slot.available && !disabled ? 'pointer' : 'default',
                        opacity: disabled ? 0.6 : 1,
                        '&:hover': {
                          transform: slot.available && !disabled ? 'scale(1.05)' : 'none',
                        },
                        transition: 'transform 0.2s'
                      }}
                      disabled={!slot.available || disabled}
                    />
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>

          {/* Legenda */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Legenda:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                  icon={<TimeIcon />} 
                  label="Disponível" 
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  color="primary" 
                  icon={<CheckIcon />} 
                  label="Selecionado" 
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  color="error" 
                  icon={<CancelIcon />} 
                  label="Ocupado" 
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  color="warning" 
                  icon={<BreakIcon />} 
                  label="Intervalo" 
                />
              </Box>
            </Box>
          </Box>

          {/* Resumo de agendamentos do dia */}
          {agendamentosExistentes.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Agendamentos do dia ({agendamentosExistentes.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {agendamentosExistentes.slice(0, 5).map((agendamento) => (
                  <Paper 
                    key={agendamento.id} 
                    variant="outlined" 
                    sx={{ p: 1, bgcolor: 'grey.50' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {agendamento.cliente.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {agendamento.servico.nome}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {agendamento.hora_inicio} - {agendamento.hora_fim}
                        </Typography>
                        <Chip
                          label={agendamento.status}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                ))}
                
                {agendamentosExistentes.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    +{agendamentosExistentes.length - 5} agendamentos adicionais
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Informações de horário de trabalho */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Horário de funcionamento:</strong> {workingHours.start} às {workingHours.end}
              {workingHours.breakStart && workingHours.breakEnd && (
                <> • <strong>Intervalo:</strong> {workingHours.breakStart} às {workingHours.breakEnd}</>
              )}
            </Typography>
          </Alert>
        </>
      )}
    </Box>
  )
} 