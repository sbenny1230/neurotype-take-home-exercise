import styles from './Tooltip.module.scss'
import type { TooltipProps } from './Tooltip.type'
import useTooltip from './useTooltip'

export default function Tooltip({ label, children }: TooltipProps) {
  const { position, show, hide } = useTooltip()

  return (
    <span className={styles.trigger} onMouseEnter={show} onMouseLeave={hide}>
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
