'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Divider,
  Stack,
  Alert,
} from '@mui/material'
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as PixIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { MetodoPagamento } from '@/types/database'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (metodo: MetodoPagamento, valorPago: number) => void
  total: number
  loading?: boolean
}

export default function PaymentDialog({
  open,
  onClose,
  onConfirm,
  total,
  loading = false
}: PaymentDialogProps) {
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('DINHEIRO')
  const [valorPago, setValorPago] = useState(total)
  const [erro, setErro] = useState('')

  // Calcular troco (apenas para dinheiro)
  const troco = metodoPagamento === 'DINHEIRO' && valorPago > total ? valorPago - total : 0

  const handleConfirm = () => {
    setErro('')

    // Validações
    if (valorPago <= 0) {
      setErro('Valor pago deve ser maior que zero')
      return
    }

    if (metodoPagamento === 'DINHEIRO' && valorPago < total) {
      setErro('Valor pago não pode ser menor que o total para pagamento em dinheiro')
      return
    }

    if (['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'].includes(metodoPagamento) && valorPago !== total) {
      setErro('Para cartão/PIX o valor deve ser exato')
      return
    }

    onConfirm(metodoPagamento, valorPago)
  }

  const handleClose = () => {
    setErro('')
    setValorPago(total)
    setMetodoPagamento('DINHEIRO')
    onClose()
  }

  React.useEffect(() => {
    if (open) {
      setValorPago(total)
    }
  }, [open, total])

  React.useEffect(() => {
    if (['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'].includes(metodoPagamento)) {
      setValorPago(total)
    }
  }, [metodoPagamento, total])

  const getPaymentIcon = (metodo: MetodoPagamento) => {
    switch (metodo) {
      case 'DINHEIRO':
        return <MoneyIcon />
      case 'CARTAO_CREDITO':
      case 'CARTAO_DEBITO':
        return <CreditCardIcon />
      case 'PIX':
        return <PixIcon />
      default:
        return <PaymentIcon />
    }
  }

  const getPaymentLabel = (metodo: MetodoPagamento) => {
    switch (metodo) {
      case 'DINHEIRO':
        return 'Dinheiro'
      case 'CARTAO_CREDITO':
        return 'Cartão de Crédito'
      case 'CARTAO_DEBITO':
        return 'Cartão de Débito'
      case 'PIX':
        return 'PIX'
      case 'OUTRO':
        return 'Outro'
      default:
        return metodo
    }
  }

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
            <PaymentIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Finalizar Pagamento
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {erro && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        )}

        {/* Resumo do Total */}
        <Box sx={{ 
          p: 3, 
          bgcolor: 'primary.50', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.200',
          mb: 3
        }}>
          <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center">
            Total a Pagar: R$ {total.toFixed(2).replace('.', ',')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Método de Pagamento */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                Método de Pagamento *
              </FormLabel>
              <RadioGroup
                value={metodoPagamento}
                onChange={(e) => setMetodoPagamento(e.target.value as MetodoPagamento)}
              >
                <FormControlLabel 
                  value="DINHEIRO" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon />
                      <Typography>Dinheiro</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="CARTAO_DEBITO" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon />
                      <Typography>Cartão de Débito</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="CARTAO_CREDITO" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon />
                      <Typography>Cartão de Crédito</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="PIX" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PixIcon />
                      <Typography>PIX</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="OUTRO" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon />
                      <Typography>Outro</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Valor Pago */}
          <Grid item xs={12}>
            <TextField
              label="Valor Pago"
              type="number"
              value={valorPago}
              onChange={(e) => setValorPago(Math.max(0, parseFloat(e.target.value) || 0))}
              fullWidth
              inputProps={{ 
                min: 0, 
                step: 0.01,
                readOnly: ['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'].includes(metodoPagamento)
              }}
              helperText={
                metodoPagamento === 'DINHEIRO' 
                  ? 'Para dinheiro, pode ser valor maior que o total'
                  : 'Para cartão/PIX deve ser o valor exato'
              }
            />
          </Grid>

          {/* Troco (apenas para dinheiro) */}
          {metodoPagamento === 'DINHEIRO' && troco > 0 && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'success.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.200'
              }}>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  Troco: R$ {troco.toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Resumo Final */}
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Método:</Typography>
            <Typography fontWeight="bold">
              {getPaymentLabel(metodoPagamento)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Total:</Typography>
            <Typography fontWeight="bold">
              R$ {total.toFixed(2).replace('.', ',')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Valor Pago:</Typography>
            <Typography fontWeight="bold" color="primary">
              R$ {valorPago.toFixed(2).replace('.', ',')}
            </Typography>
          </Box>
          {troco > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Troco:</Typography>
              <Typography fontWeight="bold" color="success.main">
                R$ {troco.toFixed(2).replace('.', ',')}
              </Typography>
            </Box>
          )}
        </Stack>
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
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
          startIcon={getPaymentIcon(metodoPagamento)}
          sx={{ minWidth: 140 }}
          color="success"
        >
          {loading ? 'Processando...' : 'Confirmar Pagamento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 