'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Skeleton,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCut as ServiceIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { Servico } from '@/types/database'
import { servicosService } from '@/services'

interface ServicosListProps {
  onEdit: (servico: Servico) => void
  onDelete: (servico: Servico) => void
  refreshKey?: number
}

export default function ServicosList({ onEdit, onDelete, refreshKey }: ServicosListProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalServicos, setTotalServicos] = useState(0)
  const [itemsPerPage] = useState(12)
  const [orderBy, setOrderBy] = useState('nome')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Buscar serviços
  const fetchServicos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = debouncedSearchTerm ? { nome: debouncedSearchTerm } : {}
      const pagination = { page: currentPage, limit: itemsPerPage }

      const response = await servicosService.getAll(pagination, filters, orderBy)

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        setServicos(response.data.data)
        setTotalPages(response.data.totalPages)
        setTotalServicos(response.data.total)
      }
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
      setError(`Erro ao carregar serviços: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, orderBy])

  // Carregar serviços na inicialização e quando dependências mudarem
  useEffect(() => {
    fetchServicos()
  }, [fetchServicos])

  // Refresh quando refreshKey mudar
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchServicos()
    }
  }, [refreshKey, fetchServicos])

  // Reset para primeira página quando busca mudar
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm, searchTerm])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const handleOrderByChange = (event: SelectChangeEvent<string>) => {
    setOrderBy(event.target.value)
    setCurrentPage(1)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, servico: Servico) => {
    setAnchorEl(event.currentTarget)
    setSelectedServico(servico)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedServico(null)
  }

  const handleEdit = () => {
    if (selectedServico) {
      onEdit(selectedServico)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedServico) {
      onDelete(selectedServico)
    }
    handleMenuClose()
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

  const getServiceColor = (nome: string) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#00796b', '#5d4037', '#455a64',
      '#0288d1', '#689f38', '#fbc02d', '#e64a19'
    ]
    const hash = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Card>
      <CardContent>
        {/* Header com controles de busca e filtros */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Catálogo de Serviços
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={fetchServicos} 
                disabled={loading}
                title="Atualizar lista"
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Total: {totalServicos} serviço{totalServicos !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Pesquisar por nome ou descrição..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={orderBy}
                  label="Ordenar por"
                  onChange={handleOrderByChange}
                >
                  <MenuItem value="nome">Nome</MenuItem>
                  <MenuItem value="preco">Preço</MenuItem>
                  <MenuItem value="duracao_estimada_minutos">Duração</MenuItem>
                  <MenuItem value="criado_em">Data de Cadastro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Mensagem de erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading skeleton ou conteúdo */}
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="80%" height={20} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Skeleton variant="text" width="30%" height={24} />
                      <Skeleton variant="rectangular" width={60} height={24} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : servicos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ServiceIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Tente buscar com outros termos ou limpe o filtro' 
                : 'Comece cadastrando seu primeiro serviço'
              }
            </Typography>
          </Box>
        ) : (
          <>
            {/* Grid de serviços */}
            <Grid container spacing={3}>
              {servicos.map((servico) => (
                <Grid item xs={12} sm={6} md={4} key={servico.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      position: 'relative',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {servico.nome}
                          </Typography>
                          {servico.descricao && (
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {servico.descricao.length > 100 
                                ? `${servico.descricao.substring(0, 100)}...` 
                                : servico.descricao
                              }
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, servico)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {formatCurrency(servico.preco)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Chip 
                            label={formatDuration(servico.duracao_estimada_minutos)} 
                            size="small" 
                            sx={{ 
                              bgcolor: getServiceColor(servico.nome),
                              color: 'white',
                              fontWeight: 'medium'
                            }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Paginação */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Menu de ações */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
} 