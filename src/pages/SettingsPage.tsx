import { useMemo } from 'react'
import { useScoringConfig } from '../context/ScoringConfigContext'
import type { IntegrationConnection, ScoringConfig } from '../types'
import { getAdapterBackedIntegrations } from '../services/adapters/adapterDiagnostics'

const numberField = (
  value: number,
  onChange: (next: number) => void,
  min: number,
  max: number,
  step = 1,
) => (
  <input
    className="input"
    type="number"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(event) => onChange(Number(event.target.value))}
  />
)

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

export const SettingsPage = () => {
  const { scoringConfig, setScoringConfig } = useScoringConfig()

  const integrations: IntegrationConnection[] = useMemo(
    () => getAdapterBackedIntegrations(),
    [],
  )
  const adapterMessages = integrations
    .filter((integration) =>
      ['meta', 'mailchimp', 'activecampaign', 'clearbit', 'zoominfo'].includes(integration.key),
    )
    .map((integration) => `${integration.label}: ${integration.statusText}`)
    .join(' · ')

  const updateConfig = (next: Partial<ScoringConfig>): void => {
    const merged = { ...scoringConfig, ...next }
    const behavioralWeight = clamp(merged.behavioralWeight, 0, 100)
    const demographicWeight = clamp(merged.demographicWeight, 0, 100)
    const total = behavioralWeight + demographicWeight || 1
    setScoringConfig({
      ...merged,
      behavioralWeight: Math.round((behavioralWeight / total) * 100),
      demographicWeight: Math.round((demographicWeight / total) * 100),
      highIntentThreshold: clamp(merged.highIntentThreshold, 50, 100),
      qualifiedThreshold: clamp(merged.qualifiedThreshold, 30, 95),
      nurturingThreshold: clamp(merged.nurturingThreshold, 20, 80),
      sourceWeights: {
        meta: clamp(merged.sourceWeights.meta, 0, 100),
        email: clamp(merged.sourceWeights.email, 0, 100),
      },
      engagementWeights: {
        emailOpens: clamp(merged.engagementWeights.emailOpens, 0, 50),
        emailClicks: clamp(merged.engagementWeights.emailClicks, 0, 50),
        adInteractions: clamp(merged.engagementWeights.adInteractions, 0, 50),
        formSubmissions: clamp(merged.engagementWeights.formSubmissions, 0, 50),
      },
      campaignRules: merged.campaignRules,
      exclusionRules: {
        inactivityDays: clamp(merged.exclusionRules.inactivityDays, 7, 120),
        minHealthScore: clamp(merged.exclusionRules.minHealthScore, 0, 100),
        excludedIndustries: merged.exclusionRules.excludedIndustries.filter(Boolean),
      },
      learning: {
        enabled: merged.learning.enabled,
        learningRate: clamp(merged.learning.learningRate, 0, 1),
        lookbackDays: clamp(merged.learning.lookbackDays, 7, 120),
      },
    })
  }

  return (
    <section>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure scoring, segmentation, and integrations</p>
      </header>

      <div className="three-col">
        <article className="surface panel">
          <h2 className="panel-title">Custom Scoring Rules</h2>
          <p className="panel-subtitle">Tune behavior, demographics, and source priorities</p>
          <div className="kv-list">
            <div className="kv-row">
              <span className="kv-key">Behavioral weight</span>
              {numberField(
                scoringConfig.behavioralWeight,
                (value) => updateConfig({ behavioralWeight: value }),
                0,
                100,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Demographic weight</span>
              {numberField(
                scoringConfig.demographicWeight,
                (value) => updateConfig({ demographicWeight: value }),
                0,
                100,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">High-intent threshold</span>
              {numberField(
                scoringConfig.highIntentThreshold,
                (value) => updateConfig({ highIntentThreshold: value }),
                50,
                100,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Qualified threshold</span>
              {numberField(
                scoringConfig.qualifiedThreshold,
                (value) => updateConfig({ qualifiedThreshold: value }),
                30,
                95,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Nurturing threshold</span>
              {numberField(
                scoringConfig.nurturingThreshold,
                (value) => updateConfig({ nurturingThreshold: value }),
                20,
                80,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Meta source weight</span>
              {numberField(
                scoringConfig.sourceWeights.meta,
                (value) =>
                  updateConfig({
                    sourceWeights: { ...scoringConfig.sourceWeights, meta: value },
                  }),
                0,
                100,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Email source weight</span>
              {numberField(
                scoringConfig.sourceWeights.email,
                (value) =>
                  updateConfig({
                    sourceWeights: { ...scoringConfig.sourceWeights, email: value },
                  }),
                0,
                100,
              )}
            </div>
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Engagement Feature Weights</h2>
          <p className="panel-subtitle">Control AI score contribution from behavior events</p>
          <div className="kv-list">
            <div className="kv-row">
              <span className="kv-key">Email opens</span>
              {numberField(
                scoringConfig.engagementWeights.emailOpens,
                (value) =>
                  updateConfig({
                    engagementWeights: { ...scoringConfig.engagementWeights, emailOpens: value },
                  }),
                0,
                50,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Email clicks</span>
              {numberField(
                scoringConfig.engagementWeights.emailClicks,
                (value) =>
                  updateConfig({
                    engagementWeights: { ...scoringConfig.engagementWeights, emailClicks: value },
                  }),
                0,
                50,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Ad interactions</span>
              {numberField(
                scoringConfig.engagementWeights.adInteractions,
                (value) =>
                  updateConfig({
                    engagementWeights: { ...scoringConfig.engagementWeights, adInteractions: value },
                  }),
                0,
                50,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Form submissions</span>
              {numberField(
                scoringConfig.engagementWeights.formSubmissions,
                (value) =>
                  updateConfig({
                    engagementWeights: { ...scoringConfig.engagementWeights, formSubmissions: value },
                  }),
                0,
                50,
              )}
            </div>
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Continuous Learning + Exclusion Rules</h2>
          <p className="panel-subtitle">Tune model adaptation and automatic lead suppression</p>
          <div className="kv-list">
            <div className="kv-row">
              <span className="kv-key">Continuous learning</span>
              <button
                type="button"
                className={`btn ${scoringConfig.learning.enabled ? 'btn-primary' : ''}`}
                onClick={() =>
                  updateConfig({
                    learning: {
                      ...scoringConfig.learning,
                      enabled: !scoringConfig.learning.enabled,
                    },
                  })
                }
              >
                {scoringConfig.learning.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="kv-row">
              <span className="kv-key">Learning rate</span>
              {numberField(
                Number(scoringConfig.learning.learningRate.toFixed(2)),
                (value) =>
                  updateConfig({
                    learning: { ...scoringConfig.learning, learningRate: value },
                  }),
                0,
                1,
                0.05,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Learning lookback (days)</span>
              {numberField(
                scoringConfig.learning.lookbackDays,
                (value) =>
                  updateConfig({
                    learning: { ...scoringConfig.learning, lookbackDays: value },
                  }),
                7,
                120,
                1,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Exclude if inactive (days)</span>
              {numberField(
                scoringConfig.exclusionRules.inactivityDays,
                (value) =>
                  updateConfig({
                    exclusionRules: { ...scoringConfig.exclusionRules, inactivityDays: value },
                  }),
                7,
                120,
                1,
              )}
            </div>
            <div className="kv-row">
              <span className="kv-key">Minimum health score</span>
              {numberField(
                scoringConfig.exclusionRules.minHealthScore,
                (value) =>
                  updateConfig({
                    exclusionRules: { ...scoringConfig.exclusionRules, minHealthScore: value },
                  }),
                0,
                100,
                1,
              )}
            </div>
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Automation + Compliance</h2>
          <p className="panel-subtitle">Lead routing, notifications, and TCPA checks</p>
          <div className="kv-list">
            <div className="kv-row">
              <span className="kv-key">High-intent lead alerts</span>
              <span className="status-badge status-success">Enabled</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Auto CRM push (High Intent)</span>
              <span className="status-badge status-success">Enabled</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Low-intent nurture enrollment</span>
              <span className="status-badge status-info">Enabled</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">TCPA import validation</span>
              <span className="status-badge status-success">Strict</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Custom report scheduling</span>
              <span className="status-badge status-info">Enabled</span>
            </div>
          </div>
        </article>
      </div>

      <article className="surface panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel-title">Campaign-Specific Scoring Rules</h2>
        <p className="panel-subtitle">Source-aware scoring priorities for each campaign profile</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Source</th>
                <th>Source boost</th>
                <th>Email opens</th>
                <th>Email clicks</th>
                <th>Ad interactions</th>
                <th>Form submissions</th>
              </tr>
            </thead>
            <tbody>
              {scoringConfig.campaignRules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.label}</td>
                  <td>{rule.source}</td>
                  <td>{rule.sourceWeightBoost}</td>
                  <td>{rule.behaviorWeights.emailOpens}</td>
                  <td>{rule.behaviorWeights.emailClicks}</td>
                  <td>{rule.behaviorWeights.adInteractions}</td>
                  <td>{rule.behaviorWeights.formSubmissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="surface panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel-title">Integrations</h2>
        <p className="panel-subtitle">CRM, ad platform, email, and enrichment sync status</p>
        <p className="subtle">Adapter messages: {adapterMessages}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Sync</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <tr key={integration.key}>
                  <td>{integration.label}</td>
                  <td>{integration.category}</td>
                  <td>
                    <span
                      className={`status-badge ${integration.connected ? 'status-success' : 'status-warning'}`}
                    >
                      {integration.statusText}
                    </span>
                  </td>
                  <td>{integration.lastSyncAt}</td>
                  <td>
                    <button type="button" className="btn">
                      {integration.connected ? 'Manage' : 'Connect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
