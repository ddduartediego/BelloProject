'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
} from '@mui/material'
import {
  Close as CloseIcon,
  PlayArrow as AbrirIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schema de validação
const abrirCaixaSchema = z.object({
  saldo_inicial: z
    .number({ required_error: 'Saldo inicial é obrigatório' })
    .min(0, 'Saldo inicial deve ser maior ou igual a zero')
    .max(10000, 'Saldo inicial não pode ser maior que R$ 10.000'),
})

type AbrirCaixaFormData = z.infer<typeof abrirCaixaSchema>

interface AbrirCaixaDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (saldoInicial: number) => void
  loading?: boolean
}

export default function AbrirCaixaDialog({
  open,
  onClose,
  onConfirm,
  loading = false
}: AbrirCaixaDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AbrirCaixaFormData>({
    resolver: zodResolver(abrirCaixaSchema),
    defaultValues: {
      saldo_inicial: 100.00,
    },
  })

  const onSubmit = (data: AbrirCaixaFormData) => {
    onConfirm(data.saldo_inicial)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open) {
      reset({
        saldo_inicial: 100.00,
      })
    }
  }, [open, reset])

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AbrirIcon color="success" />
            <Typography variant="h6" fontWeight="bold">
              Abrir Caixa
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Para abrir o caixa, informe o valor inicial em dinheiro disponível.
          </Alert>

          <Controller
            name="saldo_inicial"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Saldo Inicial *"
                type="number"
                fullWidth
                error={!!errors.saldo_inicial}
                helperText={errors.saldo_inicial?.message || 'Valor em reais (R$)'}
                disabled={loading}
                placeholder="100,00"
                inputProps={{ 
                  min: 0, 
                  max: 10000,
                  step: 0.01 
                }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Importante:</strong> O saldo inicial deve corresponder ao dinheiro físico 
              disponível no momento da abertura do caixa.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting}
            startIcon={<AbrirIcon />}
            sx={{ minWidth: 120 }}
            color="success"
          >
            {loading ? 'Abrindo...' : 'Abrir Caixa'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 