import { useCallback, useState, type MouseEvent } from 'react'
import type { TooltipPosition, TooltipState } from './Tooltip.type'
import useDismissTooltip from './useDismissTooltip'

export default function useTooltip(): TooltipState {
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const hide = useCallback(() => setPosition(null), [])
  useDismissTooltip(position !== null, hide)

  return {
    position,
    show: (event: MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      setPosition({ top: rect.top, left: rect.left + rect.width / 2 })
    },
    hide,
  }
}
