import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '../components/KpiCard'
import { useAppData } from '../context/AppDataContext'
import { getCampaignTotals } from '../utils/metrics'

export const CampaignsPage = () => {
  const { campaigns } = useAppData()
  const totals = getCampaignTotals(campaigns)

  return (
    <section>
      <header className="page-header">
        <h1 className="page-title">Campaigns</h1>
        <p className="page-subtitle">Performance across Meta and email</p>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Total Spend" value={`$${totals.spend.toLocaleString()}`} trend="" />
        <KpiCard title="Leads Generated" value={totals.leads.toString()} trend="" />
        <KpiCard title="Avg CPL" value={`$${totals.cpl}`} trend="" />
        <KpiCard title="Active Campaigns" value={totals.active.toString()} trend="" />
      </div>

      <article className="surface panel">
        <h2 className="panel-title">Lead generation trend</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={campaigns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde2e8" />
              <XAxis dataKey="source" stroke="#4B4B4B" />
              <YAxis stroke="#4B4B4B" />
              <Tooltip />
              <Bar dataKey="leads" fill="#003366" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="surface panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel-title">Campaign Breakdown</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Source</th>
                <th>Leads</th>
                <th>CPL</th>
                <th>CTR</th>
                <th>Conv. %</th>
                <th>Spend</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={`${campaign.campaign}-${campaign.source}`}>
                  <td>{campaign.campaign}</td>
                  <td>{campaign.source}</td>
                  <td>{campaign.leads}</td>
                  <td>${campaign.cpl}</td>
                  <td>{campaign.ctr}%</td>
                  <td>{campaign.conversionRate}%</td>
                  <td>${campaign.spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
