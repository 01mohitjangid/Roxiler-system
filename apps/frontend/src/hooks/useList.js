import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function useList(path, params) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      api(`${path}?${query}`)
        .then((d) => active && (setData(d), setError('')))
        .catch((e) => active && setError(e.message))
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [path, query, version])

  return { data, error, refresh: () => setVersion((v) => v + 1) }
}

export function useSort(initial, initialOrder = 'asc') {
  const [state, setState] = useState({ sort: initial, order: initialOrder })
  const toggle = (key) =>
    setState((s) => ({ sort: key, order: s.sort === key && s.order === 'asc' ? 'desc' : 'asc' }))
  return [state, toggle]
}
