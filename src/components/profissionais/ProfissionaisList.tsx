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
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { ProfissionalComUsuario } from '@/services/profissionais.service'
import { profissionaisService } from '@/services'

interface ProfissionaisListProps {
  onEdit: (profissional: ProfissionalComUsuario) => void
  onDelete: (profissional: ProfissionalComUsuario) => void
  refreshKey?: number
}

export default function ProfissionaisList({ onEdit, onDelete, refreshKey }: ProfissionaisListProps) {
  const [profissionais, setProfissionais] = useState<ProfissionalComUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalProfissionais, setTotalProfissionais] = useState(0)
  const [itemsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('criado_em')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedProfissional, setSelectedProfissional] = useState<ProfissionalComUsuario | null>(null)

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Buscar profissionais
  const fetchProfissionais = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = debouncedSearchTerm ? { especialidade: debouncedSearchTerm } : {}
      const pagination = { page: currentPage, limit: itemsPerPage }

      // Usar apenas campos válidos para ordenação no banco de dados
      let validOrderBy = orderBy
      if (orderBy === 'usuario.nome_completo') {
        validOrderBy = 'criado_em' // Fallback para um campo válido
      }

      const response = await profissionaisService.getAll(pagination, filters, validOrderBy)

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        let profissionaisData = response.data.data
        
        // Aplicar ordenação do lado do cliente para campos relacionados
        if (orderBy === 'usuario.nome_completo') {
          profissionaisData = [...profissionaisData].sort((a, b) => {
            const nomeA = a.usuario.nome_completo.toLowerCase()
            const nomeB = b.usuario.nome_completo.toLowerCase()
            return nomeA.localeCompare(nomeB)
          })
        }
        
        setProfissionais(profissionaisData)
        setTotalPages(response.data.totalPages)
        setTotalProfissionais(response.data.total)
      }
    } catch (err) {
      console.error('Erro ao buscar profissionais:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
      setError(`Erro ao carregar profissionais: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, orderBy])

  // Carregar profissionais na inicialização e quando dependências mudarem
  useEffect(() => {
    fetchProfissionais()
  }, [fetchProfissionais])

  // Refresh quando refreshKey mudar
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchProfissionais()
    }
  }, [refreshKey, fetchProfissionais])

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, profissional: ProfissionalComUsuario) => {
    setAnchorEl(event.currentTarget)
    setSelectedProfissional(profissional)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedProfissional(null)
  }

  const handleEdit = () => {
    if (selectedProfissional) {
      onEdit(selectedProfissional)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedProfissional) {
      onDelete(selectedProfissional)
    }
    handleMenuClose()
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

  const formatEspecialidades = (especialidades?: string[]) => {
    if (!especialidades || especialidades.length === 0) {
      return 'Não especificado'
    }
    return especialidades.slice(0, 3).join(', ') + (especialidades.length > 3 ? '...' : '')
  }

  const getEspecialidadeColor = (especialidade: string) => {
    const colorMap: Record<string, string> = {
      'Corte': '#1976d2',
      'Coloração': '#388e3c',
      'Manicure': '#f57c00',
      'Pedicure': '#d32f2f',
      'Depilação': '#7b1fa2',
      'Estética': '#00796b',
      'Massagem': '#5d4037',
    }
    return colorMap[especialidade] || '#455a64'
  }

  return (
    <Card>
      <CardContent>
        {/* Header com controles de busca e filtros */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Lista de Profissionais
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={fetchProfissionais} 
                disabled={loading}
                title="Atualizar lista"
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Total: {totalProfissionais} profissional{totalProfissionais !== 1 ? 'is' : ''}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Pesquisar por nome, email ou especialidade..."
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
                  <MenuItem value="usuario.nome_completo">Nome</MenuItem>
                  <MenuItem value="criado_em">Data de Cadastro</MenuItem>
                  <MenuItem value="especialidades">Especialidades</MenuItem>
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
                  <Skeleton variant="text" width="50%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : profissionais.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Tente buscar com outros termos ou limpe o filtro' 
                : 'Comece cadastrando seu primeiro profissional'
              }
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tabela de profissionais */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Profissional</TableCell>
                    <TableCell>Contato</TableCell>
                    <TableCell>Especialidades</TableCell>
                    <TableCell>Horários</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profissionais.map((profissional) => (
                    <TableRow key={profissional.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(profissional.usuario.nome_completo),
                              width: 56,
                              height: 56,
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {getInitials(profissional.usuario.nome_completo)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {profissional.usuario.nome_completo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {profissional.usuario.tipo_usuario}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {profissional.usuario.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {profissional.especialidades && profissional.especialidades.length > 0 ? (
                            profissional.especialidades.slice(0, 3).map((especialidade, index) => (
                              <Chip 
                                key={index}
                                label={especialidade}
                                size="small"
                                sx={{
                                  bgcolor: getEspecialidadeColor(especialidade),
                                  color: 'white',
                                  fontWeight: 'medium',
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Não especificado
                            </Typography>
                          )}
                          {profissional.especialidades && profissional.especialidades.length > 3 && (
                            <Chip 
                              label={`+${profissional.especialidades.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {profissional.horarios_trabalho && Object.keys(profissional.horarios_trabalho).length > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {Object.keys(profissional.horarios_trabalho).length} dia{Object.keys(profissional.horarios_trabalho).length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Não configurado
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, profissional)}
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