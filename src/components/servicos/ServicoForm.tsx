'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  ContentCut as ServiceIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Servico } from '@/types/database'

// Schema de validação com Zod
const servicoSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  descricao: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  preco: z
    .number()
    .min(0.01, 'Preço deve ser maior que zero')
    .max(9999.99, 'Preço não pode ser maior que R$ 9.999,99'),
  duracao_estimada_minutos: z
    .number()
    .min(5, 'Duração mínima é de 5 minutos')
    .max(1440, 'Duração máxima é de 24 horas (1440 minutos)')
})

type ServicoFormData = z.infer<typeof servicoSchema>

interface ServicoFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { nome: string; descricao?: string; duracao_estimada_minutos: number; preco: number }) => Promise<void>
  servico?: Servico
  loading?: boolean
}

export default function ServicoForm({
  open,
  onClose,
  onSave,
  servico,
  loading = false
}: ServicoFormProps) {
  const isEditing = Boolean(servico)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      preco: 0,
      duracao_estimada_minutos: 30
    },
    mode: 'onChange'
  })

  // Resetar form quando abrir/fechar ou mudar serviço
  React.useEffect(() => {
    if (open) {
      if (servico) {
        reset({
          nome: servico.nome || '',
          descricao: servico.descricao || '',
          preco: servico.preco || 0,
          duracao_estimada_minutos: servico.duracao_estimada_minutos || 30
        })
      } else {
        reset({
          nome: '',
          descricao: '',
          preco: 0,
          duracao_estimada_minutos: 30
        })
      }
    }
  }, [open, servico, reset])

  const onSubmit = async (data: ServicoFormData) => {
    try {
      await onSave(data)
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Função para formatar preço durante digitação
  const handlePrecoChange = (value: string, onChange: (value: number) => void) => {
    // Remove tudo que não é número, vírgula ou ponto
    const cleaned = value.replace(/[^\d.,]/g, '')
    
    // Converte vírgula para ponto
    const withDot = cleaned.replace(',', '.')
    
    // Parse para número
    const numericValue = parseFloat(withDot) || 0
    
    // Limita a 2 casas decimais
    const roundedValue = Math.round(numericValue * 100) / 100
    
    onChange(roundedValue)
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

  const watchedPreco = watch('preco')
  const watchedDuracao = watch('duracao_estimada_minutos')

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ServiceIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Nome do Serviço */}
            <Grid item xs={12}>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome do Serviço"
                    fullWidth
                    required
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                    disabled={loading}
                    autoFocus
                    placeholder="Ex: Corte Feminino, Manicure, Coloração..."
                  />
                )}
              />
            </Grid>

            {/* Preço */}
            <Grid item xs={12} md={6}>
              <Controller
                name="preco"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Preço"
                    fullWidth
                    required
                    error={!!errors.preco}
                    helperText={errors.preco?.message || `Formato: ${formatCurrency(watchedPreco || 0)}`}
                    disabled={loading}
                    placeholder="0,00"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon />
                        </InputAdornment>
                      ),
                    }}
                    value={field.value?.toString().replace('.', ',') || ''}
                    onChange={(e) => handlePrecoChange(e.target.value, field.onChange)}
                  />
                )}
              />
            </Grid>

            {/* Duração */}
            <Grid item xs={12} md={6}>
              <Controller
                name="duracao_estimada_minutos"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Duração (minutos)"
                    type="number"
                    fullWidth
                    required
                    error={!!errors.duracao_estimada_minutos}
                    helperText={errors.duracao_estimada_minutos?.message || `Duração: ${formatDuration(watchedDuracao || 0)}`}
                    disabled={loading}
                    inputProps={{
                      min: 5,
                      max: 1440,
                      step: 5
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TimeIcon />
                        </InputAdornment>
                      ),
                    }}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>

            {/* Descrição */}
            <Grid item xs={12}>
              <Controller
                name="descricao"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descrição (opcional)"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.descricao}
                    helperText={errors.descricao?.message}
                    disabled={loading}
                    placeholder="Descreva o serviço, incluindo o que está incluso, produtos utilizados, etc..."
                  />
                )}
              />
            </Grid>

            {/* Preview do serviço */}
            {(watchedPreco > 0 || watchedDuracao > 0) && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Preview do Serviço:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2">
                      <strong>Preço:</strong> {formatCurrency(watchedPreco || 0)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Duração:</strong> {formatDuration(watchedDuracao || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Alert de validação */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Por favor, corrija os erros antes de continuar.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
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
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 