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
  campaignRules: [
    {
      id: 'rule-meta-facebook',
      label: 'Meta Facebook Prospecting',
      source: 'Meta - Facebook',
      sourceWeightBoost: 8,
      behaviorWeights: {
        emailOpens: 4,
        emailClicks: 8,
        adInteractions: 16,
        formSubmissions: 20,
      },
    },
    {
      id: 'rule-meta-instagram',
      label: 'Meta Instagram Retargeting',
      source: 'Meta - Instagram',
      sourceWeightBoost: 10,
      behaviorWeights: {
        emailOpens: 4,
        emailClicks: 9,
        adInteractions: 18,
        formSubmissions: 22,
      },
    },
    {
      id: 'rule-email-nurture',
      label: 'Email Nurture Pipeline',
      source: 'Email',
      sourceWeightBoost: 6,
      behaviorWeights: {
        emailOpens: 10,
        emailClicks: 18,
        adInteractions: 6,
        formSubmissions: 20,
      },
    },
  ],
  exclusionRules: {
    inactivityDays: 30,
    minHealthScore: 28,
    excludedIndustries: ['Adult', 'Gambling'],
  },
  learning: {
    enabled: true,
    learningRate: 0.2,
    lookbackDays: 30,
  },
}
