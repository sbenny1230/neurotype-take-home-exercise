import type { MouseEvent, ReactNode } from 'react'

export type TooltipProps = {
  label: string
  children: ReactNode
}

export type TooltipPosition = {
  top: number
  left: number
}

export type TooltipState = {
  position: TooltipPosition | null
  show: (event: MouseEvent<HTMLElement>) => void
  hide: () => void
}
