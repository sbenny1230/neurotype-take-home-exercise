import type { ReactNode } from 'react'

export type TooltipProps = {
  label: string
  children: ReactNode
}

export type TooltipPosition = {
  top: number
  left: number
}
