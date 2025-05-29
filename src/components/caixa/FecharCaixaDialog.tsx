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
  Divider,
  Stack,
  Grid,
} from '@mui/material'
import {
  Close as CloseIcon,
  Stop as FecharIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SaidaIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Caixa } from '@/types/database'

// Schema de validação
const fecharCaixaSchema = z.object({
  saldo_informado: z
    .number({ required_error: 'Saldo informado é obrigatório' })
    .min(0, 'Saldo informado deve ser maior ou igual a zero'),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
})

type FecharCaixaFormData = z.infer<typeof fecharCaixaSchema>

interface FecharCaixaDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (observacoes?: string) => void
  caixa: Caixa | null
  saldoCalculado: number
  totalEntradas: number
  totalSaidas: number
  loading?: boolean
}

export default function FecharCaixaDialog({
  open,
  onClose,
  onConfirm,
  caixa,
  saldoCalculado,
  totalEntradas,
  totalSaidas,
  loading = false
}: FecharCaixaDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FecharCaixaFormData>({
    resolver: zodResolver(fecharCaixaSchema),
    defaultValues: {
      saldo_informado: saldoCalculado,
      observacoes: '',
    },
  })

  const saldoInformado = watch('saldo_informado')
  const diferenca = saldoInformado - saldoCalculado

  const onSubmit = (data: FecharCaixaFormData) => {
    onConfirm(data.observacoes)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open && caixa) {
      reset({
        saldo_informado: saldoCalculado,
        observacoes: '',
      })
    }
  }, [open, caixa, saldoCalculado, reset])

  if (!caixa) return null

  const getSeverityDiferenca = () => {
    if (Math.abs(diferenca) <= 0.01) return 'success' // Considera diferenças mínimas como corretas
    if (Math.abs(diferenca) <= 10) return 'warning'
    return 'error'
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FecharIcon color="error" />
            <Typography variant="h6" fontWeight="bold">
              Fechar Caixa
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {/* Resumo do Caixa */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Resumo do Caixa
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Abertura
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(caixa.data_abertura).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(caixa.data_abertura).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Inicial
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    R$ {caixa.saldo_inicial.toFixed(2).replace('.', ',')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Movimentações do Dia */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Movimentações do Dia
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EntradaIcon color="success" />
                  <Typography>Total de Entradas</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  + R$ {totalEntradas.toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SaidaIcon color="error" />
                  <Typography>Total de Saídas</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  - R$ {totalSaidas.toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">Saldo Calculado</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  R$ {saldoCalculado.toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Conferência de Valores */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Conferência de Valores
            </Typography>
            
            <Controller
              name="saldo_informado"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Saldo Real (Contado) *"
                  type="number"
                  fullWidth
                  error={!!errors.saldo_informado}
                  helperText={errors.saldo_informado?.message || 'Valor que você contou fisicamente no caixa'}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  inputProps={{ 
                    min: 0,
                    step: 0.01 
                  }}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />

            {/* Diferença */}
            {Math.abs(diferenca) > 0.01 && (
              <Alert severity={getSeverityDiferenca()} sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  Diferença detectada: {diferenca > 0 ? '+' : ''} R$ {Math.abs(diferenca).toFixed(2).replace('.', ',')}
                </Typography>
                <Typography variant="body2">
                  {diferenca > 0 
                    ? 'Há mais dinheiro no caixa do que o calculado.'
                    : 'Há menos dinheiro no caixa do que o calculado.'
                  }
                </Typography>
              </Alert>
            )}

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
                  error={!!errors.observacoes}
                  helperText={errors.observacoes?.message || 'Informações adicionais sobre o fechamento (opcional)'}
                  disabled={loading}
                  placeholder="Ex: Diferença devido a quebra de notas, gorjetas, etc."
                />
              )}
            />
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
            startIcon={<FecharIcon />}
            sx={{ minWidth: 120 }}
            color="error"
          >
            {loading ? 'Fechando...' : 'Fechar Caixa'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 