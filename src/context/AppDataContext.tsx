import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadLeadData } from '../lib/leadData'
import type { CampaignRow, Lead } from '../types'
import { useScoringConfig } from './ScoringConfigContext'

interface AppDataContextValue {
  leads: Lead[]
  campaigns: CampaignRow[]
  loading: boolean
  error: string | null
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { scoringConfig } = useScoringConfig()
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const payload = await loadLeadData(scoringConfig)
        setLeads(payload.leads)
        setCampaigns(payload.campaigns)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unknown error loading data')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [scoringConfig])

  const value = useMemo(() => ({ leads, campaigns, loading, error }), [campaigns, error, leads, loading])
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export const useAppData = (): AppDataContextValue => {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider')
  }
  return context
}
