'use client'

import React from 'react'
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
  Grid,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Edit as EditIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Caixa } from '@/types/database'

// Schema de validação
const editarCaixaSchema = z.object({
  saldo_final_informado: z
    .number({ required_error: 'Saldo real é obrigatório' })
    .min(0, 'Saldo real deve ser maior ou igual a zero'),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
})

type EditarCaixaFormData = z.infer<typeof editarCaixaSchema>

interface EditarCaixaDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: EditarCaixaFormData) => Promise<void>
  caixa: Caixa
  saldoCalculado: number
  loading?: boolean
}

export default function EditarCaixaDialog({
  open,
  onClose,
  onConfirm,
  caixa,
  saldoCalculado,
  loading = false
}: EditarCaixaDialogProps) {
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<EditarCaixaFormData>({
    resolver: zodResolver(editarCaixaSchema),
    defaultValues: {
      saldo_final_informado: caixa?.saldo_final_informado || saldoCalculado,
      observacoes: caixa?.observacoes || ''
    },
    mode: 'onChange'
  })

  // Reset form quando o modal abrir
  React.useEffect(() => {
    if (open && caixa) {
      reset({
        saldo_final_informado: caixa.saldo_final_informado || saldoCalculado,
        observacoes: caixa.observacoes || ''
      })
    }
  }, [open, caixa, saldoCalculado, reset])

  const onSubmit = async (data: EditarCaixaFormData) => {
    try {
      await onConfirm(data)
      onClose()
    } catch (error) {
      // Erro será tratado pelo componente pai
    }
  }

  const diferenca = (caixa?.saldo_final_informado || saldoCalculado) - saldoCalculado

  if (!caixa) {
    return null
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
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'warning.main',
        color: 'warning.contrastText',
        borderRadius: '8px 8px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          <Typography variant="h6" fontWeight="bold">
            Editar Caixa
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ color: 'warning.contrastText' }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Informações do Caixa */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Caixa:</strong> {new Date(caixa.data_abertura).toLocaleDateString('pt-BR')}<br/>
            <strong>Status:</strong> {caixa.status}<br/>
            <strong>Saldo Inicial:</strong> R$ {(caixa.saldo_inicial || 0).toFixed(2).replace('.', ',')}
          </Typography>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Resumo Financeiro */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Resumo Financeiro
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                mb: 2
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Calculado pelo Sistema
                  </Typography>
                  <Typography variant="h6" color="primary">
                    R$ {saldoCalculado.toFixed(2).replace('.', ',')}
                  </Typography>
                </Box>
                <MoneyIcon color="primary" />
              </Box>
            </Grid>

            {/* Saldo Real */}
            <Grid item xs={12}>
              <Controller
                name="saldo_final_informado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Saldo Real *"
                    type="number"
                    fullWidth
                    inputProps={{ 
                      step: 0.01,
                      min: 0,
                      'aria-label': 'Saldo real'
                    }}
                    error={!!errors.saldo_final_informado}
                    helperText={
                      errors.saldo_final_informado?.message || 
                      'Informe o saldo real contado no fechamento'
                    }
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Diferença */}
            {Math.abs(diferenca) > 0.01 && (
              <Grid item xs={12}>
                <Alert 
                  severity={diferenca > 0 ? 'warning' : 'error'}
                  sx={{ mt: 1 }}
                >
                  <Typography variant="body2">
                    <strong>Diferença: </strong>
                    R$ {Math.abs(diferenca).toFixed(2).replace('.', ',')} 
                    {diferenca > 0 ? ' (Sobra)' : ' (Falta)'}
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Observações */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Controller
                name="observacoes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observações"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Adicione observações sobre este caixa..."
                    error={!!errors.observacoes}
                    helperText={errors.observacoes?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="warning"
          startIcon={<EditIcon />}
          disabled={!isValid || loading}
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 