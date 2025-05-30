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
  Person as PersonIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import ProfissionalForm from '@/components/profissionais/ProfissionalForm'
import ProfissionaisList from '@/components/profissionais/ProfissionaisList'
import ConfirmDeleteDialog from '@/components/profissionais/ConfirmDeleteDialog'
import { ProfissionalComUsuario } from '@/services/profissionais.service'
import { profissionaisService } from '@/services'
import { usuariosService } from '@/services'

export default function ProfissionaisPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfissional, setSelectedProfissional] = useState<ProfissionalComUsuario | null>(null)
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

  // Função para abrir formulário de novo profissional
  const handleNovoProfissional = () => {
    setSelectedProfissional(null)
    setFormOpen(true)
  }

  // Função para abrir formulário de edição
  const handleEditProfissional = (profissional: ProfissionalComUsuario) => {
    setSelectedProfissional(profissional)
    setFormOpen(true)
  }

  // Função para abrir dialog de exclusão
  const handleDeleteProfissional = (profissional: ProfissionalComUsuario) => {
    setSelectedProfissional(profissional)
    setDeleteDialogOpen(true)
  }

  // Função para salvar profissional (criar ou editar)
  const handleSaveProfissional = async (profissionalData: {
    nome: string
    telefone: string
    email: string
    especialidades: string[]
    horarios_trabalho?: Record<string, string[]>
  }) => {
    setLoading(true)
    
    try {
      let response
      
      if (selectedProfissional) {
        // Editar profissional existente
        response = await profissionaisService.update({
          id: selectedProfissional.id,
          especialidades: profissionalData.especialidades,
          horarios_trabalho: profissionalData.horarios_trabalho,
        })
      } else {
        // Criar novo profissional
        // Primeiro, criar o usuário
        const userResponse = await usuariosService.create({
          email: profissionalData.email,
          nome_completo: profissionalData.nome,
          tipo_usuario: 'PROFISSIONAL'
        })
        
        if (userResponse.error) {
          throw new Error(`Erro ao criar usuário: ${userResponse.error}`)
        }
        
        if (!userResponse.data) {
          throw new Error('Erro inesperado: usuário não foi criado')
        }
        
        // Depois, criar o profissional usando o ID do usuário criado
        response = await profissionaisService.create({
          id_usuario: userResponse.data.id,
          especialidades: profissionalData.especialidades,
          horarios_trabalho: profissionalData.horarios_trabalho,
        })
      }
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      const action = selectedProfissional ? 'atualizado' : 'cadastrado'
      showSnackbar(`Profissional ${profissionalData.nome} foi ${action} com sucesso!`)
      
      setFormOpen(false)
      setSelectedProfissional(null)
      refreshList()
      
    } catch (error) {
      console.error('Erro ao salvar profissional:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado'
      showSnackbar(`Erro ao salvar profissional: ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!selectedProfissional) return
    
    setLoading(true)
    
    try {
      const response = await profissionaisService.delete(selectedProfissional.id)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      showSnackbar(`Profissional ${selectedProfissional.usuario.nome_completo} foi excluído com sucesso!`)
      setDeleteDialogOpen(false)
      setSelectedProfissional(null)
      refreshList()
      
    } catch (error) {
      console.error('Erro ao excluir profissional:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado'
      showSnackbar(`Erro ao excluir profissional: ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para fechar formulário
  const handleCloseForm = () => {
    setFormOpen(false)
    setSelectedProfissional(null)
  }

  // Função para fechar dialog de exclusão
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedProfissional(null)
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
            <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Gestão de Profissionais
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie sua equipe de profissionais e especialidades
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoProfissional}
            size="large"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
            }}
          >
            Novo Profissional
          </Button>
        </Box>

        {/* Lista de profissionais */}
        <ProfissionaisList
          onEdit={handleEditProfissional}
          onDelete={handleDeleteProfissional}
          refreshKey={refreshKey}
        />

        {/* Formulário de profissional */}
        <ProfissionalForm
          open={formOpen}
          onClose={handleCloseForm}
          onSave={handleSaveProfissional}
          profissional={selectedProfissional || undefined}
          loading={loading}
        />

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          profissional={selectedProfissional}
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