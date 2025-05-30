'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  DialogContentText,
} from '@mui/material'
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ContentCut as ServiceIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  MoreVert as MoreVertIcon,
  WhatsApp as WhatsAppIcon,
  Delete as DeleteIcon,
  TaskAlt as CompleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoAdapter, type AgendamentoCompleto } from '@/utils/agendamento-adapter'
import { AgendamentoComDetalhes } from '@/types/database'

interface AgendamentoDetailsProps {
  open: boolean
  onClose: () => void
  agendamento: AgendamentoCompleto | null
  onEdit: (agendamento: AgendamentoCompleto) => void
  onRefresh: () => void
}

export default function AgendamentoDetails({
  open,
  onClose,
  agendamento: initialAgendamento,
  onEdit,
  onRefresh,
}: AgendamentoDetailsProps) {
  const [agendamento, setAgendamento] = useState<AgendamentoCompleto | null>(initialAgendamento)
  const [loading, setLoading] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Carregar detalhes completos quando o dialog abre
  useEffect(() => {
    if (open && initialAgendamento?.id) {
      loadAgendamentoDetails(initialAgendamento.id)
    } else {
      setAgendamento(initialAgendamento)
    }
  }, [open, initialAgendamento])

  const loadAgendamentoDetails = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await agendamentosService.getById(id)
      
      if (response.data) {
        const agendamentoCompleto = AgendamentoAdapter.toFrontend(response.data)
        setAgendamento(agendamentoCompleto)
      } else {
        throw new Error(response.error || 'Erro ao carregar detalhes do agendamento')
      }
    } catch (err) {
      console.error('Erro ao carregar agendamento:', err)
      setError('Erro ao carregar detalhes do agendamento')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: 'confirmado' | 'cancelado' | 'concluido') => {
    if (!agendamento) return
    
    setActionLoading(newStatus)
    
    try {
      const response = await agendamentosService.updateStatus(agendamento.id, AgendamentoAdapter.mapStatusToBackend(newStatus))
      
      if (response.data) {
        // Recarregar dados completos após atualizar status
        await loadAgendamentoDetails(agendamento.id)
        onRefresh()
        
        const statusLabels = {
          'confirmado': 'confirmado',
          'cancelado': 'cancelado',
          'concluido': 'concluído'
        }
        
        // Mostrar notificação de sucesso seria ideal aqui
        console.log(`Agendamento ${statusLabels[newStatus]} com sucesso!`)
      } else {
        throw new Error(response.error || 'Erro ao atualizar status')
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setError(`Erro ao atualizar status do agendamento`)
    } finally {
      setActionLoading(null)
      setActionMenuAnchor(null)
    }
  }

  const handleDelete = async () => {
    if (!agendamento) return
    
    setActionLoading('delete')
    
    try {
      const response = await agendamentosService.delete(agendamento.id)
      
      if (response.data) {
        onRefresh()
        onClose()
        // Mostrar notificação de sucesso seria ideal aqui
        console.log('Agendamento excluído com sucesso!')
      } else {
        throw new Error(response.error || 'Erro ao excluir agendamento')
      }
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err)
      setError('Erro ao excluir agendamento')
    } finally {
      setActionLoading(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setActionMenuAnchor(null)
  }

  const handleWhatsApp = () => {
    if (!agendamento?.cliente.telefone) return
    
    const telefone = agendamento.cliente.telefone.replace(/\D/g, '')
    const data = format(parseISO(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })
    const mensagem = `Olá ${agendamento.cliente.nome}! Confirmando seu agendamento para ${data} às ${agendamento.hora_inicio}. Aguardo você! 😊`
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  if (!agendamento) return null

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}min`
  }

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getAvatarColor = (nome: string) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#00796b', '#5d4037', '#455a64'
    ]
    const hash = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const canEditStatus = (status: string) => {
    return status === 'agendado' || status === 'confirmado'
  }

  const canCancel = (status: string) => {
    return status === 'agendado' || status === 'confirmado'
  }

  const canComplete = (status: string) => {
    return status === 'confirmado'
  }

  const canConfirm = (status: string) => {
    return status === 'agendado'
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventIcon color="primary" />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Detalhes do Agendamento
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {agendamento.title || agendamento.servico.nome}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => loadAgendamentoDetails(agendamento.id)} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* Status e Ações Rápidas */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Chip
                  label={getStatusLabel(agendamento.status)}
                  sx={{
                    bgcolor: getStatusColor(agendamento.status),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    height: 36,
                    '& .MuiChip-label': {
                      px: 2
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {canConfirm(agendamento.status) && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={actionLoading === 'confirmado' ? <CircularProgress size={16} /> : <CheckIcon />}
                      onClick={() => handleUpdateStatus('confirmado')}
                      disabled={!!actionLoading}
                      color="success"
                    >
                      Confirmar
                    </Button>
                  )}
                  
                  {canComplete(agendamento.status) && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={actionLoading === 'concluido' ? <CircularProgress size={16} /> : <CompleteIcon />}
                      onClick={() => handleUpdateStatus('concluido')}
                      disabled={!!actionLoading}
                      color="primary"
                    >
                      Concluir
                    </Button>
                  )}
                  
                  {canCancel(agendamento.status) && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={actionLoading === 'cancelado' ? <CircularProgress size={16} /> : <CancelIcon />}
                      onClick={() => handleUpdateStatus('cancelado')}
                      disabled={!!actionLoading}
                      color="error"
                    >
                      Cancelar
                    </Button>
                  )}
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Informações do Cliente */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: getAvatarColor(agendamento.cliente?.nome || 'Cliente'),
                            width: 56,
                            height: 56,
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {getInitials(agendamento.cliente?.nome || 'Cliente')}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {agendamento.cliente?.nome || 'Cliente não informado'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cliente
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {agendamento.cliente?.telefone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {agendamento.cliente.telefone}
                            </Typography>
                            <IconButton size="small" onClick={handleWhatsApp} color="success">
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        
                        {agendamento.cliente?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {agendamento.cliente.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informações do Profissional */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: getAvatarColor(agendamento.profissional.nome || 'Profissional'),
                            width: 56,
                            height: 56,
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {getInitials(agendamento.profissional.nome || 'Profissional')}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {agendamento.profissional.nome || 'Profissional não informado'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Profissional
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ServiceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {agendamento.profissional.especialidades?.join(', ') || 'Especialidades não informadas'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informações do Serviço */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ServiceIcon color="primary" />
                        Serviço
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Descrição
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {agendamento.servico.nome || agendamento.title || 'Serviço não informado'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Duração
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {agendamento.servico.duracao ? formatDuration(agendamento.servico.duracao) : 'Não informado'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Valor
                          </Typography>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {agendamento.valor ? formatCurrency(agendamento.valor) : (agendamento.servico.preco ? formatCurrency(agendamento.servico.preco) : 'Não informado')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informações de Data e Hora */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon color="primary" />
                        Data e Horário
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body1" fontWeight="medium">
                            {format(parseISO(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body1" fontWeight="medium">
                            {agendamento.hora_inicio} - {agendamento.hora_fim}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Observações */}
                {agendamento.observacoes && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotesIcon color="primary" />
                          Observações
                        </Typography>
                        <Typography variant="body1">
                          {agendamento.observacoes}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button onClick={onClose} variant="outlined">
            Fechar
          </Button>
          
          <Button
            onClick={() => onEdit(agendamento)}
            variant="contained"
            startIcon={<EditIcon />}
            disabled={loading || !!actionLoading}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu de ações */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(agendamento); handleMenuClose() }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar Agendamento</ListItemText>
        </MenuItem>

        {agendamento.cliente.telefone && (
          <MenuItem onClick={() => { handleWhatsApp(); handleMenuClose() }}>
            <ListItemIcon>
              <WhatsAppIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Enviar WhatsApp</ListItemText>
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose() }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir Agendamento</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirmar Exclusão
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
          </DialogContentText>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Cliente:</strong> {agendamento?.cliente.nome}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Serviço:</strong> {agendamento?.servico.nome}
            </Typography>
            <Typography variant="subtitle2">
              <strong>Data:</strong> {agendamento && format(parseISO(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })} às {agendamento?.hora_inicio}
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading === 'delete'}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={actionLoading === 'delete'}
            startIcon={actionLoading === 'delete' ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {actionLoading === 'delete' ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 