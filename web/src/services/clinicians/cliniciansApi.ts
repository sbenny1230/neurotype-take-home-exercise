import { baseApi } from 'services/baseApi'

export const cliniciansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getClinicians: build.query<string[], void>({
      query: () => '/clinicians',
    }),
  }),
})

export const { useGetCliniciansQuery } = cliniciansApi
