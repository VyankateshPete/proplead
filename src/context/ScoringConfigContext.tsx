import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SCORING_CONFIG } from '../config/defaultScoringConfig'
import type { ScoringConfig } from '../types'

interface ScoringConfigContextValue {
  scoringConfig: ScoringConfig
  setScoringConfig: (config: ScoringConfig) => void
}

const ScoringConfigContext = createContext<ScoringConfigContextValue | null>(null)

export const ScoringConfigProvider = ({ children }: { children: ReactNode }) => {
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG)
  const value = useMemo(() => ({ scoringConfig, setScoringConfig }), [scoringConfig])
  return <ScoringConfigContext.Provider value={value}>{children}</ScoringConfigContext.Provider>
}

export const useScoringConfig = (): ScoringConfigContextValue => {
  const context = useContext(ScoringConfigContext)
  if (!context) {
    throw new Error('useScoringConfig must be used within ScoringConfigProvider')
  }
  return context
}
