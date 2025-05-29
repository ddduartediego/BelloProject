'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Fab,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  ContentCut as ServiceIcon,
  Inventory as ProductIcon,
  Payment as PaymentIcon,
  Discount as DiscountIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { ComandaComDetalhes, Servico, Produto, ItemComanda } from '@/types/database'

interface ComandaDetalhesProps {
  comanda: ComandaComDetalhes
  onAddItem: (item: Partial<ItemComanda>) => void
  onUpdateItem: (itemId: string, item: Partial<ItemComanda>) => void
  onDeleteItem: (itemId: string) => void
  onApplyDiscount: (desconto: number) => void
  onFinishComanda: () => void
  onUpdateComanda: (comanda: Partial<ComandaComDetalhes>) => void
  onClose?: () => void
}

// Dados simulados para demonstração
const servicosData: Servico[] = [
  {
    id: '1',
    id_empresa: 'empresa-1',
    nome: 'Corte Feminino',
    descricao: 'Corte moderno e estiloso',
    duracao_estimada_minutos: 60,
    preco: 80.00,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    id_empresa: 'empresa-1',
    nome: 'Coloração Completa',
    descricao: 'Coloração com produtos premium',
    duracao_estimada_minutos: 180,
    preco: 350.00,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    id_empresa: 'empresa-1',
    nome: 'Manicure e Pedicure',
    descricao: 'Cuidados completos para mãos e pés',
    duracao_estimada_minutos: 90,
    preco: 45.00,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-01-01T00:00:00Z',
  },
]

const produtosData: Produto[] = [
  {
    id: '1',
    id_empresa: 'empresa-1',
    nome: 'Shampoo Premium',
    descricao: 'Shampoo hidratante 300ml',
    preco_custo: 15.00,
    preco_venda: 35.00,
    estoque_atual: 25,
    estoque_minimo: 5,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    id_empresa: 'empresa-1',
    nome: 'Condicionador Nutritivo',
    descricao: 'Condicionador para cabelos ressecados',
    preco_custo: 18.00,
    preco_venda: 42.00,
    estoque_atual: 15,
    estoque_minimo: 3,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    id_empresa: 'empresa-1',
    nome: 'Esmalte Gel',
    descricao: 'Esmalte em gel com longa duração',
    preco_custo: 8.00,
    preco_venda: 20.00,
    estoque_atual: 50,
    estoque_minimo: 10,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-01-01T00:00:00Z',
  },
]

const profissionaisData = {
  '1': { nome: 'Ana Carolina' },
  '2': { nome: 'Roberto Silva' },
  '3': { nome: 'Carla Santos' },
}

const clientesData = {
  '1': { nome: 'Maria Silva Santos' },
  '2': { nome: 'João Silva' },
  '3': { nome: 'Amanda Costa' },
}

export default function ComandaDetalhes({
  comanda,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onApplyDiscount,
  onFinishComanda,
  onUpdateComanda,
  onClose
}: ComandaDetalhesProps) {
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'servico' | 'produto'>('servico')
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [executante, setExecutante] = useState('')
  const [desconto, setDesconto] = useState(0)

  // Cálculos da comanda
  const subtotalServicos = comanda.valor_total_servicos
  const subtotalProdutos = comanda.valor_total_produtos
  const subtotal = subtotalServicos + subtotalProdutos
  const valorDesconto = comanda.valor_desconto
  const total = subtotal - valorDesconto

  const handleAddItem = () => {
    if (!selectedItem) return

    const isServico = selectedType === 'servico'
    const itemData = isServico 
      ? servicosData.find(s => s.id === selectedItem)
      : produtosData.find(p => p.id === selectedItem)

    if (!itemData) return

    const novoItem: Partial<ItemComanda> = {
      id_comanda: comanda.id,
      [isServico ? 'id_servico' : 'id_produto']: selectedItem,
      quantidade: quantity,
      preco_unitario_registrado: isServico ? (itemData as Servico).preco : (itemData as Produto).preco_venda,
      preco_total_item: (isServico ? (itemData as Servico).preco : (itemData as Produto).preco_venda) * quantity,
      id_profissional_executante: isServico ? executante || undefined : undefined,
    }

    onAddItem(novoItem)
    
    // Reset form
    setSelectedItem('')
    setQuantity(1)
    setExecutante('')
    setAddItemOpen(false)
  }

  const handleApplyDiscount = () => {
    onApplyDiscount(desconto)
    setDesconto(0)
    setDiscountOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'success'
      case 'FECHADA':
        return 'info'
      case 'CANCELADA':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
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

  return (
    <Box>
      {/* Header da Comanda */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Comanda #{comanda.id?.slice(-8).toUpperCase()}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Cliente: {comanda.cliente?.nome || comanda.nome_cliente_avulso || 'Cliente não informado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Profissional: {profissionaisData[comanda.id_profissional_responsavel as keyof typeof profissionaisData]?.nome || 'Profissional não informado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aberta em: {new Date(comanda.data_abertura).toLocaleString('pt-BR')}
            </Typography>
          </Box>
          <Chip
            label={getStatusText(comanda.status)}
            color={getStatusColor(comanda.status) as any}
          />
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Paper>

      {/* Itens da Comanda */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Itens da Comanda
            </Typography>
            {comanda.status === 'ABERTA' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddItemOpen(true)}
              >
                Adicionar Item
              </Button>
            )}
          </Box>
        </Box>

        {comanda.itens && comanda.itens.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center">Qtd</TableCell>
                  <TableCell align="right">Preço Unit.</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Executante</TableCell>
                  {comanda.status === 'ABERTA' && <TableCell align="center">Ações</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {comanda.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {item.servico?.nome || item.produto?.nome}
                      </Typography>
                      {(item.servico?.descricao || item.produto?.descricao) && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.servico?.descricao || item.produto?.descricao}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={item.servico ? <ServiceIcon /> : <ProductIcon />}
                        label={item.servico ? 'Serviço' : 'Produto'}
                        size="small"
                        color={item.servico ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{item.quantidade}</TableCell>
                    <TableCell align="right">
                      R$ {item.preco_unitario_registrado.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        R$ {item.preco_total_item.toFixed(2).replace('.', ',')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      Ana Carolina
                    </TableCell>
                    {comanda.status === 'ABERTA' && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <ReceiptIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Nenhum item adicionado
            </Typography>
            <Typography variant="body2">
              Adicione serviços ou produtos à comanda.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Totais */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Resumo da Comanda
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Subtotal Serviços:</Typography>
            <Typography>R$ {subtotalServicos.toFixed(2).replace('.', ',')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>Subtotal Produtos:</Typography>
            <Typography>R$ {subtotalProdutos.toFixed(2).replace('.', ',')}</Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight="medium">Subtotal:</Typography>
            <Typography variant="body1" fontWeight="medium">
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </Typography>
          </Box>
          {valorDesconto > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
              <Typography>Desconto:</Typography>
              <Typography>- R$ {valorDesconto.toFixed(2).replace('.', ',')}</Typography>
            </Box>
          )}
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Total:</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              R$ {total.toFixed(2).replace('.', ',')}
            </Typography>
          </Box>
        </Stack>

        {comanda.status === 'ABERTA' && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<DiscountIcon />}
              onClick={() => setDiscountOpen(true)}
            >
              Aplicar Desconto
            </Button>
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={onFinishComanda}
              color="success"
              disabled={!comanda.itens || comanda.itens.length === 0}
            >
              Finalizar Comanda
            </Button>
          </Box>
        )}
      </Paper>

      {/* Dialog Adicionar Item */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              Adicionar Item
            </Typography>
            <IconButton onClick={() => setAddItemOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                label="Tipo de Item"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'servico' | 'produto')
                  setSelectedItem('')
                }}
                fullWidth
              >
                <MenuItem value="servico">Serviço</MenuItem>
                <MenuItem value="produto">Produto</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                label={selectedType === 'servico' ? 'Serviço' : 'Produto'}
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                fullWidth
              >
                {selectedType === 'servico' 
                  ? servicosData.map((servico) => (
                      <MenuItem key={servico.id} value={servico.id}>
                        <Box>
                          <Typography variant="body1">{servico.nome}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            R$ {servico.preco.toFixed(2).replace('.', ',')} • {servico.duracao_estimada_minutos}min
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  : produtosData.map((produto) => (
                      <MenuItem key={produto.id} value={produto.id}>
                        <Box>
                          <Typography variant="body1">{produto.nome}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            R$ {produto.preco_venda.toFixed(2).replace('.', ',')} • Estoque: {produto.estoque_atual}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                }
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Quantidade"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>

            {selectedType === 'servico' && (
              <Grid item xs={6}>
                <TextField
                  select
                  label="Profissional Executante"
                  value={executante}
                  onChange={(e) => setExecutante(e.target.value)}
                  fullWidth
                >
                  {Object.entries(profissionaisData).map(([id, prof]) => (
                    <MenuItem key={id} value={id}>
                      {prof.nome}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddItemOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained"
            disabled={!selectedItem}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Desconto */}
      <Dialog open={discountOpen} onClose={() => setDiscountOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Aplicar Desconto</DialogTitle>
        <DialogContent>
          <TextField
            label="Valor do Desconto"
            type="number"
            value={desconto}
            onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: subtotal, step: 0.01 }}
            helperText={`Máximo: R$ ${subtotal.toFixed(2).replace('.', ',')}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountOpen(false)}>Cancelar</Button>
          <Button onClick={handleApplyDiscount} variant="contained">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 