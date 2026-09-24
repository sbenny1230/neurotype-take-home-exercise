import { cleanup, render, screen } from '@testing-library/react'
import { expect, test as base } from 'vitest'
import Header from './Header'

const test = base.extend('renderHeader', ({}, { onCleanup }) => {
  onCleanup(cleanup)
  return () => render(<Header />)
})

test('shows the Neurotype logo and the app name', ({ renderHeader }) => {
  renderHeader()

  expect(screen.getByRole('img', { name: 'Neurotype' })).toBeTruthy()
  expect(screen.getByRole('banner').textContent).toContain('Assessment Review')
})
