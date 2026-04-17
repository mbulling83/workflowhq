import { useState, useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
}

function SearchBar({ value, onChange, placeholder = 'Search...', suggestions = [] }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 10)

  const showSuggestions = isFocused && value.length > 0 && filteredSuggestions.length > 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) { setSelectedIndex(-1); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => prev < filteredSuggestions.length - 1 ? prev + 1 : prev)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        onChange(filteredSuggestions[selectedIndex])
        setSelectedIndex(-1)
        inputRef.current?.blur()
      } else if (e.key === 'Escape') {
        setIsFocused(false)
        inputRef.current?.blur()
      }
    }
    const input = inputRef.current
    input?.addEventListener('keydown', handleKeyDown)
    return () => input?.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestions, selectedIndex, filteredSuggestions, onChange])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div className={cn(
        'flex items-center gap-2 h-9 px-3 rounded-lg border bg-white text-sm transition-colors dark:bg-slate-900',
        isFocused
          ? 'border-slate-400 ring-2 ring-slate-200 dark:border-slate-500 dark:ring-slate-700'
          : 'border-slate-200 dark:border-slate-700'
      )}>
        <svg className="text-slate-400 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus() }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
            aria-label="Clear"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      {showSuggestions && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          {filteredSuggestions.map((s, i) => (
            <div
              key={i}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer transition-colors',
                i === selectedIndex
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
              onClick={() => { onChange(s); setSelectedIndex(-1); setIsFocused(false) }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {highlightMatch(s, value)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function highlightMatch(text: string, query: string) {
  if (!query) return <>{text}</>
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-slate-900 dark:text-slate-100">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  )
}

export default SearchBar
