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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  ContentCut as ServiceIcon,
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
    .string()
    .min(1, 'Preço é obrigatório')
    .regex(/^\d+([.,]\d{2})?$/, 'Preço deve estar no formato 00,00'),
  duracao_minutos: z
    .string()
    .min(1, 'Duração é obrigatória')
    .regex(/^\d+$/, 'Duração deve ser um número inteiro'),
  categoria: z
    .string()
    .min(1, 'Categoria é obrigatória'),
  ativo: z.boolean().default(true),
})

type ServicoFormData = z.infer<typeof servicoSchema>

interface ServicoFormProps {
  open: boolean
  onClose: () => void
  onSave: (servico: ServicoFormData) => void
  servico?: Partial<Servico>
  loading?: boolean
  error?: string | null
}

// Categorias disponíveis
const categorias = [
  'Corte de Cabelo',
  'Coloração',
  'Tratamentos Capilares',
  'Manicure e Pedicure',
  'Depilação',
  'Estética Facial',
  'Massagem',
  'Outros'
]

export default function ServicoForm({
  open,
  onClose,
  onSave,
  servico,
  loading = false,
  error = null
}: ServicoFormProps) {
  const isEditing = !!servico?.id

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: servico?.nome || '',
      descricao: servico?.descricao || '',
      preco: servico?.preco ? servico.preco.toString().replace('.', ',') : '',
      duracao_minutos: servico?.duracao_estimada_minutos?.toString() || '',
      categoria: 'Corte de Cabelo',
      ativo: true,
    },
  })

  // Função para formatar preço automaticamente
  const formatPreco = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      const formatted = numbers.padStart(3, '0')
      const integer = formatted.slice(0, -2) || '0'
      const decimal = formatted.slice(-2)
      return `${integer.replace(/^0+/, '') || '0'},${decimal}`
    }
    return value
  }

  // Função para formatar duração
  const formatDuracao = (value: string) => {
    return value.replace(/\D/g, '')
  }

  const onSubmit = (data: ServicoFormData) => {
    // Converter preço de volta para decimal
    const precoDecimal = data.preco.replace(',', '.')
    const dataFormatted = {
      ...data,
      preco: precoDecimal,
      duracao_minutos: data.duracao_minutos,
    }
    onSave(dataFormatted)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open && servico) {
      reset({
        nome: servico.nome || '',
        descricao: servico.descricao || '',
        preco: servico.preco ? servico.preco.toString().replace('.', ',') : '',
        duracao_minutos: servico.duracao_estimada_minutos?.toString() || '',
        categoria: 'Corte de Cabelo',
        ativo: true,
      })
    }
  }, [open, servico, reset])

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
            <ServiceIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Nome */}
            <Grid item xs={12} md={6}>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome do Serviço *"
                    fullWidth
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Categoria */}
            <Grid item xs={12} md={6}>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoria}>
                    <InputLabel>Categoria *</InputLabel>
                    <Select
                      {...field}
                      label="Categoria *"
                      disabled={loading}
                    >
                      {categorias.map((categoria) => (
                        <MenuItem key={categoria} value={categoria}>
                          {categoria}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoria && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                        {errors.categoria.message}
                      </Typography>
                    )}
                  </FormControl>
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
                    {...field}
                    label="Preço *"
                    fullWidth
                    error={!!errors.preco}
                    helperText={errors.preco?.message || 'Ex: 50,00'}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    onChange={(e) => {
                      const formatted = formatPreco(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 10
                    }}
                  />
                )}
              />
            </Grid>

            {/* Duração */}
            <Grid item xs={12} md={6}>
              <Controller
                name="duracao_minutos"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Duração (minutos) *"
                    fullWidth
                    error={!!errors.duracao_minutos}
                    helperText={errors.duracao_minutos?.message || 'Ex: 60'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatDuracao(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 4
                    }}
                  />
                )}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <Controller
                name="ativo"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      {...field}
                      value={field.value ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                      label="Status"
                      disabled={loading}
                    >
                      <MenuItem value="true">Ativo</MenuItem>
                      <MenuItem value="false">Inativo</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Espaço vazio para alinhar */}
            <Grid item xs={12} md={6} />

            {/* Descrição */}
            <Grid item xs={12}>
              <Controller
                name="descricao"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descrição"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.descricao}
                    helperText={errors.descricao?.message || 'Descreva o serviço, técnicas utilizadas, benefícios, etc.'}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>
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
            startIcon={<SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 