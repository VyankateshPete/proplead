import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { KpiCard } from '../components/KpiCard'
import { useAppData } from '../context/AppDataContext'
import { getCampaignTotals, getCampaignTrendSeries } from '../utils/metrics'

export const CampaignsPage = () => {
  const { campaigns, leads } = useAppData()
  const totals = getCampaignTotals(campaigns)
  const trendSeries = getCampaignTrendSeries(leads).slice(-14)
  const comparisonRows = campaigns.map((campaign) => ({
    source: campaign.source,
    cpl: campaign.cpl,
    conversionRate: campaign.conversionRate,
    leads: campaign.leads,
  }))

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
        <p className="panel-subtitle">Line trend with date-based volume and conversion</p>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde2e8" />
              <XAxis dataKey="day" stroke="#4B4B4B" />
              <YAxis yAxisId="left" stroke="#4B4B4B" />
              <YAxis yAxisId="right" orientation="right" stroke="#4B4B4B" domain={[0, 100]} />
              <Tooltip />
              <Line
                yAxisId="left"
                dataKey="leadVolume"
                stroke="#003366"
                strokeWidth={2}
                name="Lead volume"
                dot={false}
              />
              <Line
                yAxisId="right"
                dataKey="conversionRate"
                stroke="#00A651"
                strokeWidth={2}
                name="Conversion rate %"
                dot={false}
              />
            </LineChart>
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

      <article className="surface panel" style={{ marginTop: '1rem' }}>
        <h2 className="panel-title">Meta vs Email Comparison</h2>
        <p className="panel-subtitle">Cost per lead, conversion rate, and volume by source</p>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde2e8" />
              <XAxis dataKey="source" stroke="#4B4B4B" />
              <YAxis stroke="#4B4B4B" />
              <Tooltip />
              <Bar dataKey="cpl" fill="#003366" name="CPL ($)" />
              <Bar dataKey="conversionRate" fill="#00A651" name="Conversion %" />
              <Bar dataKey="leads" fill="#7DA4CE" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  )
}
