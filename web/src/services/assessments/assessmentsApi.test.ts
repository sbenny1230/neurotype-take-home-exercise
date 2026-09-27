import { expect, test as base, vi } from 'vitest'
import { makeStore } from '../../store'
import { assessmentsApi } from './assessmentsApi'
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

  const result = await store.dispatch(assessmentsApi.endpoints.getQueue.initiate())

  expect(result.data).toEqual(queue)
  const [request] = fetchMock.mock.calls[0]
  expect(request).toMatchObject({ method: 'GET', url: 'http://localhost:8000/assessments' })
})
