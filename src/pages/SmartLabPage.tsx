import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { getAbTestResults, getLeadAnomalies, getSmartAlerts } from '../utils/smartFeatures'

const unitToCount = (value: string): number => {
  if (value === '1-5 units') return 3
  if (value === '6-10 units') return 8
  if (value === '11-20 units') return 15
  return 30
}

export const SmartLabPage = () => {
  const { leads } = useAppData()
  const [unitsInput, setUnitsInput] = useState<'1-5 units' | '6-10 units' | '11-20 units' | '20+ units'>(
    '11-20 units',
  )
  const [engagementInput, setEngagementInput] = useState<number>(7)
  const [sourceInput, setSourceInput] = useState<'Meta' | 'Email'>('Meta')
  const [coverageInput, setCoverageInput] = useState<'Basic' | 'Standard' | 'Premium'>('Standard')
  const [budgetInput, setBudgetInput] = useState<number>(1200)

  const alerts = useMemo(() => getSmartAlerts(leads), [leads])
  const abResults = useMemo(() => getAbTestResults(leads), [leads])
  const anomalies = useMemo(() => getLeadAnomalies(leads), [leads])

  const chatbotResult = useMemo(() => {
    const units = unitToCount(unitsInput)
    const coverageBoost = coverageInput === 'Premium' ? 10 : coverageInput === 'Standard' ? 6 : 2
    const budgetBoost = Math.min(12, Math.round(budgetInput / 400))
    const score = Math.min(
      100,
      Math.round(units * 2.2 + engagementInput * 5 + (sourceInput === 'Meta' ? 8 : 4) + coverageBoost + budgetBoost),
    )
    const classification = score >= 80 ? 'High Intent' : score >= 60 ? 'Qualified' : 'Nurturing'
    const nextAction =
      classification === 'High Intent'
        ? 'Route to Sales and auto-push to CRM'
        : classification === 'Qualified'
          ? 'Assign AE and send proposal follow-up'
          : 'Enroll into context-aware nurture sequence'

    return { score, classification, nextAction }
  }, [unitsInput, engagementInput, sourceInput, coverageInput, budgetInput])

  return (
    <section>
      <header className="page-header">
        <h1 className="page-title">Smart Lab</h1>
        <p className="page-subtitle">AI automation, A/B insights, and conversational qualification</p>
      </header>

      <div className="two-col">
        <article className="surface panel">
          <h2 className="panel-title">AI-Powered Alerts</h2>
          <p className="panel-subtitle">Real-time lead quality and engagement alerting</p>
          <div className="kv-list">
            {alerts.map((alert) => (
              <div key={alert.id} className="metric-tile">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                  <p className="panel-title" style={{ fontSize: '0.92rem' }}>
                    {alert.title}
                  </p>
                  <span className={`status-badge status-${alert.severity}`}>{alert.severity}</span>
                </div>
                <p className="subtle">{alert.description}</p>
                <p className="kv-key">{alert.action}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Anomaly Detection Console</h2>
          <p className="panel-subtitle">Source spikes, validation irregularities, and duplicate patterns</p>
          <div className="kv-list">
            {anomalies.length === 0 ? (
              <p className="subtle">No anomalies detected in current lead set.</p>
            ) : (
              anomalies.map((anomaly) => (
                <div key={anomaly.id} className="metric-tile">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                    <p className="panel-title" style={{ fontSize: '0.92rem' }}>
                      {anomaly.title}
                    </p>
                    <span className={`status-badge status-${anomaly.severity}`}>{anomaly.severity}</span>
                  </div>
                  <p className="subtle">{anomaly.description}</p>
                  <p className="kv-key">Affected leads: {anomaly.affectedCount}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="two-col">
        <article className="surface panel">
          <h2 className="panel-title">Smart A/B Testing Center</h2>
          <p className="panel-subtitle">Automated optimization across forms, emails, and creatives</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Control</th>
                  <th>Variant</th>
                  <th>Winner</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                {abResults.map((result) => (
                  <tr key={result.id}>
                    <td>{result.experiment}</td>
                    <td>{result.control}</td>
                    <td>{result.variant}</td>
                    <td>{result.winner}</td>
                    <td>{result.liftPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="surface panel">
          <h2 className="panel-title">Continuous Learning Sandbox</h2>
          <p className="panel-subtitle">See how behavior and source context can adapt lead scoring</p>
          <div className="metric-stack">
            <div className="metric-tile">
              <p className="kv-key">Learning signals</p>
              <p className="metric-value">{Math.round((leads.filter((lead) => lead.learning.adjustment !== 0).length / Math.max(leads.length, 1)) * 100)}%</p>
              <p className="subtle">of leads received score adaptation</p>
            </div>
            <div className="metric-tile">
              <p className="kv-key">Avg confidence</p>
              <p className="metric-value">
                {Math.round(
                  (leads.reduce((accumulator, lead) => accumulator + lead.learning.confidence, 0) /
                    Math.max(leads.length, 1)) *
                    100,
                )}
                %
              </p>
              <p className="subtle">historical pattern confidence</p>
            </div>
            <div className="metric-tile">
              <p className="kv-key">Mean adjustment</p>
              <p className="metric-value">
                {(
                  leads.reduce((accumulator, lead) => accumulator + lead.learning.adjustment, 0) /
                  Math.max(leads.length, 1)
                ).toFixed(1)}
              </p>
              <p className="subtle">score points from adaptation loop</p>
            </div>
          </div>
        </article>
      </div>

      <article className="surface panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel-title">Conversational Qualification Chatbot</h2>
        <p className="panel-subtitle">Simulate real-time qualification from chat responses</p>
        <div className="filters-bar">
          <label className="kv-key">Units</label>
          <select
            className="input"
            value={unitsInput}
            onChange={(event) =>
              setUnitsInput(event.target.value as '1-5 units' | '6-10 units' | '11-20 units' | '20+ units')
            }
          >
            <option>1-5 units</option>
            <option>6-10 units</option>
            <option>11-20 units</option>
            <option>20+ units</option>
          </select>
          <label className="kv-key">Engagement score</label>
          <input
            className="input"
            type="number"
            min={0}
            max={10}
            value={engagementInput}
            onChange={(event) => setEngagementInput(Number(event.target.value))}
          />
          <label className="kv-key">Source</label>
          <select
            className="input"
            value={sourceInput}
            onChange={(event) => setSourceInput(event.target.value as 'Meta' | 'Email')}
          >
            <option value="Meta">Meta</option>
            <option value="Email">Email</option>
          </select>
          <label className="kv-key">Current coverage</label>
          <select
            className="input"
            value={coverageInput}
            onChange={(event) => setCoverageInput(event.target.value as 'Basic' | 'Standard' | 'Premium')}
          >
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
          <label className="kv-key">Monthly budget ($)</label>
          <input
            className="input"
            type="number"
            min={200}
            max={8000}
            step={50}
            value={budgetInput}
            onChange={(event) => setBudgetInput(Number(event.target.value))}
          />
        </div>
        <div className="metric-stack">
          <div className="metric-tile">
            <p className="kv-key">Predicted score</p>
            <p className="metric-value">{chatbotResult.score}</p>
          </div>
          <div className="metric-tile">
            <p className="kv-key">Intent classification</p>
            <p className="metric-value" style={{ fontSize: '1rem' }}>
              {chatbotResult.classification}
            </p>
          </div>
          <div className="metric-tile">
            <p className="kv-key">Next best action</p>
            <p className="subtle">{chatbotResult.nextAction}</p>
          </div>
        </div>
      </article>
    </section>
  )
}
