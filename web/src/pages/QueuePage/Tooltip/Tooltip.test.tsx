import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { expect, test as base } from 'vitest'
import Tooltip from './Tooltip'

const test = base
  .extend('label', () => '62.5%')
  .extend('renderTooltip', ({ label }, { onCleanup }) => {
    onCleanup(cleanup)
    return () => {
      render(<Tooltip label={label}>Moderate</Tooltip>)
      return screen.getByText('Moderate')
    }
  })

test('shows nothing until hovered', ({ label, renderTooltip }) => {
  renderTooltip()

  expect(screen.queryByText(label)).toBeNull()
})

test('shows the label while hovered and hides it when the pointer leaves', ({
  label,
  renderTooltip,
}) => {
  const trigger = renderTooltip()

  fireEvent.mouseEnter(trigger)
  expect(screen.getByText(label)).toBeTruthy()

  fireEvent.mouseLeave(trigger)
  expect(screen.queryByText(label)).toBeNull()
})

test('Escape dismisses the tooltip while it is hovered', ({ label, renderTooltip }) => {
  const trigger = renderTooltip()

  fireEvent.mouseEnter(trigger)
  fireEvent.keyDown(document, { key: 'Escape' })

  expect(screen.queryByText(label)).toBeNull()
})
