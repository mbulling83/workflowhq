'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  'aria-label'?: string
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onClose, children, 'aria-label': ariaLabel }: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Close on Escape; trap Tab within the panel
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Move focus into the panel when it opens
  React.useEffect(() => {
    if (!open || !panelRef.current) return
    const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
  }, [open])

  // Prevent body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 ease-out',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-slate-200/90 bg-slate-50/95 shadow-[0_24px_64px_rgba(15,23,42,0.18)] backdrop-blur-md will-change-transform transition-[transform,opacity] duration-260 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-90'
        )}
        role="dialog"
        aria-modal
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </>
  )
}
