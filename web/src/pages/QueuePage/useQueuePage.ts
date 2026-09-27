import { useGetQueueQuery } from 'services/assessments/assessmentsApi'
import type { QueueItem } from 'types/queueItem.type'
import type { QueuePageState } from './QueuePage.type'
import useUrlFilters from './useUrlFilters'

export default function useQueuePage(): QueuePageState {
  const [filters, applyFilters] = useUrlFilters()
  const { data: queue, isLoading, isFetching, isError, refetch } = useGetQueueQuery(filters)

  return {
    filters,
    applyFilters,
    queue,
    isLoading,
    isFetching,
    isRefreshing: isFetching && !isLoading,
    isError,
    summary: queue ? summarise(queue) : null,
    retry: () => {
      refetch()
    },
  }
}

function summarise(queue: QueueItem[]): string {
  const needsReview = queue.filter((item) => item.review_flag).length
  return `${queue.length} assessments · ${needsReview} need review`
}
