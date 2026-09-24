import { configureStore } from '@reduxjs/toolkit'
import { assessmentsApi } from './services/assessmentsApi'

export function makeStore() {
  return configureStore({
    reducer: { [assessmentsApi.reducerPath]: assessmentsApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(assessmentsApi.middleware),
  })
}
