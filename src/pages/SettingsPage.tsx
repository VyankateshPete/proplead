import { useMemo } from 'react'
import { useScoringConfig } from '../context/ScoringConfigContext'
import type { IntegrationConnection, ScoringConfig } from '../types'

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
    () => [
      {
        key: 'salesforce',
        label: 'Salesforce',
        connected: true,
        statusText: 'Connected',
        lastSyncAt: '2m ago',
        category: 'CRM',
      },
      {
        key: 'hubspot',
        label: 'HubSpot',
        connected: false,
        statusText: 'Not connected',
        lastSyncAt: 'Never',
        category: 'CRM',
      },
      {
        key: 'meta',
        label: 'Meta Lead Gen API',
        connected: true,
        statusText: 'Connected',
        lastSyncAt: '5m ago',
        category: 'Advertising',
      },
      {
        key: 'mailchimp',
        label: 'Mailchimp',
        connected: true,
        statusText: 'Connected',
        lastSyncAt: '4m ago',
        category: 'Email',
      },
      {
        key: 'activecampaign',
        label: 'ActiveCampaign',
        connected: false,
        statusText: 'Optional',
        lastSyncAt: 'Never',
        category: 'Email',
      },
      {
        key: 'zoho',
        label: 'Zoho CRM',
        connected: false,
        statusText: 'Optional',
        lastSyncAt: 'Never',
        category: 'CRM',
      },
      {
        key: 'pipedrive',
        label: 'Pipedrive',
        connected: false,
        statusText: 'Optional',
        lastSyncAt: 'Never',
        category: 'CRM',
      },
      {
        key: 'clearbit',
        label: 'Clearbit',
        connected: true,
        statusText: 'Connected',
        lastSyncAt: '6m ago',
        category: 'Enrichment',
      },
      {
        key: 'zoominfo',
        label: 'ZoomInfo',
        connected: false,
        statusText: 'Onboarding',
        lastSyncAt: 'Pending',
        category: 'Enrichment',
      },
      {
        key: 'linkedin',
        label: 'LinkedIn Enrichment',
        connected: true,
        statusText: 'Connected',
        lastSyncAt: '8m ago',
        category: 'Enrichment',
      },
    ],
    [],
  )

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
        <h2 className="panel-title">Integrations</h2>
        <p className="panel-subtitle">CRM, ad platform, email, and enrichment sync status</p>
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
