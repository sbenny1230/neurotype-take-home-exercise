import { act, cleanup, renderHook } from '@testing-library/react'
import type { QueueFilters } from 'types/queueFilters.type'
import { expect, test as base } from 'vitest'
import useUrlFilters from './useUrlFilters'

const test = base
  .extend('appliedFilters', (): QueueFilters => ({ review_flag: 'true', clinician_id: 'c-008' }))
  .extend('visitUrl', ({}, { onCleanup }) => {
    onCleanup(() => {
      cleanup()
      window.history.replaceState(null, '', '/')
    })
    return (url: string) => window.history.replaceState(null, '', url)
  })

test('reads the known, non-empty filters from the URL', ({ visitUrl }) => {
  visitUrl('/?review_flag=true&search=&colour=blue&clinician_id=c-008')

  const { result } = renderHook(() => useUrlFilters())

  expect(result.current[0]).toEqual({ review_flag: 'true', clinician_id: 'c-008' })
})

test('applying filters puts them in the URL as a new history entry', ({
  visitUrl,
  appliedFilters,
}) => {
  visitUrl('/')
  const historyLength = window.history.length
  const { result } = renderHook(() => useUrlFilters())

  act(() => result.current[1](appliedFilters))

  expect(result.current[0]).toEqual(appliedFilters)
  expect(window.location.search).toBe('?review_flag=true&clinician_id=c-008')
  expect(window.history.length).toBe(historyLength + 1)
})

test('clearing the filters removes the query string', ({ visitUrl }) => {
  visitUrl('/?review_flag=true')
  const { result } = renderHook(() => useUrlFilters())

  act(() => result.current[1]({}))

  expect(window.location.search).toBe('')
})

test('follows the URL when the user goes back or forward', ({ visitUrl }) => {
  visitUrl('/')
  const { result } = renderHook(() => useUrlFilters())

  act(() => {
    window.history.replaceState(null, '', '/?search=a-0005')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

  expect(result.current[0]).toEqual({ search: 'a-0005' })
})
