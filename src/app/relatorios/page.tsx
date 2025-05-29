'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  useMediaQuery,
  useTheme,
  Paper,
  Stack,
  Chip,
  Divider,
} from '@mui/material'
import {
  Assessment as RelatorioIcon,
  TrendingUp as VendasIcon,
  People as ProfissionaisIcon,
  Inventory as ProdutosIcon,
  AccountBalance as CaixaIcon,
  PictureAsPdf as PdfIcon,
  DateRange as DateIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import RelatorioVendas from '@/components/relatorios/RelatorioVendas'
import RelatorioProfissionais from '@/components/relatorios/RelatorioProfissionais'
import RelatorioProdutos from '@/components/relatorios/RelatorioProdutos'
import RelatorioCaixa from '@/components/relatorios/RelatorioCaixa'
import FiltrosRelatorio from '@/components/relatorios/FiltrosRelatorio'

export type PeriodoRelatorio = 'hoje' | 'ontem' | 'ultimos7dias' | 'ultimos30dias' | 'personalizado'

export interface FiltrosData {
  periodo: PeriodoRelatorio
  dataInicio?: Date
  dataFim?: Date
  profissional?: string
  servicos?: string[]
}

export default function RelatoriosPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [relatorioAtivo, setRelatorioAtivo] = useState<'vendas' | 'profissionais' | 'produtos' | 'caixa'>('vendas')
  const [filtros, setFiltros] = useState<FiltrosData>({
    periodo: 'ultimos30dias'
  })

  // Dados simulados para demonstração
  const resumoMetricas = {
    totalVendas: 15750.00,
    totalComandas: 127,
    ticketMedio: 124.02,
    crescimentoMensal: 12.5,
    profissionalDestaque: 'Ana Carolina',
    servicoMaisVendido: 'Corte Feminino',
    produtoMaisVendido: 'Shampoo Premium',
    saldoCaixa: 2850.75,
  }

  const handleFiltrosChange = (novosFiltros: FiltrosData) => {
    setFiltros(novosFiltros)
  }

  const handleExportarPDF = () => {
    // Implementar exportação em PDF
    console.log('Exportando relatório em PDF...')
  }

  const getDescricaoPeriodo = () => {
    switch (filtros.periodo) {
      case 'hoje':
        return 'Hoje'
      case 'ontem':
        return 'Ontem'
      case 'ultimos7dias':
        return 'Últimos 7 dias'
      case 'ultimos30dias':
        return 'Últimos 30 dias'
      case 'personalizado':
        if (filtros.dataInicio && filtros.dataFim) {
          return `${filtros.dataInicio.toLocaleDateString('pt-BR')} a ${filtros.dataFim.toLocaleDateString('pt-BR')}`
        }
        return 'Período personalizado'
      default:
        return 'Últimos 30 dias'
    }
  }

  const tabs = [
    { 
      id: 'vendas' as const, 
      label: 'Vendas', 
      icon: <VendasIcon />, 
      description: 'Receitas e performance de vendas' 
    },
    { 
      id: 'profissionais' as const, 
      label: 'Profissionais', 
      icon: <ProfissionaisIcon />, 
      description: 'Performance individual dos profissionais' 
    },
    { 
      id: 'produtos' as const, 
      label: 'Produtos', 
      icon: <ProdutosIcon />, 
      description: 'Análise de produtos e estoque' 
    },
    { 
      id: 'caixa' as const, 
      label: 'Caixa', 
      icon: <CaixaIcon />, 
      description: 'Movimentações financeiras' 
    },
  ]

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header da página */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <RelatorioIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Relatórios
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Análises e insights sobre o desempenho do salão
              </Typography>
            </Box>
          </Box>

          {/* Botão de exportar */}
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleExportarPDF}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Exportar PDF
          </Button>
        </Box>

        {/* Filtros */}
        <FiltrosRelatorio
          filtros={filtros}
          onChange={handleFiltrosChange}
        />

        {/* Resumo de Métricas */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Resumo Geral
            </Typography>
            <Chip
              icon={<DateIcon />}
              label={getDescricaoPeriodo()}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <MoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  R$ {resumoMetricas.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Vendas
                </Typography>
                <Chip
                  label={`+${resumoMetricas.crescimentoMensal}%`}
                  size="small"
                  color="success"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <VendasIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {resumoMetricas.totalComandas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comandas Finalizadas
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Ticket Médio: R$ {resumoMetricas.ticketMedio.toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <ProfissionaisIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {resumoMetricas.profissionalDestaque}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Profissional Destaque
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Maior faturamento
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <ProdutosIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {resumoMetricas.servicoMaisVendido}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serviço Mais Vendido
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  35 vendas no período
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Navegação por Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            spacing={0}
            divider={<Divider orientation={isMobile ? 'horizontal' : 'vertical'} flexItem />}
          >
            {tabs.map((tab) => (
              <Box
                key={tab.id}
                sx={{
                  flex: 1,
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: relatorioAtivo === tab.id ? 'primary.50' : 'transparent',
                  borderBottom: relatorioAtivo === tab.id ? 2 : 0,
                  borderColor: 'primary.main',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: relatorioAtivo === tab.id ? 'primary.50' : 'grey.50',
                  },
                }}
                onClick={() => setRelatorioAtivo(tab.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {React.cloneElement(tab.icon, { 
                    color: relatorioAtivo === tab.id ? 'primary' : 'action' 
                  })}
                  <Typography 
                    variant="h6" 
                    fontWeight={relatorioAtivo === tab.id ? 'bold' : 'medium'}
                    color={relatorioAtivo === tab.id ? 'primary.main' : 'text.primary'}
                  >
                    {tab.label}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {tab.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Conteúdo do Relatório Ativo */}
        <Box>
          {relatorioAtivo === 'vendas' && (
            <RelatorioVendas filtros={filtros} />
          )}
          {relatorioAtivo === 'profissionais' && (
            <RelatorioProfissionais filtros={filtros} />
          )}
          {relatorioAtivo === 'produtos' && (
            <RelatorioProdutos filtros={filtros} />
          )}
          {relatorioAtivo === 'caixa' && (
            <RelatorioCaixa filtros={filtros} />
          )}
        </Box>
      </Container>
    </Layout>
  )
} 