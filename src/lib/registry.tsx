'use client'

import React from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { StyledEngineProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

// Este componente resolve problemas de hidratação com Material-UI
export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  // Só executa no lado do cliente
  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache({ key: 'mui' })
    cache.compat = true
    const prevInsert = cache.insert
    let inserted: string[] = []
    cache.insert = (...args) => {
      const serialized = args[1]
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const prevInserted = inserted
      inserted = []
      return prevInserted
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (names.length === 0) {
      return null
    }
    let styles = ''
    for (const name of names) {
      styles += cache.inserted[name]
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    )
  })

  return (
    <CacheProvider value={cache}>
      <StyledEngineProvider injectFirst>
        {children}
      </StyledEngineProvider>
    </CacheProvider>
  )
} 