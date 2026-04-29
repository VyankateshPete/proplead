import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { KpiCard } from '../components/KpiCard'
import { FilterTabs } from '../components/FilterTabs'
import { StatusBadge } from '../components/StatusBadge'
import { SmartAlertsPanel } from '../components/SmartAlertsPanel'
import { filterByRange, getReferenceDate } from '../utils/filters'
import {
  getCampaignTrendSeries,
  getGranularSegments,
  getInitials,
  getKpis,
  getLeadVolume,
  getPredictedHighIntentVolume,
  getSourceBreakdown,
} from '../utils/metrics'
import type { DateRangeFilter } from '../types'
import { getSmartAlerts } from '../utils/smartFeatures'

const PIE_COLORS = ['#003366', '#00A651', '#8da8c5']
const SEGMENT_COLORS = ['#C5D9ED', '#7DA4CE', '#3F7BB4', '#003366']

export const DashboardPage = () => {
  const { leads, loading, error } = useAppData()
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('month')

  if (loading) {
    return <p className="loading-state">Loading lead intelligence...</p>
  }

  if (error) {
    return <p className="empty-state">Failed to load dashboard data: {error}</p>
  }

  const now = getReferenceDate(leads)
  const scopedLeads = filterByRange(leads, rangeFilter, now)
  const kpis = getKpis(scopedLeads)
  const sourceBreakdown = getSourceBreakdown(scopedLeads)
  const volume = getLeadVolume(scopedLeads).slice(-14)
  const granularSegments = getGranularSegments(scopedLeads)
  const forecastWindows = getPredictedHighIntentVolume(scopedLeads)
  const campaignTrend = getCampaignTrendSeries(scopedLeads).slice(-14)
  const topLeads = [...scopedLeads].sort((left, right) => right.score - left.score).slice(0, 5)
  const alerts = getSmartAlerts(scopedLeads)

  return (
    <section>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Lead intelligence across Meta and email campaigns</p>
        </div>
        <FilterTabs value={rangeFilter} onChange={setRangeFilter} />
      </header>

      <div className="kpi-grid">
        <KpiCard title="Total Leads" value={kpis.totalLeads.toString()} trend="+12.4% vs last month" />
        <KpiCard title="High Intent" value={kpis.highIntentLeads.toString()} trend="+8.1%" />
        <KpiCard title="Conversion Rate" value={`${kpis.conversionRate}%`} trend="+2.3%" />
        <KpiCard title="Avg Lead Score" value={kpis.avgLeadScore.toString()} trend="+5 pts" />
      </div>

      <SmartAlertsPanel alerts={alerts} />

      <div className="two-col">
        <article className="surface panel">
          <h2>Lead Volume</h2>
          <p className="panel-subtitle">Daily volume · Facebook vs Instagram</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e2ec" />
                <XAxis dataKey="day" tick={{ fill: '#4B4B4B', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#4B4B4B', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Facebook" fill="#003366" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Instagram" fill="#00A651" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface panel">
          <h2>Lead Source</h2>
          <p className="panel-subtitle">Breakdown by channel</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={56}
                  paddingAngle={3}
                >
                  {sourceBreakdown.map((source, index) => (
                    <Cell key={source.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="two-col">
        <article className="surface panel">
          <h2>Granular Lead Segment Breakdown</h2>
          <p className="panel-subtitle">1-5, 6-10, 11-20, and 20+ performance tiers</p>
          <ul className="segment-list">
            {granularSegments.map((segment, index) => (
              <li key={segment.segment}>
                <div className="segment-label">
                  <span
                    className="segment-dot"
                    style={{
                      backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                    }}
                  />
                  {segment.segment}
                </div>
                <div style={{ display: 'grid', textAlign: 'right' }}>
                  <strong>{segment.leads}</strong>
                  <small className="kv-key">{segment.highIntentRate}% high intent</small>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface panel">
          <h2>Recent High-Value Leads</h2>
          <p className="panel-subtitle">Top scoring leads with conversion forecasts</p>
          <ul className="lead-highlight-list">
            {topLeads.map((lead) => (
              <li key={lead.id}>
                <div className="lead-avatar">{getInitials(lead)}</div>
                <div className="lead-highlight-meta">
                  <Link to={`/leads/${encodeURIComponent(lead.id)}`}>
                    {lead.firstName} {lead.lastName}
                  </Link>
                  <span>
                    {lead.zipCode ? `ZIP ${lead.zipCode}` : lead.cdpProfile?.company ?? 'No company'} ·{' '}
                    {lead.unitSegment}
                  </span>
                </div>
                <strong>{lead.score}</strong>
                <StatusBadge status={lead.status} />
                <small className="kv-key">7d {lead.forecast.day7}%</small>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="two-col">
        <article className="surface panel">
          <h2>Predictive Forecast</h2>
          <p className="panel-subtitle">Expected high-intent volume over 7/14/30 days</p>
          <div className="metric-stack">
            {forecastWindows.map((window) => (
              <div className="metric-tile" key={window.window}>
                <p className="kv-key">{window.window}</p>
                <p className="metric-value">{window.predicted}</p>
                <p className="subtle">predicted high-intent leads</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface panel">
          <h2>Campaign Performance Visualization</h2>
          <p className="panel-subtitle">Lead volume and conversion trend over time</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={campaignTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e2ec" />
                <XAxis dataKey="day" tick={{ fill: '#4B4B4B', fontSize: 12 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: '#4B4B4B', fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#4B4B4B', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leadVolume"
                  name="Lead volume"
                  stroke="#003366"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion rate %"
                  stroke="#00A651"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  )
}
