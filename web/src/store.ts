import { configureStore } from '@reduxjs/toolkit'
import { assessmentsApi } from 'services/assessments/assessmentsApi'

export function makeStore() {
  return configureStore({
    reducer: { [assessmentsApi.reducerPath]: assessmentsApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(assessmentsApi.middleware),
  })
}
