'use client'

import React from 'react'
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Slide,
  Grow,
  Fade,
  useTheme,
  alpha
} from '@mui/material'
import {
  Close,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material'
import { useNotifications, NotificationType } from '@/hooks/useNotifications'

interface NotificationSystemProps {
  maxNotifications?: number
  position?: {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
  autoHideDuration?: number
  variant?: 'filled' | 'outlined' | 'standard'
  showActions?: boolean
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle />
    case 'error':
      return <Error />
    case 'warning':
      return <Warning />
    case 'info':
      return <Info />
    default:
      return <Info />
  }
}

const getSeverity = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'info'
  }
}

export default function NotificationSystem({
  maxNotifications = 3,
  position = { vertical: 'top', horizontal: 'right' },
  autoHideDuration = 5000,
  variant = 'filled',
  showActions = true
}: NotificationSystemProps) {
  const { notifications, hideNotification } = useNotifications()
  const theme = useTheme()

  // Mostrar apenas as últimas notificações baseado no limite
  const visibleNotifications = notifications.slice(0, maxNotifications)

  const handleClose = (notificationId: string) => {
    hideNotification(notificationId)
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        zIndex: 9999,
        ...(position.vertical === 'top' && { top: 24 }),
        ...(position.vertical === 'bottom' && { bottom: 24 }),
        ...(position.horizontal === 'left' && { left: 24 }),
        ...(position.horizontal === 'center' && { 
          left: '50%', 
          transform: 'translateX(-50%)' 
        }),
        ...(position.horizontal === 'right' && { right: 24 }),
        display: 'flex',
        flexDirection: position.vertical === 'top' ? 'column' : 'column-reverse',
        gap: 2,
        maxWidth: 400,
      }}
    >
      {visibleNotifications.map((notification, index) => (
        <Grow
          key={notification.id}
          in
          timeout={300}
          style={{ 
            transformOrigin: position.horizontal === 'left' 
              ? 'left center' 
              : position.horizontal === 'right' 
                ? 'right center' 
                : 'center center',
            transitionDelay: `${index * 100}ms`
          }}
        >
          <Alert
            severity={getSeverity(notification.type)}
            variant={variant}
            icon={getIcon(notification.type)}
            action={
              showActions && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {notification.action && (
                    <Box
                      component="button"
                      onClick={notification.action.onClick}
                      sx={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        padding: 0,
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      {notification.action.label}
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleClose(notification.id)}
                    sx={{ 
                      color: 'inherit',
                      opacity: 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )
            }
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              border: `1px solid ${alpha(theme.palette[getSeverity(notification.type)].main, 0.3)}`,
              '& .MuiAlert-message': {
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                flex: 1,
              },
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
              animation: 'slideIn 0.3s ease-out',
              '@keyframes slideIn': {
                from: {
                  transform: position.horizontal === 'right' 
                    ? 'translateX(100%)' 
                    : position.horizontal === 'left'
                      ? 'translateX(-100%)'
                      : 'translateY(-100%)',
                  opacity: 0,
                },
                to: {
                  transform: 'translate(0)',
                  opacity: 1,
                },
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {notification.title}
            </AlertTitle>
            {notification.message && (
              <Box sx={{ fontSize: '0.875rem', opacity: 0.9 }}>
                {notification.message}
              </Box>
            )}
          </Alert>
        </Grow>
      ))}
    </Box>
  )
}

// Hook personalizado para facilitar o uso
export function useNotificationSystem() {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  } = useNotifications()

  return {
    success: (title: string, message?: string, options?: any) => 
      showSuccess(title, message, options?.duration),
    error: (title: string, message?: string, options?: any) => 
      showError(title, message, options?.duration),
    warning: (title: string, message?: string, options?: any) => 
      showWarning(title, message, options?.duration),
    info: (title: string, message?: string, options?: any) => 
      showInfo(title, message, options?.duration),
    clearAll
  }
} 