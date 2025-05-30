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
  Chip,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
} from '@mui/icons-material'
import { ProfissionalComUsuario } from '@/services/profissionais.service'

interface ConfirmDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  profissional: ProfissionalComUsuario | null
  loading?: boolean
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  profissional,
  loading = false
}: ConfirmDeleteDialogProps) {
  if (!profissional) return null

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getEspecialidadeColor = (especialidade: string) => {
    const colorMap: Record<string, string> = {
      'Corte': '#1976d2',
      'Coloração': '#388e3c',
      'Manicure': '#f57c00',
      'Pedicure': '#d32f2f',
      'Depilação': '#7b1fa2',
      'Estética': '#00796b',
      'Massagem': '#5d4037',
    }
    return colorMap[especialidade] || '#455a64'
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
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. O profissional será removido permanentemente do sistema.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'error.main',
              width: 56,
              height: 56,
              fontSize: '1.2rem',
              fontWeight: 'bold',
            }}
          >
            {getInitials(profissional.usuario.nome_completo)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {profissional.usuario.nome_completo}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {profissional.usuario.email}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {profissional.usuario.tipo_usuario}
            </Typography>
          </Box>
        </Box>

        {/* Especialidades */}
        {profissional.especialidades && profissional.especialidades.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Especialidades:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {profissional.especialidades.map((especialidade, index) => (
                <Chip 
                  key={index}
                  label={especialidade}
                  size="small"
                  sx={{
                    bgcolor: getEspecialidadeColor(especialidade),
                    color: 'white',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tem certeza que deseja excluir este profissional? Os seguintes dados serão removidos:
        </Typography>

        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Informações pessoais e de contato
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Especialidades e configurações profissionais
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Horários de trabalho configurados
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Histórico de agendamentos realizados
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Dados estatísticos e relatórios de performance
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Integração com Google Calendar (se configurada)
            </Typography>
          </li>
        </Box>

        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> Esta ação afetará todos os agendamentos futuros deste profissional. 
            Certifique-se de reatribuir ou cancelar os agendamentos antes de excluir.
          </Typography>
        </Alert>
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
          sx={{ minWidth: 140 }}
        >
          {loading ? 'Excluindo...' : 'Excluir Profissional'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 