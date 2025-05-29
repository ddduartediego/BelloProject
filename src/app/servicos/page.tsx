'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCut as ServiceIcon,
  Inventory as ProductIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import ServicoForm from '@/components/servicos/ServicoForm'
import ProdutoForm from '@/components/produtos/ProdutoForm'
import { Servico, Produto } from '@/types/database'

// Dados simulados para demonstração
const servicosData: Partial<Servico>[] = [
  {
    id: '1',
    nome: 'Corte Feminino',
    descricao: 'Corte personalizado para cabelos femininos com lavagem e finalização',
    duracao_estimada_minutos: 60,
    preco: 80.00,
  },
  {
    id: '2',
    nome: 'Coloração Completa',
    descricao: 'Coloração completa com produtos premium, inclui hidratação',
    duracao_estimada_minutos: 180,
    preco: 350.00,
  },
  {
    id: '3',
    nome: 'Manicure e Pedicure',
    descricao: 'Cuidados completos para unhas das mãos e pés',
    duracao_estimada_minutos: 90,
    preco: 45.00,
  },
]

const produtosData: Produto[] = [
  {
    id: '1',
    id_empresa: 'empresa-1',
    nome: 'Shampoo Profissional L\'Oréal',
    descricao: 'Shampoo profissional para todos os tipos de cabelo',
    preco_custo: 25.50,
    preco_venda: 85.00,
    estoque_atual: 12,
    estoque_minimo: 5,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-12-05T00:00:00Z',
  },
  {
    id: '2',
    id_empresa: 'empresa-1',
    nome: 'Esmalte Gel Premium',
    descricao: 'Esmalte em gel de longa duração, várias cores disponíveis',
    preco_custo: 8.00,
    preco_venda: 25.00,
    estoque_atual: 3,
    estoque_minimo: 10,
    criado_em: '2024-01-01T00:00:00Z',
    atualizado_em: '2024-12-05T00:00:00Z',
  },
]

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ServicosPage() {
  const [currentTab, setCurrentTab] = useState(0)
  const [servicoFormOpen, setServicoFormOpen] = useState(false)
  const [produtoFormOpen, setProdutoFormOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Partial<Servico> | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Partial<Produto> | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Funções para gerenciar serviços
  const handleNovoServico = () => {
    setSelectedServico(null)
    setServicoFormOpen(true)
  }

  const handleSaveServico = async (servicoData: {
    nome: string
    descricao?: string
    preco: string
    duracao_minutos: string
    categoria: string
    ativo: boolean
  }) => {
    setLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (selectedServico) {
        showSnackbar(`Serviço ${servicoData.nome} foi atualizado com sucesso!`)
      } else {
        showSnackbar(`Serviço ${servicoData.nome} foi cadastrado com sucesso!`)
      }
      
      setServicoFormOpen(false)
      setSelectedServico(null)
      
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      showSnackbar('Erro ao salvar serviço. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Funções para gerenciar produtos
  const handleNovoProduto = () => {
    setSelectedProduto(null)
    setProdutoFormOpen(true)
  }

  const handleSaveProduto = async (produtoData: {
    nome: string
    descricao?: string
    preco_custo?: string
    preco_venda: string
    estoque_atual: string
    estoque_minimo?: string
  }) => {
    setLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (selectedProduto) {
        showSnackbar(`Produto ${produtoData.nome} foi atualizado com sucesso!`)
      } else {
        showSnackbar(`Produto ${produtoData.nome} foi cadastrado com sucesso!`)
      }
      
      setProdutoFormOpen(false)
      setSelectedProduto(null)
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      showSnackbar('Erro ao salvar produto. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas
  const totalServicos = servicosData.length
  const totalProdutos = produtosData.length
  const produtosEstoqueBaixo = produtosData.filter(p => p.estoque_atual <= (p.estoque_minimo || 0)).length
  const receitaEstimadaServicos = servicosData.reduce((acc, s) => acc + (s.preco || 0), 0)

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header da página */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ServiceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Serviços e Produtos
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie seu catálogo de serviços e controle de estoque
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Cards de estatísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ServiceIcon color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {totalServicos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Serviços Cadastrados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ProductIcon color="success" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {totalProdutos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Produtos em Estoque
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon color="error" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {produtosEstoqueBaixo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estoque Baixo
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon color="info" />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      R$ {receitaEstimadaServicos.toFixed(2).replace('.', ',')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receita por Atendimento
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={(_, newValue) => setCurrentTab(newValue)}
              aria-label="tabs de serviços e produtos"
            >
              <Tab 
                label="Serviços" 
                icon={<ServiceIcon />} 
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              />
              <Tab 
                label="Produtos" 
                icon={<ProductIcon />} 
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              />
            </Tabs>
          </Box>

          {/* Tab Panel - Serviços */}
          <TabPanel value={currentTab} index={0}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Catálogo de Serviços
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNovoServico}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Novo Serviço
                </Button>
              </Box>

              <Grid container spacing={3}>
                {servicosData.map((servico) => (
                  <Grid item xs={12} md={6} lg={4} key={servico.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {servico.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {servico.descricao}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            R$ {servico.preco?.toFixed(2).replace('.', ',')}
                          </Typography>
                          <Chip 
                            label={`${servico.duracao_estimada_minutos} min`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>

          {/* Tab Panel - Produtos */}
          <TabPanel value={currentTab} index={1}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Controle de Estoque
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNovoProduto}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Novo Produto
                </Button>
              </Box>

              <Grid container spacing={3}>
                {produtosData.map((produto) => (
                  <Grid item xs={12} md={6} lg={4} key={produto.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {produto.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {produto.descricao}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            R$ {produto.preco_venda.toFixed(2).replace('.', ',')}
                          </Typography>
                          <Chip 
                            label={`Estoque: ${produto.estoque_atual}`}
                            size="small" 
                            color={produto.estoque_atual <= (produto.estoque_minimo || 0) ? 'error' : 'success'}
                          />
                        </Box>
                        {produto.estoque_atual <= (produto.estoque_minimo || 0) && (
                          <Alert severity="warning">
                            Estoque baixo! Mínimo: {produto.estoque_minimo}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>
        </Paper>

        {/* Formulários */}
        <ServicoForm
          open={servicoFormOpen}
          onClose={() => setServicoFormOpen(false)}
          onSave={handleSaveServico}
          servico={selectedServico || undefined}
          loading={loading}
        />

        <ProdutoForm
          open={produtoFormOpen}
          onClose={() => setProdutoFormOpen(false)}
          onSave={handleSaveProduto}
          produto={selectedProduto || undefined}
          loading={loading}
        />

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  )
} 