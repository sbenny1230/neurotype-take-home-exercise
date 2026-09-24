import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { QueueItem } from 'types/queueItem.type'
import { expect, test as base, vi } from 'vitest'
import { makeStore } from '../../store'
import QueuePage from './QueuePage'

const test = base
  .extend('queue', (): QueueItem[] => [
    {
      assessment_id: 'a-00052',
      clinician_id: 'c-008',
      assessed_at: '2025-04-03T10:30:00Z',
      review_flag: true,
    },
    {
      assessment_id: 'a-00081',
      clinician_id: 'c-001',
      assessed_at: '2025-04-14T09:00:00Z',
      review_flag: true,
    },
    {
      assessment_id: 'a-00017',
      clinician_id: 'c-003',
      assessed_at: '2025-04-09T09:00:00Z',
      review_flag: false,
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

test('shows the assessed date, clinician and review status on each row', async ({
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
  expect(cells).toEqual([
    ['a-00052', '3 Apr 2025', 'c-008', 'Needs review'],
    ['a-00081', '14 Apr 2025', 'c-001', 'Needs review'],
    ['a-00017', '9 Apr 2025', 'c-003', ''],
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
