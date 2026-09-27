import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from 'services/baseApi'

export function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  })
}
