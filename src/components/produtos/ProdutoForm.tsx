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
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Inventory as ProductIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Produto } from '@/types/database'

// Schema de validação com Zod
const produtoSchema = z.object({
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
  preco_custo: z
    .string()
    .regex(/^\d+([.,]\d{2})?$/, 'Preço de custo deve estar no formato 00,00')
    .optional()
    .or(z.literal('')),
  preco_venda: z
    .string()
    .min(1, 'Preço de venda é obrigatório')
    .regex(/^\d+([.,]\d{2})?$/, 'Preço de venda deve estar no formato 00,00'),
  estoque_atual: z
    .string()
    .min(1, 'Estoque atual é obrigatório')
    .regex(/^\d+$/, 'Estoque atual deve ser um número inteiro'),
  estoque_minimo: z
    .string()
    .regex(/^\d+$/, 'Estoque mínimo deve ser um número inteiro')
    .optional()
    .or(z.literal('')),
})

type ProdutoFormData = z.infer<typeof produtoSchema>

interface ProdutoFormProps {
  open: boolean
  onClose: () => void
  onSave: (produto: ProdutoFormData) => void
  produto?: Partial<Produto>
  loading?: boolean
  error?: string | null
}

export default function ProdutoForm({
  open,
  onClose,
  onSave,
  produto,
  loading = false,
  error = null
}: ProdutoFormProps) {
  const isEditing = !!produto?.id

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: produto?.nome || '',
      descricao: produto?.descricao || '',
      preco_custo: produto?.preco_custo ? produto.preco_custo.toString().replace('.', ',') : '',
      preco_venda: produto?.preco_venda ? produto.preco_venda.toString().replace('.', ',') : '',
      estoque_atual: produto?.estoque_atual?.toString() || '',
      estoque_minimo: produto?.estoque_minimo?.toString() || '',
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

  // Função para formatar estoque
  const formatEstoque = (value: string) => {
    return value.replace(/\D/g, '')
  }

  const onSubmit = (data: ProdutoFormData) => {
    // Converter preços de volta para decimal
    const dataFormatted = {
      ...data,
      preco_custo: data.preco_custo ? data.preco_custo.replace(',', '.') : '',
      preco_venda: data.preco_venda.replace(',', '.'),
    }
    onSave(dataFormatted)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open && produto) {
      reset({
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        preco_custo: produto.preco_custo ? produto.preco_custo.toString().replace('.', ',') : '',
        preco_venda: produto.preco_venda ? produto.preco_venda.toString().replace('.', ',') : '',
        estoque_atual: produto.estoque_atual?.toString() || '',
        estoque_minimo: produto.estoque_minimo?.toString() || '',
      })
    }
  }, [open, produto, reset])

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
            <ProductIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
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
            <Grid item xs={12}>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome do Produto *"
                    fullWidth
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Preço de Custo */}
            <Grid item xs={12} md={4}>
              <Controller
                name="preco_custo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Preço de Custo"
                    fullWidth
                    error={!!errors.preco_custo}
                    helperText={errors.preco_custo?.message || 'Ex: 25,50 (opcional)'}
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

            {/* Preço de Venda */}
            <Grid item xs={12} md={4}>
              <Controller
                name="preco_venda"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Preço de Venda *"
                    fullWidth
                    error={!!errors.preco_venda}
                    helperText={errors.preco_venda?.message || 'Ex: 50,00'}
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

            {/* Margem de lucro */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Margem de Lucro"
                fullWidth
                value="Calculado automaticamente"
                disabled
                helperText="Calculado com base nos preços de custo e venda"
              />
            </Grid>

            {/* Estoque Atual */}
            <Grid item xs={12} md={6}>
              <Controller
                name="estoque_atual"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Estoque Atual *"
                    fullWidth
                    error={!!errors.estoque_atual}
                    helperText={errors.estoque_atual?.message || 'Quantidade disponível'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatEstoque(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 6
                    }}
                  />
                )}
              />
            </Grid>

            {/* Estoque Mínimo */}
            <Grid item xs={12} md={6}>
              <Controller
                name="estoque_minimo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Estoque Mínimo"
                    fullWidth
                    error={!!errors.estoque_minimo}
                    helperText={errors.estoque_minimo?.message || 'Alerta quando atingir este valor'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatEstoque(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 6
                    }}
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
                    label="Descrição"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.descricao}
                    helperText={errors.descricao?.message || 'Marca, características, instruções de uso, etc.'}
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