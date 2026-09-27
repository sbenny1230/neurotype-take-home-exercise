import type { DomainScore } from 'types/domainScore.type'
import type { QueueFilters } from 'types/queueFilters.type'
import type { QueueItem } from 'types/queueItem.type'

export type QueueTableProps = {
  queue: QueueItem[]
}

export type BandCellProps = {
  score: DomainScore | undefined
}

export type QueuePageState = {
  filters: QueueFilters
  applyFilters: (filters: QueueFilters) => void
  queue: QueueItem[] | undefined
  isLoading: boolean
  isFetching: boolean
  isRefreshing: boolean
  isError: boolean
  summary: string | null
  retry: () => void
}
