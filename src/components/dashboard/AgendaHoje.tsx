'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  ContentCut as ServiceIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoComDetalhes } from '@/types/database'

interface AgendaHojeProps {
  title?: string
}

export default function AgendaHoje({ title = 'Agenda de Hoje' }: AgendaHojeProps) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoComDetalhes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgendamentos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const hoje = format(new Date(), 'yyyy-MM-dd')
      const response = await agendamentosService.getByData(hoje)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setAgendamentos(response.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar agendamentos'
      setError(errorMessage)
      console.error('Erro ao buscar agendamentos do dia:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
  }, [])

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'PENDENTE':
        return 'warning'
      case 'CONFIRMADO':
        return 'success'
      case 'CONCLUIDO':
        return 'info'
      case 'CANCELADO':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDENTE':
        return 'Pendente'
      case 'CONFIRMADO':
        return 'Confirmado'
      case 'CONCLUIDO':
        return 'Concluído'
      case 'CANCELADO':
        return 'Cancelado'
      default:
        return status
    }
  }

  const formatHorario = (dataHoraInicio: string, dataHoraFim: string) => {
    const inicio = new Date(dataHoraInicio)
    const fim = new Date(dataHoraFim)
    return `${format(inicio, 'HH:mm')} - ${format(fim, 'HH:mm')}`
  }

  const getIniciais = (nome: string): string => {
    return nome
      .split(' ')
      .map(palavra => palavra.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const agendamentosOrdenados = agendamentos.sort((a, b) => {
    return new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime()
  })

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchAgendamentos} 
            disabled={loading}
            size="small"
            title="Atualizar agenda"
          >
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : agendamentosOrdenados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum agendamento hoje
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aproveite para organizar o salão ou prospectar novos clientes
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <List disablePadding>
              {agendamentosOrdenados.map((agendamento, index) => (
                <ListItem
                  key={agendamento.id}
                  sx={{
                    borderLeft: 4,
                    borderColor: getStatusColor(agendamento.status) + '.main',
                    mb: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: getStatusColor(agendamento.status) + '.main',
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getIniciais(agendamento.cliente?.nome || 'Cliente')}
                  </Avatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {agendamento.cliente?.nome || 'Cliente não identificado'}
                        </Typography>
                        <Chip
                          label={getStatusLabel(agendamento.status)}
                          color={getStatusColor(agendamento.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatHorario(agendamento.data_hora_inicio, agendamento.data_hora_fim)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {agendamento.profissional?.usuario?.nome_completo || 'Profissional não identificado'}
                          </Typography>
                        </Box>

                        {agendamento.cliente?.telefone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {agendamento.cliente.telefone}
                            </Typography>
                          </Box>
                        )}

                        {agendamento.servicos && agendamento.servicos.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ServiceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {agendamento.servicos.map(as => as.servico?.nome).filter(Boolean).join(', ')}
                            </Typography>
                          </Box>
                        )}

                        {agendamento.observacoes && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Obs: {agendamento.observacoes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Resumo da agenda */}
        {!loading && agendamentosOrdenados.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Resumo do dia:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${agendamentosOrdenados.length} Total`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${agendamentosOrdenados.filter(a => a.status === 'PENDENTE').length} Pendente${agendamentosOrdenados.filter(a => a.status === 'PENDENTE').length !== 1 ? 's' : ''}`}
                color="warning"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${agendamentosOrdenados.filter(a => a.status === 'CONFIRMADO').length} Confirmado${agendamentosOrdenados.filter(a => a.status === 'CONFIRMADO').length !== 1 ? 's' : ''}`}
                color="success"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${agendamentosOrdenados.filter(a => a.status === 'CONCLUIDO').length} Concluído${agendamentosOrdenados.filter(a => a.status === 'CONCLUIDO').length !== 1 ? 's' : ''}`}
                color="info"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
} 