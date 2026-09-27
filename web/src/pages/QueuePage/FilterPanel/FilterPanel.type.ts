import type { QueueFilters } from 'types/queueFilters.type'

export type FilterPanelProps = {
  filters: QueueFilters
  onApply: (filters: QueueFilters) => void
}

export type FilterFormProps = FilterPanelProps & {
  id: string
}
