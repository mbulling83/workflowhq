import { useState, useEffect, useRef } from 'react'
import './SearchBar.css'

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

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(value.toLowerCase())
    )
    .slice(0, 10) // Limit to 10 suggestions

  const showSuggestions = isFocused && value.length > 0 && filteredSuggestions.length > 0

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) {
        setSelectedIndex(-1)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
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
    if (input) {
      input.addEventListener('keydown', handleKeyDown)
      return () => input.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSuggestions, selectedIndex, filteredSuggestions, onChange])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setSelectedIndex(-1)
    setIsFocused(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className="search-bar">
        <svg 
          className="search-icon" 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path 
            d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {value && (
          <button 
            className="search-clear" 
            onClick={handleClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      {showSuggestions && (
        <div className="search-suggestions">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`search-suggestion ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {highlightMatch(suggestion, value)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query) return text

  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return (
    <>
      {before}
      <strong className="highlight">{match}</strong>
      {after}
    </>
  )
}

export default SearchBar
