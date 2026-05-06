// ─── Hook: Debounce ───────────────────────────────────────────────────────────
// Originalmente criado pela Thayane (Dashboard & Busca)
// Integrado ao APEX sem alterações — funciona com qualquer tipo T

import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
