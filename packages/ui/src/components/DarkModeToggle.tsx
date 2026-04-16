import { useTheme } from '../contexts/ThemeContext'
import { cn } from '../lib/utils'

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
        isDark ? 'bg-slate-700' : 'bg-slate-200'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
        isDark ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}
