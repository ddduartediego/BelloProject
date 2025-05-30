'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { Cliente } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clientesService } from '@/services'
import { PaginatedResponse } from '@/services/base.service'

interface ClientesListProps {
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  refreshKey?: number
}

export default function ClientesList({ onEdit, onDelete, refreshKey }: ClientesListProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalClientes, setTotalClientes] = useState(0)
  const [itemsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('nome')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Buscar clientes
  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = debouncedSearchTerm ? { nome: debouncedSearchTerm } : {}
      const pagination = { page: currentPage, limit: itemsPerPage }

      const response = await clientesService.getAll(pagination, filters, orderBy)

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        setClientes(response.data.data)
        setTotalPages(response.data.totalPages)
        setTotalClientes(response.data.total)
      }
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
      setError(`Erro ao carregar clientes: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, orderBy])

  // Carregar clientes na inicialização e quando dependências mudarem
  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Refresh quando refreshKey mudar
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchClientes()
    }
  }, [refreshKey, fetchClientes])

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, cliente: Cliente) => {
    setAnchorEl(event.currentTarget)
    setSelectedCliente(cliente)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCliente(null)
  }

  const handleEdit = () => {
    if (selectedCliente) {
      onEdit(selectedCliente)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedCliente) {
      onDelete(selectedCliente)
    }
    handleMenuClose()
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  const formatPhone = (phone: string) => {
    // Formatar telefone brasileiro
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#00796b', '#5d4037', '#455a64'
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Card>
      <CardContent>
        {/* Header com controles de busca e filtros */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Lista de Clientes
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={fetchClientes} 
                disabled={loading}
                title="Atualizar lista"
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Total: {totalClientes} cliente{totalClientes !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Pesquisar por nome, telefone ou email..."
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
                  <MenuItem value="criado_em">Data de Cadastro</MenuItem>
                  <MenuItem value="data_nascimento">Data de Nascimento</MenuItem>
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
          <Box>
            {[...Array(5)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
                <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : clientes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Tente buscar com outros termos ou limpe o filtro' 
                : 'Comece cadastrando seu primeiro cliente'
              }
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tabela de clientes */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Contato</TableCell>
                    <TableCell>Aniversário</TableCell>
                    <TableCell>Cadastrado em</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(cliente.nome),
                              width: 56,
                              height: 56,
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {getInitials(cliente.nome)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {cliente.nome}
                            </Typography>
                            {cliente.observacoes && (
                              <Typography variant="caption" color="text.secondary">
                                {cliente.observacoes.length > 50 
                                  ? `${cliente.observacoes.substring(0, 50)}...` 
                                  : cliente.observacoes
                                }
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {formatPhone(cliente.telefone)}
                            </Typography>
                          </Box>
                          {cliente.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {cliente.email}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {cliente.data_nascimento ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CakeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {formatDate(cliente.data_nascimento)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(cliente.criado_em)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, cliente)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginação */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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