import type { ScoringConfig } from '../types'

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  behavioralWeight: 60,
  demographicWeight: 40,
  highIntentThreshold: 80,
  qualifiedThreshold: 65,
  nurturingThreshold: 40,
  sourceWeights: {
    meta: 55,
    email: 45,
  },
  engagementWeights: {
    emailOpens: 8,
    emailClicks: 16,
    adInteractions: 12,
    formSubmissions: 20,
  },
}
