export type QueueFilterName =
  | 'review_flag'
  | 'clinician_id'
  | 'assessed_from'
  | 'assessed_to'
  | 'search'
  | 'score_domain'
  | 'score_min'
  | 'score_max'

export type QueueFilters = Partial<Record<QueueFilterName, string>>
