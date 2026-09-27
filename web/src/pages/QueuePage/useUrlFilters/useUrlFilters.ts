import { useEffect, useState } from 'react'
import type { QueueFilterName, QueueFilters } from 'types/queueFilters.type'

const FILTER_NAMES: QueueFilterName[] = [
  'review_flag',
  'clinician_id',
  'assessed_from',
  'assessed_to',
  'search',
  'score_domain',
  'score_min',
  'score_max',
]

function readFiltersFromUrl(): QueueFilters {
  const params = new URLSearchParams(window.location.search)
  return Object.fromEntries(
    FILTER_NAMES.flatMap((name) => {
      const value = params.get(name)
      return value ? [[name, value]] : []
    }),
  )
}

export default function useUrlFilters(): [QueueFilters, (filters: QueueFilters) => void] {
  const [filters, setFilters] = useState(readFiltersFromUrl)

  useEffect(() => {
    const syncFromUrl = () => setFilters(readFiltersFromUrl())
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  function applyFilters(next: QueueFilters) {
    const query = new URLSearchParams(
      Object.entries(next).flatMap(([name, value]) => (value ? [[name, value]] : [])),
    ).toString()
    window.history.pushState(null, '', query ? `?${query}` : window.location.pathname)
    setFilters(next)
  }

  return [filters, applyFilters]
}
