import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getApiUrl from 'utils/getApiUrl'
import type { QueueItem } from 'types/queueItem.type'

export const assessmentsApi = createApi({
  reducerPath: 'assessmentsApi',
  baseQuery: fetchBaseQuery({ baseUrl: getApiUrl() }),
  endpoints: (build) => ({
    getQueue: build.query<QueueItem[], void>({
      query: () => '/assessments',
    }),
  }),
})

export const { useGetQueueQuery } = assessmentsApi
