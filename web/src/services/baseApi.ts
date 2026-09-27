import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getApiUrl from 'utils/getApiUrl'

export const baseApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: getApiUrl() }),
  endpoints: () => ({}),
})
