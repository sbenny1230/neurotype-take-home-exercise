import type { DomainScore } from 'types/domainScore.type'
import type { QueueItem } from 'types/queueItem.type'

export type QueueTableProps = {
  queue: QueueItem[]
}

export type BandCellProps = {
  score: DomainScore | undefined
}
