'use client'

import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { ContentCut as ScissorsIcon } from '@mui/icons-material'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingScreen({ 
  message = 'Carregando...', 
  fullScreen = true 
}: LoadingScreenProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullScreen ? '100vh' : '200px',
        gap: 2,
      }}
    >
      {/* Logo animado */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: 'primary.main',
            position: 'absolute',
            top: -10,
            left: -10,
          }} 
        />
        <ScissorsIcon 
          color="primary" 
          sx={{ 
            fontSize: 40,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
              },
              '50%': {
                transform: 'scale(1.1)',
              },
              '100%': {
                transform: 'scale(1)',
              },
            },
          }} 
        />
      </Box>
      
      <Typography variant="body1" color="text.secondary" textAlign="center">
        {message}
      </Typography>
      
      <Typography variant="caption" color="text.secondary" textAlign="center">
        Bello System
      </Typography>
    </Box>
  )
} 