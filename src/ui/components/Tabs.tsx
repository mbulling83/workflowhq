import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface Tab {
  id: string
  label: string
  count: number
}

interface TabsProps {
  tabs: Tab[]
  children: (activeTab: string) => ReactNode
  onTabChange?: (tabId: string) => void
  headerActions?: (activeTab: string) => ReactNode
}

function Tabs({ tabs, children, onTabChange, headerActions }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {headerActions && (
          <div className="pb-1">
            {headerActions(activeTab)}
          </div>
        )}
      </div>
      <div key={activeTab}>
        {children(activeTab)}
      </div>
    </div>
  )
}

export default Tabs
