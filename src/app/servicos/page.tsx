'use client'

import React, { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCut as ServiceIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import ServicoForm from '@/components/servicos/ServicoForm'
import ServicosList from '@/components/servicos/ServicosList'
import ConfirmDeleteDialog from '@/components/servicos/ConfirmDeleteDialog'
import { Servico } from '@/types/database'
import { servicosService } from '@/services'

export default function ServicosPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
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

  // Função para refresh da lista
  const refreshList = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // Função para abrir formulário de novo serviço
  const handleNovoServico = () => {
    setSelectedServico(null)
    setFormOpen(true)
  }

  // Função para abrir formulário de edição
  const handleEditServico = (servico: Servico) => {
    setSelectedServico(servico)
    setFormOpen(true)
  }

  // Função para abrir dialog de exclusão
  const handleDeleteServico = (servico: Servico) => {
    setSelectedServico(servico)
    setDeleteDialogOpen(true)
  }

  // Função para salvar serviço (criar ou editar)
  const handleSaveServico = async (servicoData: {
    nome: string
    descricao?: string
    duracao_estimada_minutos: number
    preco: number
  }) => {
    setLoading(true)
    
    try {
      let response
      
      if (selectedServico) {
        // Editar serviço existente
        response = await servicosService.update({
          id: selectedServico.id,
          ...servicoData
        })
      } else {
        // Criar novo serviço
        response = await servicosService.create(servicoData)
      }
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      const action = selectedServico ? 'atualizado' : 'cadastrado'
      showSnackbar(`Serviço ${servicoData.nome} foi ${action} com sucesso!`)
      
      setFormOpen(false)
      setSelectedServico(null)
      refreshList()
      
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado'
      showSnackbar(`Erro ao salvar serviço: ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!selectedServico) return
    
    setLoading(true)
    
    try {
      const response = await servicosService.delete(selectedServico.id)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      showSnackbar(`Serviço ${selectedServico.nome} foi excluído com sucesso!`)
      setDeleteDialogOpen(false)
      setSelectedServico(null)
      refreshList()
      
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado'
      showSnackbar(`Erro ao excluir serviço: ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para fechar formulário
  const handleCloseForm = () => {
    setFormOpen(false)
    setSelectedServico(null)
  }

  // Função para fechar dialog de exclusão
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedServico(null)
  }

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
                Gestão de Serviços
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie o catálogo de serviços do seu salão
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoServico}
            size="large"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
            }}
          >
            Novo Serviço
          </Button>
        </Box>

        {/* Lista de serviços */}
        <ServicosList
          onEdit={handleEditServico}
          onDelete={handleDeleteServico}
          refreshKey={refreshKey}
        />

        {/* Formulário de serviço */}
        <ServicoForm
          open={formOpen}
          onClose={handleCloseForm}
          onSave={handleSaveServico}
          servico={selectedServico || undefined}
          loading={loading}
        />

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          servico={selectedServico}
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