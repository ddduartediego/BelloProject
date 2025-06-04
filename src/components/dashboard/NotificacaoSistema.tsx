'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Badge,
  Typography,
  Slide,
  SlideProps,
  Fab,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material'
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Timeline as TrendIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================================
// INTERFACES
// ============================================================================

export interface NotificacaoItem {
  id: string
  tipo: 'info' | 'success' | 'warning' | 'error' | 'insight'
  titulo: string
  mensagem: string
  timestamp: string
  lida: boolean
  acao?: {
    texto: string
    callback: () => void
  }
  categoria: 'VENDAS' | 'CAIXA' | 'PROFISSIONAIS' | 'SISTEMA' | 'CLIENTE'
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  autoHide?: boolean
  duracao?: number // em ms, default 6000
}

interface NotificacaoSistemaProps {
  notificacoes: NotificacaoItem[]
  onNotificacaoLida: (id: string) => void
  onNotificacaoRemovida: (id: string) => void
  maxNotificacoesVisiveis?: number
  posicao?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

// ============================================================================
// COMPONENTE DE TRANSIÇÃO
// ============================================================================

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const NotificacaoSistema = memo(function NotificacaoSistema({
  notificacoes,
  onNotificacaoLida,
  onNotificacaoRemovida,
  maxNotificacoesVisiveis = 3,
  posicao = 'top-right'
}: NotificacaoSistemaProps) {
  
  const [notificacaoAtiva, setNotificacaoAtiva] = useState<NotificacaoItem | null>(null)
  const [filaNotificacoes, setFilaNotificacoes] = useState<NotificacaoItem[]>([])
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getIconePorTipo = useCallback((tipo: NotificacaoItem['tipo']) => {
    switch (tipo) {
      case 'success': return <SuccessIcon />
      case 'warning': return <WarningIcon />
      case 'error': return <ErrorIcon />
      case 'insight': return <TrendIcon />
      default: return <InfoIcon />
    }
  }, [])

  const getCorPorPrioridade = useCallback((prioridade: NotificacaoItem['prioridade']) => {
    switch (prioridade) {
      case 'CRITICA': return 'error'
      case 'ALTA': return 'warning'
      case 'MEDIA': return 'info'
      default: return 'success'
    }
  }, [])

  const formatarTimestamp = useCallback((timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: ptBR })
    } catch {
      return 'N/A'
    }
  }, [])

  // ============================================================================
  // GESTÃO DE NOTIFICAÇÕES
  // ============================================================================

  const processarFilaNotificacoes = useCallback(() => {
    if (!notificacaoAtiva && filaNotificacoes.length > 0) {
      const proximaNotificacao = filaNotificacoes[0]
      setNotificacaoAtiva(proximaNotificacao)
      setFilaNotificacoes(prev => prev.slice(1))
    }
  }, [notificacaoAtiva, filaNotificacoes])

  const adicionarNotificacao = useCallback((notificacao: NotificacaoItem) => {
    if (notificacao.prioridade === 'CRITICA') {
      // Notificações críticas aparecem imediatamente
      setNotificacaoAtiva(notificacao)
    } else {
      // Outras notificações vão para a fila
      setFilaNotificacoes(prev => [...prev, notificacao])
    }
  }, [])

  const fecharNotificacaoAtiva = useCallback(() => {
    if (notificacaoAtiva) {
      onNotificacaoLida(notificacaoAtiva.id)
      setNotificacaoAtiva(null)
    }
  }, [notificacaoAtiva, onNotificacaoLida])

  const removerNotificacao = useCallback((id: string) => {
    onNotificacaoRemovida(id)
    if (notificacaoAtiva?.id === id) {
      setNotificacaoAtiva(null)
    }
    setFilaNotificacoes(prev => prev.filter(n => n.id !== id))
  }, [notificacaoAtiva, onNotificacaoRemovida])

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Processar novas notificações
  useEffect(() => {
    const notificacoesNaoLidas = notificacoes.filter(n => !n.lida)
    notificacoesNaoLidas.forEach(notificacao => {
      const jaExiste = filaNotificacoes.some(n => n.id === notificacao.id) || 
                      notificacaoAtiva?.id === notificacao.id
      
      if (!jaExiste) {
        adicionarNotificacao(notificacao)
      }
    })
  }, [notificacoes, filaNotificacoes, notificacaoAtiva, adicionarNotificacao])

  // Processar fila quando notificação ativa é fechada
  useEffect(() => {
    processarFilaNotificacoes()
  }, [processarFilaNotificacoes])

  // Auto-hide para notificações que permitem
  useEffect(() => {
    if (notificacaoAtiva?.autoHide !== false) {
      const duracao = notificacaoAtiva?.duracao || 6000
      const timer = setTimeout(() => {
        fecharNotificacaoAtiva()
      }, duracao)

      return () => clearTimeout(timer)
    }
  }, [notificacaoAtiva, fecharNotificacaoAtiva])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAbrirPopover = (event: React.MouseEvent<HTMLElement>) => {
    setPopoverAnchor(event.currentTarget)
  }

  const handleFecharPopover = () => {
    setPopoverAnchor(null)
  }

  const handleExecutarAcao = (notificacao: NotificacaoItem) => {
    if (notificacao.acao) {
      notificacao.acao.callback()
      removerNotificacao(notificacao.id)
    }
  }

  // ============================================================================
  // CÁLCULOS
  // ============================================================================

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida)
  const totalNaoLidas = notificacoesNaoLidas.length
  const notificacoesCriticas = notificacoesNaoLidas.filter(n => n.prioridade === 'CRITICA')
  const temNotificacoesCriticas = notificacoesCriticas.length > 0

  const notificacoesRecentes = notificacoes
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box>
      {/* Botão de notificações flutuante */}
      <Fab
        size="medium"
        color={temNotificacoesCriticas ? 'error' : 'primary'}
        onClick={handleAbrirPopover}
        sx={{
          position: 'fixed',
          top: 16,
          right: 80,
          zIndex: 1000,
          animation: temNotificacoesCriticas ? 'pulse 1.5s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.1)' },
            '100%': { transform: 'scale(1)' }
          }
        }}
      >
        <Badge badgeContent={totalNaoLidas} color="error" max={99}>
          {temNotificacoesCriticas ? <NotificationsActiveIcon /> : <NotificationsIcon />}
        </Badge>
      </Fab>

      {/* Popover com histórico de notificações */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handleFecharPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { 
            width: 350, 
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Central de Notificações
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip size="small" label={`${totalNaoLidas} não lidas`} color="primary" />
            {temNotificacoesCriticas && (
              <Chip size="small" label="Críticas" color="error" />
            )}
          </Box>
        </Box>

        <Divider />

        <List sx={{ p: 0 }}>
          {notificacoesRecentes.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="Nenhuma notificação"
                secondary="Tudo funcionando perfeitamente!"
              />
            </ListItem>
          ) : (
            notificacoesRecentes.map((notificacao) => (
              <ListItem
                key={notificacao.id}
                sx={{
                  backgroundColor: !notificacao.lida ? 'action.hover' : 'transparent',
                  borderLeft: !notificacao.lida ? 3 : 0,
                  borderColor: `${getCorPorPrioridade(notificacao.prioridade)}.main`,
                  cursor: notificacao.acao ? 'pointer' : 'default'
                }}
                onClick={() => notificacao.acao && handleExecutarAcao(notificacao)}
              >
                <ListItemIcon sx={{ color: `${getCorPorPrioridade(notificacao.prioridade)}.main` }}>
                  {getIconePorTipo(notificacao.tipo)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={!notificacao.lida ? 'bold' : 'normal'}>
                        {notificacao.titulo}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          size="small" 
                          label={notificacao.categoria}
                          color={getCorPorPrioridade(notificacao.prioridade)}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatarTimestamp(notificacao.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {notificacao.mensagem}
                      </Typography>
                      {notificacao.acao && (
                        <Typography variant="caption" color="primary" sx={{ mt: 0.5 }}>
                          Clique para {notificacao.acao.texto.toLowerCase()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    removerNotificacao(notificacao.id)
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      </Popover>

      {/* Snackbar para notificação ativa */}
      <Snackbar
        open={Boolean(notificacaoAtiva)}
        autoHideDuration={notificacaoAtiva?.autoHide !== false ? (notificacaoAtiva?.duracao || 6000) : null}
        onClose={fecharNotificacaoAtiva}
        TransitionComponent={SlideTransition}
        anchorOrigin={{
          vertical: posicao.includes('top') ? 'top' : 'bottom',
          horizontal: posicao.includes('right') ? 'right' : 'left'
        }}
        sx={{
          '& .MuiSnackbar-root': {
            top: posicao.includes('top') ? 80 : undefined, // Espaço para não sobrepor o FAB
          }
        }}
      >
        {notificacaoAtiva ? (
          <Alert
            severity={notificacaoAtiva.tipo === 'insight' ? 'info' : notificacaoAtiva.tipo}
            onClose={fecharNotificacaoAtiva}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {notificacaoAtiva.acao && (
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => handleExecutarAcao(notificacaoAtiva)}
                    title={notificacaoAtiva.acao.texto}
                  >
                    <ScheduleIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={fecharNotificacaoAtiva}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{
              maxWidth: 400,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <AlertTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="inherit" fontWeight="bold">
                  {notificacaoAtiva.titulo}
                </Typography>
                <Chip 
                  size="small" 
                  label={notificacaoAtiva.categoria}
                  color={getCorPorPrioridade(notificacaoAtiva.prioridade)}
                  variant="outlined"
                />
              </Box>
            </AlertTitle>
            <Typography variant="body2">
              {notificacaoAtiva.mensagem}
            </Typography>
            {notificacaoAtiva.acao && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                💡 {notificacaoAtiva.acao.texto}
              </Typography>
            )}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
})

export default NotificacaoSistema 