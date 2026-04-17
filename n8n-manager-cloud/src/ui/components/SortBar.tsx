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

const selectClass = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors'
const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'

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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <label className={labelClass}>Sort by:</label>
        <select
          className={selectClass}
          value={sortState.sortBy}
          onChange={(e) => updateSortBy(e.target.value as SortBy)}
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="created">Created</option>
          <option value="updated">Last Updated</option>
          {hasExecutedData && <option value="executed">Last Executed</option>}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className={labelClass}>Order:</label>
        <select
          className={selectClass}
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
