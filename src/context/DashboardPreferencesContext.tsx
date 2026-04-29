import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface DashboardWidgets {
  kpis: boolean
  alerts: boolean
  leadVolume: boolean
  sourceBreakdown: boolean
  granularSegments: boolean
  highValueLeads: boolean
  predictiveForecast: boolean
  campaignTrend: boolean
}

interface DashboardPreferencesContextValue {
  widgets: DashboardWidgets
  toggleWidget: (widget: keyof DashboardWidgets) => void
}

const defaultWidgets: DashboardWidgets = {
  kpis: true,
  alerts: true,
  leadVolume: true,
  sourceBreakdown: true,
  granularSegments: true,
  highValueLeads: true,
  predictiveForecast: true,
  campaignTrend: true,
}

const DashboardPreferencesContext = createContext<DashboardPreferencesContextValue | null>(null)

export const DashboardPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [widgets, setWidgets] = useState<DashboardWidgets>(defaultWidgets)

  const toggleWidget = (widget: keyof DashboardWidgets) => {
    setWidgets((previous) => ({ ...previous, [widget]: !previous[widget] }))
  }

  const value = useMemo(() => ({ widgets, toggleWidget }), [widgets])
  return (
    <DashboardPreferencesContext.Provider value={value}>{children}</DashboardPreferencesContext.Provider>
  )
}

export const useDashboardPreferences = (): DashboardPreferencesContextValue => {
  const context = useContext(DashboardPreferencesContext)
  if (!context) {
    throw new Error('useDashboardPreferences must be used within DashboardPreferencesProvider')
  }
  return context
}
