import { expect, test as base, vi } from 'vitest'
import getApiUrl from './getApiUrl'

const test = base
  .extend('configuredUrl', () => 'http://api.example:9000')
  .extend('stubEnv', ({}, { onCleanup }) => {
    onCleanup(() => {
      vi.unstubAllEnvs()
    })
    return (value: string | undefined) => vi.stubEnv('VITE_API_URL', value)
  })

test('returns VITE_API_URL when it is set', ({ configuredUrl, stubEnv }) => {
  stubEnv(configuredUrl)

  expect(getApiUrl()).toBe(configuredUrl)
})

test('falls back to the api port from the run contract when VITE_API_URL is unset', ({
  stubEnv,
}) => {
  stubEnv(undefined)

  expect(getApiUrl()).toBe('http://localhost:8000')
})
