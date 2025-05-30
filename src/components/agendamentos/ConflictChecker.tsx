'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { format, parseISO, isWithinInterval, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoAdapter, type AgendamentoCompleto } from '@/utils/agendamento-adapter'

export interface AgendamentoConflito {
  id: string
  cliente: string
  profissional: string
  servico: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido'
}

export interface ConflictCheckResult {
  hasConflicts: boolean
  conflicts: AgendamentoConflito[]
  warnings: string[]
  suggestions: string[]
  loading?: boolean
}

interface ConflictCheckerProps {
  novoAgendamento: {
    profissional_id: string
    profissional_nome?: string
    data_agendamento: string
    hora_inicio: string
    duracao_minutos: number
    servico?: string
    agendamento_id?: string // Para edição (excluir da verificação)
  }
  showSuggestions?: boolean
  severity?: 'error' | 'warning' | 'info'
  realTimeCheck?: boolean // Verificação em tempo real via API
  onConflictCheck?: (result: ConflictCheckResult) => void
}

export default function ConflictChecker({
  novoAgendamento,
  showSuggestions = true,
  severity = 'warning',
  realTimeCheck = true,
  onConflictCheck
}: ConflictCheckerProps) {
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult>({
    hasConflicts: false,
    conflicts: [],
    warnings: [],
    suggestions: [],
    loading: false
  })
  const [agendamentosExistentes, setAgendamentosExistentes] = useState<AgendamentoCompleto[]>([])

  // Gerar sugestões inteligentes
  const generateSuggestions = useCallback((hasConflicts: boolean, conflicts: AgendamentoConflito[]): string[] => {
    const suggestions: string[] = []

    if (hasConflicts && showSuggestions) {
      suggestions.push('Sugestões para resolver conflitos:')
      suggestions.push('• Escolher outro horário disponível')
      suggestions.push('• Reagendar um dos agendamentos conflitantes')
      suggestions.push('• Atribuir a outro profissional disponível')
      
      // Sugerir horários próximos baseados nos conflitos
      if (conflicts.length > 0) {
        const proximoHorarioLivre = suggestNextAvailableTime(conflicts[0])
        if (proximoHorarioLivre) {
          suggestions.push(`• Próximo horário disponível: ${proximoHorarioLivre}`)
        }
      }
    }

    return suggestions
  }, [showSuggestions])

  // Verificação via API (tempo real) otimizada com useCallback
  const checkConflictsAPI = useCallback(async () => {
    setConflictResult(prev => ({ ...prev, loading: true }))

    try {
      // Calcular hora de fim
      const dataHoraInicio = new Date(`${novoAgendamento.data_agendamento}T${novoAgendamento.hora_inicio}:00`)
      const dataHoraFim = addMinutes(dataHoraInicio, novoAgendamento.duracao_minutos)

      // Verificar conflito via API
      const conflictResponse = await agendamentosService.verificarConflito(
        novoAgendamento.profissional_id,
        dataHoraInicio.toISOString(),
        dataHoraFim.toISOString(),
        novoAgendamento.agendamento_id // Excluir da verificação se for edição
      )

      if (conflictResponse.error) {
        throw new Error(conflictResponse.error)
      }

      const hasConflicts = conflictResponse.data || false

      // Se há conflitos, carregar agendamentos do dia para mostrar detalhes
      let conflicts: AgendamentoConflito[] = []
      const warnings: string[] = []

      if (hasConflicts) {
        const agendamentosResponse = await agendamentosService.getAll(
          { page: 1, limit: 100 },
          {
            profissional: novoAgendamento.profissional_id,
            dataInicio: novoAgendamento.data_agendamento,
            dataFim: novoAgendamento.data_agendamento
          }
        )

        if (agendamentosResponse.data) {
          const agendamentos = AgendamentoAdapter.toFrontendList(agendamentosResponse.data.data)
          
          // Filtrar apenas conflitos reais
          conflicts = agendamentos
            .filter(ag => ag.id !== novoAgendamento.agendamento_id) // Excluir próprio agendamento
            .filter(ag => ag.status !== 'cancelado')
            .filter(ag => {
              const agDataHoraInicio = parseISO(`${ag.data_agendamento}T${ag.hora_inicio}:00`)
              const agDataHoraFim = parseISO(`${ag.data_agendamento}T${ag.hora_fim}:00`)

              // Verificar sobreposição
              return (
                isWithinInterval(dataHoraInicio, { start: agDataHoraInicio, end: agDataHoraFim }) ||
                isWithinInterval(dataHoraFim, { start: agDataHoraInicio, end: agDataHoraFim }) ||
                isWithinInterval(agDataHoraInicio, { start: dataHoraInicio, end: dataHoraFim }) ||
                isWithinInterval(agDataHoraFim, { start: dataHoraInicio, end: dataHoraFim })
              )
            })
            .map(ag => ({
              id: ag.id,
              cliente: ag.cliente.nome,
              profissional: ag.profissional.nome,
              servico: ag.servico.nome,
              data_agendamento: ag.data_agendamento,
              hora_inicio: ag.hora_inicio,
              hora_fim: ag.hora_fim,
              status: ag.status
            }))

          // Verificar agendamentos próximos (warnings)
          agendamentos.forEach(ag => {
            if (ag.id === novoAgendamento.agendamento_id || ag.status === 'cancelado') return

            const agDataHoraInicio = parseISO(`${ag.data_agendamento}T${ag.hora_inicio}:00`)
            const timeDiff = Math.abs(dataHoraInicio.getTime() - agDataHoraInicio.getTime())
            const minutesDiff = timeDiff / (1000 * 60)

            if (minutesDiff < 30 && minutesDiff > 0) {
              warnings.push(
                `Agendamento muito próximo de ${ag.cliente.nome} (${ag.hora_inicio}). ` +
                `Considere um intervalo maior entre os atendimentos.`
              )
            }
          })
        }
      }

      // Gerar sugestões
      const suggestions = generateSuggestions(hasConflicts, conflicts)

      const result: ConflictCheckResult = {
        hasConflicts,
        conflicts,
        warnings,
        suggestions,
        loading: false
      }

      setConflictResult(result)
      onConflictCheck?.(result)

    } catch (error) {
      console.error('Erro ao verificar conflitos:', error)
      const errorResult: ConflictCheckResult = {
        hasConflicts: false,
        conflicts: [],
        warnings: [`Erro ao verificar conflitos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        suggestions: [],
        loading: false
      }
      setConflictResult(errorResult)
      onConflictCheck?.(errorResult)
    }
  }, [novoAgendamento, onConflictCheck, generateSuggestions])

  // Verificação local (fallback) otimizada com useCallback
  const checkConflictsLocal = useCallback(() => {
    const conflicts: AgendamentoConflito[] = []
    const warnings: string[] = []

    if (!novoAgendamento.data_agendamento || !novoAgendamento.hora_inicio) {
      const result: ConflictCheckResult = {
        hasConflicts: false,
        conflicts,
        warnings: ['Data e horário são obrigatórios para verificar conflitos'],
        suggestions: [],
        loading: false
      }
      setConflictResult(result)
      onConflictCheck?.(result)
      return
    }

    // Calcular hora de fim do novo agendamento
    const novaDataHora = new Date(`${novoAgendamento.data_agendamento}T${novoAgendamento.hora_inicio}:00`)
    const novaHoraFim = addMinutes(novaDataHora, novoAgendamento.duracao_minutos)

    // Verificar conflitos com agendamentos existentes
    agendamentosExistentes.forEach(agendamento => {
      // Só verificar agendamentos do mesmo profissional e que não estão cancelados
      if (agendamento.status === 'cancelado') return
      if (agendamento.id === novoAgendamento.agendamento_id) return
      
      // Verificar se é o mesmo profissional
      if (agendamento.profissional.id !== novoAgendamento.profissional_id) return

      // Verificar se é o mesmo dia
      if (agendamento.data_agendamento !== novoAgendamento.data_agendamento) return

      // Calcular intervalo do agendamento existente
      const agendamentoDataHora = new Date(`${agendamento.data_agendamento}T${agendamento.hora_inicio}:00`)
      const agendamentoHoraFim = new Date(`${agendamento.data_agendamento}T${agendamento.hora_fim}:00`)

      // Verificar sobreposição de horários
      const hasOverlap = 
        isWithinInterval(novaDataHora, { start: agendamentoDataHora, end: agendamentoHoraFim }) ||
        isWithinInterval(novaHoraFim, { start: agendamentoDataHora, end: agendamentoHoraFim }) ||
        isWithinInterval(agendamentoDataHora, { start: novaDataHora, end: novaHoraFim }) ||
        isWithinInterval(agendamentoHoraFim, { start: novaDataHora, end: novaHoraFim })

      if (hasOverlap) {
        conflicts.push({
          id: agendamento.id,
          cliente: agendamento.cliente.nome,
          profissional: agendamento.profissional.nome,
          servico: agendamento.servico.nome,
          data_agendamento: agendamento.data_agendamento,
          hora_inicio: agendamento.hora_inicio,
          hora_fim: agendamento.hora_fim,
          status: agendamento.status
        })
      }

      // Verificar proximidade (menos de 30 minutos de diferença)
      const timeDiff = Math.abs(novaDataHora.getTime() - agendamentoDataHora.getTime())
      const minutesDiff = timeDiff / (1000 * 60)

      if (minutesDiff < 30 && minutesDiff > 0) {
        warnings.push(
          `Agendamento muito próximo de ${agendamento.cliente.nome} (${agendamento.hora_inicio}). ` +
          `Considere um intervalo maior entre os atendimentos.`
        )
      }
    })

    // Gerar sugestões
    const suggestions = generateSuggestions(conflicts.length > 0, conflicts)

    const result: ConflictCheckResult = {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
      suggestions,
      loading: false
    }

    setConflictResult(result)
    onConflictCheck?.(result)
  }, [novoAgendamento, agendamentosExistentes, onConflictCheck, generateSuggestions])

  // Verificar conflitos quando dados mudam
  useEffect(() => {
    if (novoAgendamento.data_agendamento && novoAgendamento.hora_inicio && novoAgendamento.profissional_id) {
      if (realTimeCheck) {
        checkConflictsAPI()
      } else {
        checkConflictsLocal()
      }
    } else {
      setConflictResult({
        hasConflicts: false,
        conflicts: [],
        warnings: ['Data, horário e profissional são obrigatórios para verificar conflitos'],
        suggestions: [],
        loading: false
      })
    }
  }, [
    novoAgendamento.data_agendamento,
    novoAgendamento.hora_inicio,
    novoAgendamento.profissional_id,
    novoAgendamento.duracao_minutos,
    realTimeCheck,
    checkConflictsAPI,
    checkConflictsLocal
  ])

  // Sugerir próximo horário disponível
  const suggestNextAvailableTime = (conflito: AgendamentoConflito): string | null => {
    const conflitFim = parseISO(`${conflito.data_agendamento}T${conflito.hora_fim}:00`)
    const proximoHorario = addMinutes(conflitFim, 15) // 15 min de intervalo
    
    // Verificar se está dentro do horário comercial
    const hora = proximoHorario.getHours()
    if (hora >= 8 && hora < 18) {
      return format(proximoHorario, 'HH:mm')
    }
    
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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

  const getStatusLabel = (status: string) => {
    const labelMap = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado',
      'concluido': 'Concluído'
    }
    return labelMap[status as keyof typeof labelMap] || status
  }

  const getSeverityIcon = () => {
    if (conflictResult.loading) {
      return <CircularProgress size={20} />
    }
    
    if (conflictResult.hasConflicts) {
      return <ErrorIcon />
    }
    
    if (conflictResult.warnings.length > 0) {
      return <WarningIcon />
    }
    
    if (novoAgendamento.data_agendamento && novoAgendamento.hora_inicio) {
      return <CheckIcon />
    }
    
    return <InfoIcon />
  }

  const getSeverityText = () => {
    if (conflictResult.loading) {
      return 'Verificando conflitos...'
    }
    
    if (conflictResult.hasConflicts) {
      return 'Conflito de Horário Detectado'
    }
    
    if (conflictResult.warnings.length > 0) {
      return 'Atenção: Agendamentos Próximos'
    }
    
    if (novoAgendamento.data_agendamento && novoAgendamento.hora_inicio) {
      return 'Horário Disponível'
    }
    
    return 'Verificação de Conflitos'
  }

  const getAlertSeverity = () => {
    if (conflictResult.hasConflicts) return 'error'
    if (conflictResult.warnings.length > 0) return 'warning'
    if (novoAgendamento.data_agendamento && novoAgendamento.hora_inicio) return 'success'
    return 'info'
  }

  // Se não há dados suficientes para verificar, não mostrar nada
  if (!novoAgendamento.data_agendamento && !novoAgendamento.hora_inicio) {
    return null
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Alert 
        severity={getAlertSeverity()}
        icon={getSeverityIcon()}
        sx={{ mb: 2 }}
      >
        <AlertTitle>
          {getSeverityText()}
        </AlertTitle>
        
        {conflictResult.loading && (
          <Typography variant="body2">
            Verificando disponibilidade em tempo real...
          </Typography>
        )}

        {/* Conflitos */}
        {conflictResult.hasConflicts && conflictResult.conflicts.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Conflitos encontrados:
            </Typography>
            <List dense>
              {conflictResult.conflicts.map((conflict, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <ScheduleIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {conflict.cliente}
                        </Typography>
                        <Chip
                          label={getStatusLabel(conflict.status)}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(conflict.status),
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {conflict.servico} • {conflict.hora_inicio} - {conflict.hora_fim}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Warnings */}
        {conflictResult.warnings.length > 0 && (
          <Box sx={{ mt: conflictResult.hasConflicts ? 2 : 0 }}>
            {conflictResult.warnings.map((warning, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {warning}
              </Typography>
            ))}
          </Box>
        )}

        {/* Sugestões */}
        {conflictResult.suggestions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            {conflictResult.suggestions.map((suggestion, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                sx={{ 
                  mb: 0.5,
                  fontWeight: index === 0 ? 'medium' : 'normal'
                }}
              >
                {suggestion}
              </Typography>
            ))}
          </Box>
        )}

        {/* Mensagem de sucesso */}
        {!conflictResult.hasConflicts && 
         !conflictResult.loading && 
         conflictResult.warnings.length === 0 && 
         novoAgendamento.data_agendamento && 
         novoAgendamento.hora_inicio && (
          <Typography variant="body2">
            ✓ Horário disponível para {novoAgendamento.profissional_nome || 'o profissional selecionado'}
          </Typography>
        )}
      </Alert>
    </Box>
  )
}

// Hook personalizado para usar o ConflictChecker
export const useConflictChecker = () => {
  const [result, setResult] = useState<ConflictCheckResult>({
    hasConflicts: false,
    conflicts: [],
    warnings: [],
    suggestions: []
  })

  const checkConflicts = (agendamento: {
    profissional_id: string
    data_agendamento: string
    hora_inicio: string
    duracao_minutos: number
    agendamento_id?: string
  }) => {
    // Esta função seria chamada pelos componentes que usam o hook
    // A lógica de verificação seria similar à implementada no componente
    return result
  }

  return { result, checkConflicts }
} 