import './LayoutSelector.css'

export type LayoutType = 'list' | 'grid' | 'table'

interface LayoutSelectorProps {
  layout: LayoutType
  onChange: (layout: LayoutType) => void
}

function LayoutSelector({ layout, onChange }: LayoutSelectorProps) {
  return (
    <div className="layout-selector">
      <button
        className={`layout-button ${layout === 'list' ? 'active' : ''}`}
        onClick={() => onChange('list')}
        title="List layout"
        aria-label="List layout"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="12" height="2" rx="0.5" fill="currentColor"/>
          <rect x="2" y="6" width="12" height="2" rx="0.5" fill="currentColor"/>
          <rect x="2" y="10" width="12" height="2" rx="0.5" fill="currentColor"/>
        </svg>
      </button>
      <button
        className={`layout-button ${layout === 'grid' ? 'active' : ''}`}
        onClick={() => onChange('grid')}
        title="Grid layout"
        aria-label="Grid layout"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="5" height="5" rx="0.5" fill="currentColor"/>
          <rect x="9" y="2" width="5" height="5" rx="0.5" fill="currentColor"/>
          <rect x="2" y="9" width="5" height="5" rx="0.5" fill="currentColor"/>
          <rect x="9" y="9" width="5" height="5" rx="0.5" fill="currentColor"/>
        </svg>
      </button>
      <button
        className={`layout-button ${layout === 'table' ? 'active' : ''}`}
        onClick={() => onChange('table')}
        title="Table layout"
        aria-label="Table layout"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M2 6H14M2 10H14M6 2V14M10 2V14" stroke="currentColor" strokeWidth="1.25"/>
        </svg>
      </button>
    </div>
  )
}

export default LayoutSelector
