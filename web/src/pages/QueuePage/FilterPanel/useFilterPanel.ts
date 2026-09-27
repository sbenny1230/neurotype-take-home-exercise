import { useId, useState } from 'react'
import type { QueueFilters } from 'types/queueFilters.type'
import type { FilterPanelState } from './FilterPanel.type'

export default function useFilterPanel(filters: QueueFilters): FilterPanelState {
  const activeCount = Object.keys(filters).length
  const [open, setOpen] = useState(activeCount > 0)
  const formId = useId()

  return {
    open,
    toggle: () => setOpen(!open),
    formId,
    activeCount,
  }
}
