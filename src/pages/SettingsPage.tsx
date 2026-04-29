export const SettingsPage = () => {
  return (
    <section>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure scoring, segmentation, and integrations</p>
      </header>

      <div className="three-col">
        <article className="surface panel">
          <h2 className="panel-title">Lead Scoring Weights</h2>
          <p className="panel-subtitle">
            Define how behavioral and demographic signals contribute to the score
          </p>
          <div className="kv-list">
            <div className="kv-row">
              <span className="kv-key">Behavioral signals</span>
              <strong>60%</strong>
            </div>
            <div className="kv-row">
              <span className="kv-key">Demographic signals</span>
              <strong>40%</strong>
            </div>
            <div className="kv-row">
              <span className="kv-key">High-intent threshold</span>
              <strong>80 pts</strong>
            </div>
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Notifications</h2>
          <p className="panel-subtitle">Choose when and how the team gets notified</p>
          <div className="kv-list">
            <div className="kv-row">
              <span className="kv-key">High-intent lead alerts</span>
              <span className="status-badge status-success">Enabled</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Daily digest</span>
              <span className="status-badge status-info">Enabled</span>
            </div>
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Compliance</h2>
          <p className="panel-subtitle">TCPA consent and opt-out handling</p>
          <p style={{ fontSize: '0.86rem', color: '#5f6c78' }}>
            Strict TCPA verification is enabled. Opted-out leads are automatically excluded from
            email and ad retargeting workflows.
          </p>
        </article>
      </div>

      <article className="surface panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel-title">Integrations</h2>
        <p className="panel-subtitle">Connect your CRM and ad platforms</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salesforce</td>
                <td>
                  <span className="status-badge status-success">Connected</span>
                </td>
                <td>
                  <button type="button" className="btn">
                    Manage
                  </button>
                </td>
              </tr>
              <tr>
                <td>HubSpot</td>
                <td>
                  <span className="status-badge status-warning">Not connected</span>
                </td>
                <td>
                  <button type="button" className="btn">
                    Connect
                  </button>
                </td>
              </tr>
              <tr>
                <td>Meta Ads</td>
                <td>
                  <span className="status-badge status-success">Connected</span>
                </td>
                <td>
                  <button type="button" className="btn">
                    Manage
                  </button>
                </td>
              </tr>
              <tr>
                <td>Mailchimp</td>
                <td>
                  <span className="status-badge status-success">Connected</span>
                </td>
                <td>
                  <button type="button" className="btn">
                    Manage
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
