'use client'

import React from 'react'
import {
  IconButton,
  Tooltip,
  Box,
  useTheme as useMuiTheme,
  alpha
} from '@mui/material'
import {
  LightMode,
  DarkMode,
  Brightness4
} from '@mui/icons-material'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'icon' | 'fab' | 'text'
  position?: 'static' | 'fixed'
  showLabel?: boolean
}

export default function ThemeToggle({
  size = 'medium',
  variant = 'icon',
  position = 'static',
  showLabel = false
}: ThemeToggleProps) {
  const { mode, toggleTheme } = useTheme()
  const muiTheme = useMuiTheme()

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <DarkMode fontSize={size} />
      case 'dark':
        return <LightMode fontSize={size} />
      default:
        return <Brightness4 fontSize={size} />
    }
  }

  const getTooltipText = () => {
    return mode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'
  }

  if (variant === 'fab') {
    return (
      <Box
        sx={{
          position: position === 'fixed' ? 'fixed' : 'relative',
          bottom: position === 'fixed' ? 24 : 'auto',
          right: position === 'fixed' ? 24 : 'auto',
          zIndex: position === 'fixed' ? 1000 : 'auto'
        }}
      >
        <Tooltip title={getTooltipText()}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              width: 56,
              height: 56,
              backgroundColor: muiTheme.palette.primary.main,
              color: muiTheme.palette.primary.contrastText,
              boxShadow: muiTheme.shadows[6],
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: muiTheme.palette.primary.dark,
                transform: 'scale(1.1)',
                boxShadow: muiTheme.shadows[12],
              },
              '& .MuiSvgIcon-root': {
                transition: 'transform 0.3s ease',
              },
              '&:hover .MuiSvgIcon-root': {
                transform: 'rotate(180deg)',
              },
            }}
          >
            {getIcon()}
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  if (variant === 'text') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: 1,
          borderRadius: 2,
          backgroundColor: alpha(muiTheme.palette.primary.main, 0.1),
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: alpha(muiTheme.palette.primary.main, 0.2),
          },
        }}
        onClick={toggleTheme}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'rotate(180deg)',
            },
          }}
        >
          {getIcon()}
        </Box>
        {showLabel && (
          <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {mode === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          </Box>
        )}
      </Box>
    )
  }

  // Default icon variant
  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        onClick={toggleTheme}
        size={size}
        sx={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiSvgIcon-root': {
            transition: 'transform 0.3s ease',
          },
          '&:hover': {
            backgroundColor: alpha(muiTheme.palette.primary.main, 0.1),
            transform: 'scale(1.1)',
          },
          '&:hover .MuiSvgIcon-root': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  )
} 