'use client'

import React, { useState, useEffect } from 'react'
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
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoComDetalhes, StatusAgendamento } from '@/types/database'

interface AgendaHojeProps {
  title?: string
}

export default function AgendaHoje({ title = 'Agenda de Hoje' }: AgendaHojeProps) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoComDetalhes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hoje = new Date()
  
  // Carregar agendamentos do dia
  useEffect(() => {
    const carregarAgendamentosHoje = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar agendamentos do dia atual
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0)
        const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)

        const { data, error: serviceError } = await agendamentosService.getAll(
          { page: 1, limit: 20 },
          {
            dataInicio: inicioHoje.toISOString(),
            dataFim: fimHoje.toISOString()
          },
          'data_hora_inicio'
        )

        if (serviceError) {
          setError(serviceError)
          return
        }

        // Verificar se data é paginada ou array direto
        const agendamentosData = Array.isArray(data) ? data : data?.data || []
        setAgendamentos(agendamentosData)
      } catch (err) {
        console.error('Erro ao carregar agendamentos:', err)
        setError('Erro inesperado ao carregar agendamentos')
      } finally {
        setLoading(false)
      }
    }

    carregarAgendamentosHoje()
  }, [])

  const getStatusColor = (status: StatusAgendamento): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'CONFIRMADO':
        return 'success'
      case 'PENDENTE':
        return 'warning'
      case 'CANCELADO':
        return 'error'
      case 'CONCLUIDO':
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: StatusAgendamento) => {
    switch (status) {
      case 'CONFIRMADO':
      case 'CONCLUIDO':
        return <CheckIcon fontSize="small" />
      case 'CANCELADO':
        return <CancelIcon fontSize="small" />
      case 'PENDENTE':
        return <PendingIcon fontSize="small" />
      default:
        return <TimeIcon fontSize="small" />
    }
  }

  const getStatusText = (status: StatusAgendamento): string => {
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

  const calcularHorarioFim = (horarioInicio: string, duracao: number) => {
    const [hora, minuto] = horarioInicio.split(':').map(Number)
    const inicioEmMinutos = hora * 60 + minuto
    const fimEmMinutos = inicioEmMinutos + duracao
    const horaFim = Math.floor(fimEmMinutos / 60)
    const minutoFim = fimEmMinutos % 60
    return `${horaFim.toString().padStart(2, '0')}:${minutoFim.toString().padStart(2, '0')}`
  }

  // Calcular estatísticas
  const estatisticas = {
    total: agendamentos.length,
    confirmados: agendamentos.filter(a => a.status === 'CONFIRMADO').length,
    pendentes: agendamentos.filter(a => a.status === 'PENDENTE').length,
    concluidos: agendamentos.filter(a => a.status === 'CONCLUIDO').length,
    cancelados: agendamentos.filter(a => a.status === 'CANCELADO').length,
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
            label={`${estatisticas.total} agendamentos`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip 
            label={`${estatisticas.confirmados} confirmados`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip 
            label={`${estatisticas.pendentes} pendentes`}
            color="warning"
            variant="outlined"
            size="small"
          />
          {estatisticas.concluidos > 0 && (
            <Chip 
              label={`${estatisticas.concluidos} concluídos`}
              color="info"
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        {/* Estado de carregamento */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Carregando agenda...
            </Typography>
          </Box>
        )}

        {/* Estado de erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Lista de agendamentos */}
        {!loading && !error && (
          <>
            {agendamentos.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary'
              }}>
                <TimeIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhum agendamento hoje
                </Typography>
                <Typography variant="body2">
                  Você está livre para organizar outros afazeres!
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {agendamentos.map((agendamento, index) => (
                  <React.Fragment key={agendamento.id}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {agendamento.cliente?.nome || 'Cliente não identificado'}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimeIcon fontSize="small" />
                              {format(new Date(agendamento.data_hora_inicio), 'HH:mm')} - 
                              {calcularHorarioFim(
                                format(new Date(agendamento.data_hora_inicio), 'HH:mm'),
                                agendamento.servicos?.[0]?.servico?.duracao_estimada_minutos || 60
                              )}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary">
                              {agendamento.servicos?.[0]?.servico?.nome || 'Serviço não identificado'}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary">
                              Prof: {agendamento.profissional?.usuario?.nome_completo || 'Não identificado'}
                            </Typography>

                            {agendamento.cliente?.telefone && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon fontSize="small" />
                                {agendamento.cliente.telefone}
                              </Typography>
                            )}
                          </Box>
                          
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              icon={getStatusIcon(agendamento.status)}
                              label={getStatusText(agendamento.status)}
                              color={getStatusColor(agendamento.status)}
                              size="small"
                              variant="outlined"
                            />
                            
                            {agendamento.servicos?.[0]?.servico?.preco && (
                              <Typography variant="caption" color="primary.main" fontWeight="medium" display="block" sx={{ mt: 0.5 }}>
                                R$ {agendamento.servicos[0].servico.preco.toFixed(2).replace('.', ',')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>
                    
                    {index < agendamentos.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}

        {/* Rodapé com última atualização */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Última atualização: {format(new Date(), 'HH:mm:ss')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
} 