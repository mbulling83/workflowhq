import './SortBar.css'

export type SortBy = 'alphabetical' | 'created' | 'updated' | 'executed'
export type SortOrder = 'asc' | 'desc'

export interface SortState {
  sortBy: SortBy
  sortOrder: SortOrder
}

interface SortBarProps {
  sortState: SortState
  onSortChange: (sortState: SortState) => void
  hasExecutedData?: boolean
}

function SortBar({ sortState, onSortChange, hasExecutedData = false }: SortBarProps) {
  const updateSortBy = (sortBy: SortBy) => {
    onSortChange({
      ...sortState,
      sortBy,
    })
  }

  const updateSortOrder = (sortOrder: SortOrder) => {
    onSortChange({
      ...sortState,
      sortOrder,
    })
  }

  return (
    <div className="sort-bar">
      <div className="sort-group">
        <label className="sort-label">Sort by:</label>
        <select
          className="sort-select"
          value={sortState.sortBy}
          onChange={(e) => updateSortBy(e.target.value as SortBy)}
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="created">Created</option>
          <option value="updated">Last Updated</option>
          {hasExecutedData && <option value="executed">Last Executed</option>}
        </select>
      </div>

      <div className="sort-group">
        <label className="sort-label">Order:</label>
        <select
          className="sort-select"
          value={sortState.sortOrder}
          onChange={(e) => updateSortOrder(e.target.value as SortOrder)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  )
}

export default SortBar
