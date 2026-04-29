import type { DateRangeFilter } from '../types'

interface FilterTabsProps {
  value: DateRangeFilter
  onChange: (value: DateRangeFilter) => void
}

const ITEMS: { label: string; value: DateRangeFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
]

export const FilterTabs = ({ value, onChange }: FilterTabsProps) => (
  <div className="chip-row" role="tablist" aria-label="Date range">
    {ITEMS.map((item) => (
      <button
        key={item.value}
        type="button"
        role="tab"
        aria-selected={value === item.value}
        className={`chip-button${value === item.value ? ' chip-button-active' : ''}`}
        onClick={() => onChange(item.value)}
      >
        {item.label}
      </button>
    ))}
  </div>
)
