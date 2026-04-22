import * as React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'destructive' | 'secondary' | 'method'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900',
    secondary: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    outline: 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400',
    destructive: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400',
    method: 'bg-violet-50 text-violet-700 border border-violet-200 font-mono dark:bg-violet-950 dark:text-violet-400',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
