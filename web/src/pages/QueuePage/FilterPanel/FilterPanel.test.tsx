import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { QueueFilters } from 'types/queueFilters.type'
import { expect, test as base, vi } from 'vitest'
import { makeStore } from '../../../store'
import FilterPanel from './FilterPanel'

const test = base
  .extend('clinicianIds', () => ['c-001', 'c-008'])
  .extend('activeFilters', (): QueueFilters => ({ review_flag: 'true', clinician_id: 'c-008' }))
  .extend('fetchMock', { auto: true }, ({ clinicianIds }, { onCleanup }) => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(clinicianIds))
    vi.stubGlobal('fetch', fetchMock)
    onCleanup(() => {
      vi.unstubAllGlobals()
    })
    return fetchMock
  })
  .extend('onApply', () => vi.fn<(filters: QueueFilters) => void>())
  .extend('renderPanel', ({ onApply }, { onCleanup }) => {
    onCleanup(cleanup)
    return (filters: QueueFilters) =>
      render(
        <Provider store={makeStore()}>
          <FilterPanel filters={filters} onApply={onApply} />
        </Provider>,
      )
  })

function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: /^Filters/ }))
}

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function apply() {
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
}

test('starts closed when no filters are active', ({ renderPanel }) => {
  renderPanel({})

  const toggle = screen.getByRole('button', { name: 'Filters' })
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByRole('form', { name: 'Queue filters' })).toBeNull()
})

test('opens and closes from the toggle button', ({ renderPanel }) => {
  renderPanel({})

  openPanel()
  expect(screen.getByRole('button', { name: 'Filters' }).getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByRole('form', { name: 'Queue filters' })).toBeTruthy()

  openPanel()
  expect(screen.queryByRole('form', { name: 'Queue filters' })).toBeNull()
})

test('starts open, counts the active filters and shows their values', async ({
  activeFilters,
  renderPanel,
}) => {
  renderPanel(activeFilters)

  expect(screen.getByRole('button', { name: 'Filters (2 active)' })).toBeTruthy()
  expect((screen.getByLabelText('Review status') as HTMLSelectElement).value).toBe('true')
  expect((screen.getByLabelText('Clinician') as HTMLSelectElement).value).toBe('c-008')
})

test('lists the clinicians from the api', async ({ clinicianIds, renderPanel }) => {
  renderPanel({})
  openPanel()

  await screen.findByRole('option', { name: 'c-001' })
  const options = screen.getAllByRole('option', { name: /^c-/ }).map((option) => option.textContent)
  expect(options).toEqual(clinicianIds)
})

test('applies the entered filters, leaving out empty fields', async ({ onApply, renderPanel }) => {
  renderPanel({})
  openPanel()
  await screen.findByRole('option', { name: 'c-008' })

  change('Assessment ID', 'a-0005')
  change('Review status', 'false')
  change('Clinician', 'c-008')
  change('Assessed from', '2025-04-01')
  change('Score domain', 'executive_function')
  change('Score from (%)', '55')
  apply()

  expect(onApply).toHaveBeenCalledWith({
    search: 'a-0005',
    review_flag: 'false',
    clinician_id: 'c-008',
    assessed_from: '2025-04-01',
    score_domain: 'executive_function',
    score_min: '55',
  })
})

test('clear applies no filters', ({ activeFilters, onApply, renderPanel }) => {
  renderPanel(activeFilters)

  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

  expect(onApply).toHaveBeenCalledWith({})
})

test.for([
  {
    fields: { 'Score from (%)': '50' },
    error: 'Choose a score domain to filter by score.',
  },
  {
    fields: { 'Score domain': 'motor_coordination', 'Score from (%)': '80', 'Score to (%)': '20' },
    error: 'The score "from" must not be higher than the score "to".',
  },
  {
    fields: { 'Assessed from': '2025-05-02', 'Assessed to': '2025-05-01' },
    error: 'The "from" date must not be after the "to" date.',
  },
])(
  'explains and does not apply invalid filters: $error',
  ({ fields, error }, { onApply, renderPanel }) => {
    renderPanel({})
    openPanel()

    Object.entries(fields).forEach(([label, value]) => change(label, value))
    apply()

    expect(screen.getByRole('alert').textContent).toBe(error)
    expect(onApply).not.toHaveBeenCalled()
  },
)
