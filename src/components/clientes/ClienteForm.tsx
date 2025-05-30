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
  CircularProgress,
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
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone inválido'),
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
    .or(z.literal(''))
})

type ClienteFormData = z.infer<typeof clienteSchema>

interface ClienteFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: ClienteFormData) => Promise<void>
  cliente?: Cliente
  loading?: boolean
}

export default function ClienteForm({
  open,
  onClose,
  onSave,
  cliente,
  loading = false
}: ClienteFormProps) {
  const isEditing = Boolean(cliente)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      data_nascimento: '',
      observacoes: ''
    },
    mode: 'onChange'
  })

  // Resetar form quando abrir/fechar ou mudar cliente
  React.useEffect(() => {
    if (open) {
      if (cliente) {
        // Converter formato da data para exibição
        const dataNascimento = cliente.data_nascimento
          ? new Date(cliente.data_nascimento).toLocaleDateString('pt-BR')
          : ''

        reset({
          nome: cliente.nome || '',
          telefone: cliente.telefone || '',
          email: cliente.email || '',
          data_nascimento: dataNascimento,
          observacoes: cliente.observacoes || ''
        })
      } else {
        reset({
          nome: '',
          telefone: '',
          email: '',
          data_nascimento: '',
          observacoes: ''
        })
      }
    }
  }, [open, cliente, reset])

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      } else {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      }
    }
    return value
  }

  // Função para formatar data
  const formatDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 8) {
      return cleaned
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
    }
    return value
  }

  const onSubmit = async (data: ClienteFormData) => {
    try {
      // Converter data de volta para formato ISO se fornecida
      let dataFormatada = data
      if (data.data_nascimento && data.data_nascimento.includes('/')) {
        const [dia, mes, ano] = data.data_nascimento.split('/')
        if (dia && mes && ano && ano.length === 4) {
          const dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
          dataFormatada = { ...data, data_nascimento: dataISO }
        }
      }

      await onSave(dataFormatada)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
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
            {/* Nome */}
            <Grid item xs={12}>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome Completo"
                    fullWidth
                    required
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                    disabled={loading}
                    autoFocus
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
                    label="Telefone"
                    fullWidth
                    required
                    error={!!errors.telefone}
                    helperText={errors.telefone?.message || 'Ex: (11) 99999-9999'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
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

            {/* Data de Nascimento */}
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
                    helperText={errors.data_nascimento?.message || 'Formato: DD/MM/AAAA'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatDate(e.target.value)
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
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.observacoes}
                    helperText={errors.observacoes?.message}
                    disabled={loading}
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                )}
              />
            </Grid>
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