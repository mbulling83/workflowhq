import { useState } from 'react'
import './Tabs.css'

interface Tab {
  id: string
  label: string
  count: number
}

interface TabsProps {
  tabs: Tab[]
  children: (activeTab: string) => React.ReactNode
  onTabChange?: (tabId: string) => void
}

function Tabs({ tabs, children, onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>
      <div className="tabs-content" key={activeTab}>
        {children(activeTab)}
      </div>
    </div>
  )
}

export default Tabs
