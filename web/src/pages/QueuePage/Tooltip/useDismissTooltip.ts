import { useEffect } from 'react'

export default function useDismissTooltip(isOpen: boolean, dismiss: () => void): void {
  useEffect(() => {
    if (!isOpen) return
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', dismissOnEscape)
    window.addEventListener('scroll', dismiss, true)
    return () => {
      document.removeEventListener('keydown', dismissOnEscape)
      window.removeEventListener('scroll', dismiss, true)
    }
  }, [isOpen, dismiss])
}
