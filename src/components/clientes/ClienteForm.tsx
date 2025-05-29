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
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Cliente } from '@/types/database'

// Schema de validação com Zod
const clienteSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999'),
  email: z
    .string()
    .email('Email deve ter um formato válido')
    .optional()
    .or(z.literal('')),
  data_nascimento: z
    .string()
    .optional()
    .or(z.literal('')),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
})

type ClienteFormData = z.infer<typeof clienteSchema>

interface ClienteFormProps {
  open: boolean
  onClose: () => void
  onSave: (cliente: ClienteFormData) => void
  cliente?: Partial<Cliente>
  loading?: boolean
  error?: string | null
}

export default function ClienteForm({
  open,
  onClose,
  onSave,
  cliente,
  loading = false,
  error = null
}: ClienteFormProps) {
  const isEditing = !!cliente?.id

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome || '',
      telefone: cliente?.telefone || '',
      email: cliente?.email || '',
      data_nascimento: cliente?.data_nascimento || '',
      observacoes: cliente?.observacoes || '',
    },
  })

  // Função para formatar telefone automaticamente
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return value
  }

  // Função para formatar data
  const formatData = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
    }
    return value
  }

  const onSubmit = (data: ClienteFormData) => {
    onSave(data)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open && cliente) {
      reset({
        nome: cliente.nome || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        data_nascimento: cliente.data_nascimento || '',
        observacoes: cliente.observacoes || '',
      })
    }
  }, [open, cliente, reset])

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
            <PersonIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
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
                    label="Nome Completo *"
                    fullWidth
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Telefone */}
            <Grid item xs={12} md={6}>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Telefone *"
                    fullWidth
                    error={!!errors.telefone}
                    helperText={errors.telefone?.message || 'Ex: (11) 99999-9999'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatTelefone(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 15
                    }}
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Data de nascimento */}
            <Grid item xs={12} md={6}>
              <Controller
                name="data_nascimento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Data de Nascimento"
                    fullWidth
                    error={!!errors.data_nascimento}
                    helperText={errors.data_nascimento?.message || 'Ex: 15/03/1990'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatData(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 10
                    }}
                  />
                )}
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <Controller
                name="observacoes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observações"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.observacoes}
                    helperText={errors.observacoes?.message || 'Informações adicionais sobre o cliente'}
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