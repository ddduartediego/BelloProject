'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um CustomThemeProvider')
  }
  return context
}

interface CustomThemeProviderProps {
  children: ReactNode
}

export const CustomThemeProvider = ({ children }: CustomThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>('light')

  // Carregar tema do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('bello-theme') as ThemeMode
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setMode(savedTheme)
    } else {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setMode(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Salvar tema no localStorage
  useEffect(() => {
    localStorage.setItem('bello-theme', mode)
  }, [mode])

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode)
  }

  // Tema customizado para o Bello
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#8B5CF6' : '#A78BFA',
        light: mode === 'light' ? '#A78BFA' : '#C4B5FD',
        dark: mode === 'light' ? '#7C3AED' : '#8B5CF6',
      },
      secondary: {
        main: mode === 'light' ? '#F59E0B' : '#FDE047',
        light: mode === 'light' ? '#FDE047' : '#FEF08A',
        dark: mode === 'light' ? '#D97706' : '#EAB308',
      },
      success: {
        main: mode === 'light' ? '#059669' : '#34D399',
        light: mode === 'light' ? '#34D399' : '#6EE7B7',
        dark: mode === 'light' ? '#047857' : '#10B981',
      },
      error: {
        main: mode === 'light' ? '#DC2626' : '#F87171',
        light: mode === 'light' ? '#F87171' : '#FCA5A5',
        dark: mode === 'light' ? '#B91C1C' : '#EF4444',
      },
      warning: {
        main: mode === 'light' ? '#D97706' : '#FBBF24',
        light: mode === 'light' ? '#FBBF24' : '#FDE68A',
        dark: mode === 'light' ? '#B45309' : '#F59E0B',
      },
      info: {
        main: mode === 'light' ? '#0EA5E9' : '#60A5FA',
        light: mode === 'light' ? '#60A5FA' : '#93C5FD',
        dark: mode === 'light' ? '#0284C7' : '#3B82F6',
      },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0F172A',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: mode === 'light' ? '#1E293B' : '#F1F5F9',
        secondary: mode === 'light' ? '#64748B' : '#94A3B8',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: mode === 'light' 
              ? '1px solid rgba(0, 0, 0, 0.05)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: mode === 'light' 
              ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
              : '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'light' 
                ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
                : '0 4px 6px rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: mode === 'light' 
              ? '1px solid rgba(0, 0, 0, 0.05)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
    },
  })

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

export default CustomThemeProvider 