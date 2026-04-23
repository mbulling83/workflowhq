'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Sheet({ open, onClose, children }: SheetProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

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
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-slate-200/90 bg-slate-50/95 shadow-[0_24px_64px_rgba(15,23,42,0.18)] backdrop-blur-md will-change-transform transition-[transform,opacity] duration-260 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-90'
        )}
        role="dialog"
        aria-modal
      >
        {children}
      </div>
    </>
  )
}
