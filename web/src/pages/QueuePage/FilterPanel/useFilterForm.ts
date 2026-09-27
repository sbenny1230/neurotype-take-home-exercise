import { useState, type FormEvent } from 'react'
import type { QueueFilters } from 'types/queueFilters.type'
import type { FilterFormState } from './FilterPanel.type'
import useClinicianOptions from './useClinicianOptions'

export default function useFilterForm(
  filters: QueueFilters,
  onApply: (filters: QueueFilters) => void,
): FilterFormState {
  const clinicianOptions = useClinicianOptions(filters.clinician_id)
  const [error, setError] = useState<string | null>(null)

  return {
    clinicianOptions,
    error,
    handleSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const next = filtersFromForm(new FormData(event.currentTarget))
      const problem = filterError(next)
      setError(problem)
      if (!problem) onApply(next)
    },
    handleClear: () => {
      setError(null)
      onApply({})
    },
  }
}

function filtersFromForm(formData: FormData): QueueFilters {
  return Object.fromEntries(
    [...formData.entries()].flatMap(([name, value]) => {
      const text = String(value).trim()
      return text ? [[name, text]] : []
    }),
  )
}

function filterError(filters: QueueFilters): string | null {
  const { score_domain, score_min, score_max, assessed_from, assessed_to } = filters
  if ((score_min || score_max) && !score_domain) {
    return 'Choose a score domain to filter by score.'
  }
  if (score_min && score_max && Number(score_min) > Number(score_max)) {
    return 'The score "from" must not be higher than the score "to".'
  }
  if (assessed_from && assessed_to && assessed_from > assessed_to) {
    return 'The "from" date must not be after the "to" date.'
  }
  return null
}
