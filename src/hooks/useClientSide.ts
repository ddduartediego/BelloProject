import { useState, useEffect } from 'react'

/**
 * Hook para detectar se estamos no lado cliente (browser)
 * Resolve problemas de hidratação do Next.js
 */
export function useClientSide() {
  const [isClientSide, setIsClientSide] = useState(false)

  useEffect(() => {
    setIsClientSide(true)
  }, [])

  return isClientSide
} 