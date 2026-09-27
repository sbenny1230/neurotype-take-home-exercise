import type { DomainName, DomainScore } from './domainScore.type'

export type QueueItem = {
  assessment_id: string
  clinician_id: string
  assessed_at: string
  review_flag: boolean
  domain_scores: Partial<Record<DomainName, DomainScore>>
}
