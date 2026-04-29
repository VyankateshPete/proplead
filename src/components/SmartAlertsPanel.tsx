import type { AlertEvent } from '../types'

interface SmartAlertsPanelProps {
  alerts: AlertEvent[]
}

export const SmartAlertsPanel = ({ alerts }: SmartAlertsPanelProps) => {
  if (alerts.length === 0) {
    return (
      <article className="surface panel">
        <h2 className="panel-title">Smart Alerts</h2>
        <p className="panel-subtitle">No urgent lead notifications at the moment.</p>
      </article>
    )
  }

  return (
    <article className="surface panel">
      <h2 className="panel-title">Smart Alerts</h2>
      <div className="kv-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="metric-tile">
            <div className="button-row">
              <span className={`status-badge status-${alert.severity}`}>{alert.severity}</span>
            </div>
            <p className="lead-name">{alert.title}</p>
            <p className="subtle">{alert.description}</p>
            <p className="kv-key">Action: {alert.action}</p>
          </div>
        ))}
      </div>
    </article>
  )
}
