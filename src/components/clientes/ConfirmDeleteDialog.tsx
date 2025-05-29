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
  Avatar,
} from '@mui/material'
import {
  Warning as WarningIcon,
} from '@mui/icons-material'
import { Cliente } from '@/types/database'

interface ConfirmDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  cliente: Cliente | null
  loading?: boolean
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  cliente,
  loading = false
}: ConfirmDeleteDialogProps) {
  if (!cliente) return null

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
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
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados do cliente serão removidos permanentemente.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'error.main' }}>
            {getInitials(cliente.nome)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {cliente.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cliente.telefone}
            </Typography>
            {cliente.email && (
              <Typography variant="body2" color="text.secondary">
                {cliente.email}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tem certeza que deseja excluir este cliente? Os seguintes dados serão removidos:
        </Typography>

        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Informações pessoais e de contato
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Histórico de agendamentos
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Histórico de comandas e compras
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Observações e preferências
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
          {loading ? 'Excluindo...' : 'Excluir Cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 