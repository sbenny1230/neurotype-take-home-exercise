import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { QueueItem } from 'types/queueItem.type'
import { expect, test as base, vi } from 'vitest'
import { makeStore } from '../../store'
import QueuePage from './QueuePage'

const test = base
  .extend('allMinimalScores', (): QueueItem['domain_scores'] => ({
    social_communication: { percentage: 20, band: 'minimal' },
    sensory_processing: { percentage: 20, band: 'minimal' },
    executive_function: { percentage: 20, band: 'minimal' },
    emotional_regulation: { percentage: 20, band: 'minimal' },
    motor_coordination: { percentage: 20, band: 'minimal' },
  }))
  .extend('queue', ({ allMinimalScores }): QueueItem[] => [
    {
      assessment_id: 'a-00052',
      clinician_id: 'c-008',
      assessed_at: '2025-04-03T10:30:00Z',
      review_flag: true,
      domain_scores: {
        social_communication: { percentage: 62.5, band: 'moderate' },
        sensory_processing: { percentage: 85, band: 'substantial' },
        executive_function: { percentage: 52.77777777777777, band: 'mild' },
        emotional_regulation: { percentage: 18, band: 'minimal' },
        motor_coordination: { percentage: null, band: null },
      },
    },
    {
      assessment_id: 'a-00081',
      clinician_id: 'c-001',
      assessed_at: '2025-04-14T09:00:00Z',
      review_flag: true,
      domain_scores: allMinimalScores,
    },
    {
      assessment_id: 'a-00017',
      clinician_id: 'c-003',
      assessed_at: '2025-04-09T09:00:00Z',
      review_flag: false,
      domain_scores: allMinimalScores,
    },
  ])
  .extend('fetchMock', ({}, { onCleanup }) => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    onCleanup(() => {
      vi.unstubAllGlobals()
    })
    return fetchMock
  })
  .extend('visitUrl', ({}, { onCleanup }) => {
    onCleanup(() => {
      window.history.replaceState(null, '', '/')
    })
    return (url: string) => window.history.replaceState(null, '', url)
  })
  .extend('routedFetch', ({ queue, fetchMock }) => {
    fetchMock.mockImplementation(async (request) => {
      const url = request instanceof Request ? request.url : String(request)
      return Response.json(url.includes('/clinicians') ? ['c-008'] : queue)
    })
    return fetchMock
  })
  .extend('renderPage', ({}, { onCleanup }) => {
    onCleanup(cleanup)
    return () =>
      render(
        <Provider store={makeStore()}>
          <QueuePage />
        </Provider>,
      )
  })

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1)
}

test('shows a loading status while the queue is being fetched', ({ fetchMock, renderPage }) => {
  fetchMock.mockReturnValue(new Promise(() => {}))

  renderPage()

  expect(screen.getByRole('status').textContent).toBe('Loading assessments…')
})

test('lists the assessments in the order the api returns them', async ({
  queue,
  fetchMock,
  renderPage,
}) => {
  fetchMock.mockImplementation(async () => Response.json(queue))

  renderPage()

  await screen.findByText('a-00052')
  expect(bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
    'a-00052',
    'a-00081',
    'a-00017',
  ])
})

test('has a column for each row field and each scored domain', async ({
  queue,
  fetchMock,
  renderPage,
}) => {
  fetchMock.mockImplementation(async () => Response.json(queue))

  renderPage()

  await screen.findByText('a-00052')
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Assessment',
    'Assessed',
    'Clinician',
    'Status',
    'Social',
    'Sensory',
    'Executive',
    'Emotional',
    'Motor',
  ])
})

test('shows the assessed date, clinician, review status and domain bands on each row', async ({
  queue,
  fetchMock,
  renderPage,
}) => {
  fetchMock.mockImplementation(async () => Response.json(queue))

  renderPage()

  await screen.findByText('a-00052')
  const cells = bodyRows().map((row) =>
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent),
  )
  const allMinimal = Array(5).fill('Minimal, 20%')
  expect(cells).toEqual([
    [
      'a-00052',
      '3 Apr 2025',
      'c-008',
      'Needs review',
      'Moderate, 62.5%',
      'Substantial, 85%',
      'Mild, 52.8%',
      'Minimal, 18%',
      'Not assessed',
    ],
    ['a-00081', '14 Apr 2025', 'c-001', 'Needs review', ...allMinimal],
    ['a-00017', '9 Apr 2025', 'c-003', '', ...allMinimal],
  ])
})

test('summarises how many assessments need review', async ({ queue, fetchMock, renderPage }) => {
  fetchMock.mockImplementation(async () => Response.json(queue))

  renderPage()

  expect(await screen.findByText('3 assessments · 2 need review')).toBeTruthy()
})

test('says so when there are no assessments', async ({ fetchMock, renderPage }) => {
  fetchMock.mockImplementation(async () => Response.json([]))

  renderPage()

  expect(await screen.findByText('No assessments')).toBeTruthy()
})

test('shows an error with a retry that fetches the queue again', async ({
  queue,
  fetchMock,
  renderPage,
}) => {
  fetchMock
    .mockImplementationOnce(async () => new Response(null, { status: 500 }))
    .mockImplementation(async () => Response.json(queue))

  renderPage()

  expect((await screen.findByRole('alert')).textContent).toContain("Couldn't load the queue")
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('a-00052')).toBeTruthy()
})

function requestedUrls(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): string[] {
  return fetchMock.mock.calls.map(([request]) =>
    request instanceof Request ? request.url : String(request),
  )
}

test('requests the queue with the filters in the URL', async ({
  visitUrl,
  routedFetch,
  renderPage,
}) => {
  visitUrl('/?review_flag=true&clinician_id=c-008')

  renderPage()

  await screen.findByText('a-00052')
  expect(requestedUrls(routedFetch)).toContain(
    'http://localhost:8000/assessments?review_flag=true&clinician_id=c-008',
  )
})

test('applying filters refetches the queue and records them in the URL', async ({
  visitUrl,
  routedFetch,
  renderPage,
}) => {
  visitUrl('/')
  renderPage()
  await screen.findByText('a-00052')

  fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
  fireEvent.change(screen.getByLabelText('Review status'), { target: { value: 'true' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

  await vi.waitFor(() =>
    expect(requestedUrls(routedFetch)).toContain(
      'http://localhost:8000/assessments?review_flag=true',
    ),
  )
  expect(window.location.search).toBe('?review_flag=true')
})
