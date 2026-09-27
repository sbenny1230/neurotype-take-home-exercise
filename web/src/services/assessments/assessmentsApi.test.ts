import { expect, test as base, vi } from 'vitest'
import { makeStore } from '../../store'
import { assessmentsApi } from './assessmentsApi'
import type { QueueFilters } from 'types/queueFilters.type'
import type { QueueItem } from 'types/queueItem.type'

const test = base
  .extend('queue', (): QueueItem[] => [
    {
      assessment_id: 'a-00052',
      clinician_id: 'c-008',
      assessed_at: '2025-04-03T10:30:00Z',
      review_flag: true,
      domain_scores: {},
    },
    {
      assessment_id: 'a-00017',
      clinician_id: 'c-003',
      assessed_at: '2025-04-09T09:00:00Z',
      review_flag: false,
      domain_scores: {},
    },
  ])
  .extend('filters', (): QueueFilters => ({
    review_flag: 'true',
    clinician_id: 'c-008',
    search: 'a-0005',
  }))
  .extend('fetchMock', ({ queue }, { onCleanup }) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(queue))
    vi.stubGlobal('fetch', fetchMock)
    onCleanup(() => {
      vi.unstubAllGlobals()
    })
    return fetchMock
  })

test('getQueue requests GET /assessments and returns the queue rows', async ({
  queue,
  fetchMock,
}) => {
  const store = makeStore()

  const result = await store.dispatch(assessmentsApi.endpoints.getQueue.initiate({}))

  expect(result.data).toEqual(queue)
  const [request] = fetchMock.mock.calls[0]
  expect(request).toMatchObject({ method: 'GET', url: 'http://localhost:8000/assessments' })
})

test('getQueue sends the filters as query parameters', async ({ filters, fetchMock }) => {
  const store = makeStore()

  await store.dispatch(assessmentsApi.endpoints.getQueue.initiate(filters))

  const [request] = fetchMock.mock.calls[0]
  expect(request).toMatchObject({
    url: 'http://localhost:8000/assessments?review_flag=true&clinician_id=c-008&search=a-0005',
  })
})
