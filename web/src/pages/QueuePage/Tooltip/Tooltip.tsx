import { useEffect, useState, type MouseEvent } from 'react'
import styles from './Tooltip.module.scss'
import type { TooltipPosition, TooltipProps } from './Tooltip.type'

export default function Tooltip({ label, children }: TooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  useEffect(() => {
    if (!position) return
    const hide = () => setPosition(null)
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    document.addEventListener('keydown', hideOnEscape)
    window.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('keydown', hideOnEscape)
      window.removeEventListener('scroll', hide, true)
    }
  }, [position])

  function show(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setPosition({ top: rect.top, left: rect.left + rect.width / 2 })
  }

  return (
    <span className={styles.trigger} onMouseEnter={show} onMouseLeave={() => setPosition(null)}>
      {children}
      {position && (
        // Fixed positioning escapes the table card's overflow clipping. The text is already
        // available to screen readers in the cell, so the tooltip itself is hidden from them.
        <span className={styles.tooltip} style={position} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  )
}
