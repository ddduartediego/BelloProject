'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Chip,
  Divider,
  Stack,
  Grid,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'
import { ComandaComDetalhes } from '@/types/database'

interface ComandaDetalhesProps {
  comanda: ComandaComDetalhes
  open: boolean
  onClose: () => void
  onFinishComanda: (comanda: ComandaComDetalhes) => void
  onUpdateComanda: (comanda: Partial<ComandaComDetalhes>) => void
}

export default function ComandaDetalhes({ 
  comanda, 
  open, 
  onClose, 
  onFinishComanda 
}: ComandaDetalhesProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'warning'
      case 'FECHADA':
        return 'success'
      case 'CANCELADA':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'Aberta'
      case 'FECHADA':
        return 'Fechada'
      case 'CANCELADA':
        return 'Cancelada'
      default:
        return status
    }
  }

  // Cálculos da comanda
  const subtotal = comanda.itens?.reduce((acc, item) => {
    return acc + (item.preco_total_item || 0)
  }, 0) || 0

  const valorDesconto = comanda.valor_desconto || 0
  const total = subtotal - valorDesconto

  const handleFinalizarComanda = () => {
    setPaymentDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false)
    onFinishComanda(comanda)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Comanda #{comanda.id}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Informações da Comanda */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Informações da Comanda</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Cliente:</strong> {comanda.cliente?.nome || 'Cliente Avulso'}
                </Typography>
                <Typography variant="body2">
                  <strong>Profissional:</strong> Profissional Responsável
                </Typography>
                <Typography variant="body2">
                  <strong>Data de Abertura:</strong> {formatDateTime(comanda.criado_em)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2"><strong>Status:</strong></Typography>
                  <Chip
                    label={getStatusLabel(comanda.status)}
                    color={getStatusColor(comanda.status) as 'warning' | 'success' | 'error' | 'default'}
                    size="small"
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Resumo Financeiro</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Desconto:</Typography>
                  <Typography variant="body2" color="error.main">
                    -{formatCurrency(valorDesconto)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(total)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabela de Itens */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Itens da Comanda</Typography>
            {comanda.status === 'ABERTA' && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
              >
                Adicionar Item
              </Button>
            )}
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Tipo</TableCell>
                  <TableCell align="center">Quantidade</TableCell>
                  <TableCell align="center">Preço Unit.</TableCell>
                  <TableCell align="center">Preço Total</TableCell>
                  {comanda.status === 'ABERTA' && (
                    <TableCell align="center">Ações</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {comanda.itens?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {item.servico?.nome || item.produto?.nome || 'Item não identificado'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={item.servico ? 'Serviço' : 'Produto'} 
                        size="small"
                        color={item.servico ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{item.quantidade}</TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.preco_unitario_registrado)}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.preco_total_item || 0)}
                    </TableCell>
                    {comanda.status === 'ABERTA' && (
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => {
                            // Implementar remoção de item
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(!comanda.itens || comanda.itens.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhum item adicionado à comanda
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        {comanda.status === 'ABERTA' && (
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={handleFinalizarComanda}
            color="success"
            disabled={!comanda.itens || comanda.itens.length === 0}
          >
            Finalizar Comanda
          </Button>
        )}
      </DialogActions>

      {/* Dialog de Pagamento - simulado */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Finalizar Pagamento</DialogTitle>
        <DialogContent>
          <Typography>Total a pagar: {formatCurrency(total)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handlePaymentSuccess} variant="contained">
            Confirmar Pagamento
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
} 