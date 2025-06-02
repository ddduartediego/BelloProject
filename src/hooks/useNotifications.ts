import { useState, useCallback, useRef } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number // em milissegundos, 0 = persistente
  action?: {
    label: string
    onClick: () => void
  }
  timestamp: number
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string
  hideNotification: (id: string) => void
  clearAll: () => void
  // Helpers para tipos específicos
  showSuccess: (title: string, message?: string, duration?: number) => string
  showError: (title: string, message?: string, duration?: number) => string
  showWarning: (title: string, message?: string, duration?: number) => string
  showInfo: (title: string, message?: string, duration?: number) => string
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const showNotification = useCallback((
    notificationData: Omit<Notification, 'id' | 'timestamp'>
  ): string => {
    const id = generateId()
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: Date.now(),
      duration: notificationData.duration ?? 5000 // padrão 5 segundos
    }

    setNotifications(prev => [notification, ...prev])

    // Auto-hide se duration > 0
    if (notification.duration && notification.duration > 0) {
      const timeout = setTimeout(() => {
        hideNotification(id)
      }, notification.duration)
      
      timeouts.current.set(id, timeout)
    }

    return id
  }, [generateId])

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    // Limpar timeout se existir
    const timeout = timeouts.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeouts.current.delete(id)
    }
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    
    // Limpar todos os timeouts
    timeouts.current.forEach(timeout => clearTimeout(timeout))
    timeouts.current.clear()
  }, [])

  // Helpers para tipos específicos
  const showSuccess = useCallback((
    title: string, 
    message?: string, 
    duration: number = 4000
  ) => {
    return showNotification({ type: 'success', title, message, duration })
  }, [showNotification])

  const showError = useCallback((
    title: string, 
    message?: string, 
    duration: number = 8000
  ) => {
    return showNotification({ type: 'error', title, message, duration })
  }, [showNotification])

  const showWarning = useCallback((
    title: string, 
    message?: string, 
    duration: number = 6000
  ) => {
    return showNotification({ type: 'warning', title, message, duration })
  }, [showNotification])

  const showInfo = useCallback((
    title: string, 
    message?: string, 
    duration: number = 5000
  ) => {
    return showNotification({ type: 'info', title, message, duration })
  }, [showNotification])

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

export default useNotifications 