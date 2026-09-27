import type { FormEvent } from 'react'
import type { QueueFilters } from 'types/queueFilters.type'

export type FilterPanelProps = {
  filters: QueueFilters
  onApply: (filters: QueueFilters) => void
}

export type FilterFormProps = FilterPanelProps & {
  id: string
}

export type FilterPanelState = {
  open: boolean
  toggle: () => void
  formId: string
  activeCount: number
}

export type FilterFormState = {
  clinicianOptions: string[]
  error: string | null
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  handleClear: () => void
}
