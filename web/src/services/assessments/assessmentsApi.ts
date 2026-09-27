import { baseApi } from 'services/baseApi'
import type { QueueFilters } from 'types/queueFilters.type'
import type { QueueItem } from 'types/queueItem.type'

export const assessmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getQueue: build.query<QueueItem[], QueueFilters>({
      query: (filters) => ({
        url: '/assessments',
        params: Object.keys(filters).length > 0 ? filters : undefined,
      }),
    }),
  }),
})

export const { useGetQueueQuery } = assessmentsApi
