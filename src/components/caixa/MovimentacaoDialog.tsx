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
  MenuItem,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schema de validação
const movimentacaoSchema = z.object({
  valor: z
    .number({ required_error: 'Valor é obrigatório' })
    .min(0.01, 'Valor deve ser maior que zero')
    .max(10000, 'Valor não pode ser maior que R$ 10.000'),
  descricao: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  categoria: z
    .string()
    .min(1, 'Categoria é obrigatória'),
})

type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>

interface MovimentacaoDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (tipo: 'ENTRADA' | 'SAIDA', valor: number, descricao: string, categoria: string) => void
  tipo: 'ENTRADA' | 'SAIDA'
  loading?: boolean
}

const categoriasEntrada = [
  { value: 'VENDA', label: 'Venda' },
  { value: 'REFORCO', label: 'Reforço' },
  { value: 'OUTRO', label: 'Outro' },
]

const categoriasSaida = [
  { value: 'SANGRIA', label: 'Sangria' },
  { value: 'DESPESA', label: 'Despesa' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function MovimentacaoDialog({
  open,
  onClose,
  onConfirm,
  tipo,
  loading = false
}: MovimentacaoDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      valor: 0,
      descricao: '',
      categoria: '',
    },
  })

  const onSubmit = (data: MovimentacaoFormData) => {
    onConfirm(tipo, data.valor, data.descricao, data.categoria)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open) {
      const categoriaDefault = tipo === 'ENTRADA' ? 'REFORCO' : 'SANGRIA'
      reset({
        valor: 0,
        descricao: '',
        categoria: categoriaDefault,
      })
    }
  }, [open, tipo, reset])

  const categorias = tipo === 'ENTRADA' ? categoriasEntrada : categoriasSaida
  const isEntrada = tipo === 'ENTRADA'

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
            {isEntrada ? (
              <AddIcon color="success" />
            ) : (
              <RemoveIcon color="error" />
            )}
            <Typography variant="h6" fontWeight="bold">
              {isEntrada ? 'Nova Entrada' : 'Nova Saída'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Categoria */}
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Categoria *"
                  fullWidth
                  error={!!errors.categoria}
                  helperText={errors.categoria?.message}
                  disabled={loading}
                >
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Valor */}
            <Controller
              name="valor"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Valor *"
                  type="number"
                  fullWidth
                  error={!!errors.valor}
                  helperText={errors.valor?.message || 'Valor em reais (R$)'}
                  disabled={loading}
                  placeholder="0,00"
                  inputProps={{ 
                    min: 0.01, 
                    max: 10000,
                    step: 0.01 
                  }}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />

            {/* Descrição */}
            <Controller
              name="descricao"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descrição *"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.descricao}
                  helperText={errors.descricao?.message || 'Descreva o motivo da movimentação'}
                  disabled={loading}
                  placeholder={
                    isEntrada 
                      ? 'Ex: Reforço para troco, dinheiro adicional'
                      : 'Ex: Sangria para banco, pagamento fornecedor'
                  }
                />
              )}
            />
          </Box>

          {/* Informação sobre o tipo */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: isEntrada ? 'success.50' : 'error.50', 
            borderRadius: 1,
            border: 1,
            borderColor: isEntrada ? 'success.200' : 'error.200'
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{isEntrada ? 'Entrada:' : 'Saída:'}</strong>{' '}
              {isEntrada 
                ? 'Esta operação irá adicionar o valor ao saldo do caixa.'
                : 'Esta operação irá subtrair o valor do saldo do caixa.'
              }
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
            startIcon={isEntrada ? <AddIcon /> : <RemoveIcon />}
            sx={{ minWidth: 120 }}
            color={isEntrada ? 'success' : 'error'}
          >
            {loading ? 'Registrando...' : `Registrar ${isEntrada ? 'Entrada' : 'Saída'}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 