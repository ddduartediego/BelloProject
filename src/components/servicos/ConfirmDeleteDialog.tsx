'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
} from '@mui/material'
import {
  Warning as WarningIcon,
  ContentCut as ServiceIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { Servico } from '@/types/database'

interface ConfirmDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  servico: Servico | null
  loading?: boolean
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  servico,
  loading = false
}: ConfirmDeleteDialogProps) {
  if (!servico) return null

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" fontWeight="bold">
            Confirmar Exclusão
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. O serviço será removido permanentemente do catálogo.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ServiceIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {servico.nome}
            </Typography>
            {servico.descricao && (
              <Typography variant="body2" color="text.secondary">
                {servico.descricao.length > 60 
                  ? `${servico.descricao.substring(0, 60)}...` 
                  : servico.descricao
                }
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(servico.preco)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Chip 
              label={formatDuration(servico.duracao_estimada_minutos)} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tem certeza que deseja excluir este serviço? Os seguintes dados serão removidos:
        </Typography>

        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Informações do serviço (nome, descrição, preço)
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Configurações de duração e categoria
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Histórico de agendamentos associados
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Dados estatísticos e relatórios
            </Typography>
          </li>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Excluindo...' : 'Excluir Serviço'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 