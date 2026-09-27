import { expect, test as base, vi } from 'vitest'
import { makeStore } from '../../store'
import { cliniciansApi } from './cliniciansApi'

const test = base
  .extend('clinicianIds', () => ['c-001', 'c-002', 'c-008'])
  .extend('fetchMock', ({ clinicianIds }, { onCleanup }) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(clinicianIds))
    vi.stubGlobal('fetch', fetchMock)
    onCleanup(() => {
      vi.unstubAllGlobals()
    })
    return fetchMock
  })

test('getClinicians requests GET /clinicians and returns the IDs', async ({
  clinicianIds,
  fetchMock,
}) => {
  const store = makeStore()

  const result = await store.dispatch(cliniciansApi.endpoints.getClinicians.initiate())

  expect(result.data).toEqual(clinicianIds)
  const [request] = fetchMock.mock.calls[0]
  expect(request).toMatchObject({ method: 'GET', url: 'http://localhost:8000/clinicians' })
})
