import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { filterByRange, getReferenceDate } from '../utils/filters'
import { exportLeadsToCsv } from '../lib/leadData'
import type { DateRangeFilter, LeadSource, LeadStatus } from '../types'

const downloadCsv = (filename: string, csvText: string): void => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const ReportsPage = () => {
  const { leads } = useAppData()
  const [range, setRange] = useState<DateRangeFilter>('month')
  const [source, setSource] = useState<'all' | LeadSource>('all')
  const [status, setStatus] = useState<'all' | LeadStatus>('all')

  const reportLeads = useMemo(() => {
    const now = getReferenceDate(leads)
    return filterByRange(leads, range, now).filter((lead) => {
      if (source !== 'all' && lead.source !== source) return false
      if (status !== 'all' && lead.status !== status) return false
      return true
    })
  }, [leads, range, source, status])

  const groupedBySource = useMemo(
    () =>
      ['Meta - Facebook', 'Meta - Instagram', 'Email'].map((group) => ({
        source: group,
        leads: reportLeads.filter((lead) => lead.source === group).length,
      })),
    [reportLeads],
  )

  return (
    <section>
      <header className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Custom reporting by timeframe, source, and lead status</p>
      </header>

      <div className="filters-bar">
        <select className="input" value={range} onChange={(event) => setRange(event.target.value as DateRangeFilter)}>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="quarter">Quarter</option>
        </select>
        <select className="input" value={source} onChange={(event) => setSource(event.target.value as 'all' | LeadSource)}>
          <option value="all">All sources</option>
          <option value="Meta - Facebook">Meta Facebook</option>
          <option value="Meta - Instagram">Meta Instagram</option>
          <option value="Email">Email</option>
        </select>
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as 'all' | LeadStatus)}>
          <option value="all">All statuses</option>
          <option value="High Intent">High Intent</option>
          <option value="Qualified">Qualified</option>
          <option value="Nurturing">Nurturing</option>
          <option value="Low Intent">Low Intent</option>
          <option value="Opted Out">Opted Out</option>
        </select>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => downloadCsv('proplead-custom-report.csv', exportLeadsToCsv(reportLeads))}
        >
          Export Report CSV
        </button>
      </div>

      <div className="two-col">
        <article className="surface panel">
          <h2 className="panel-title">Report Summary</h2>
          <div className="metric-stack">
            <div className="metric-tile">
              <p className="kv-key">Leads in scope</p>
              <p className="metric-value">{reportLeads.length}</p>
            </div>
            <div className="metric-tile">
              <p className="kv-key">High intent</p>
              <p className="metric-value">
                {reportLeads.filter((lead) => lead.status === 'High Intent').length}
              </p>
            </div>
            <div className="metric-tile">
              <p className="kv-key">Qualified+</p>
              <p className="metric-value">
                {
                  reportLeads.filter(
                    (lead) => lead.status === 'Qualified' || lead.status === 'High Intent',
                  ).length
                }
              </p>
            </div>
          </div>
        </article>

        <article className="surface panel">
          <h2 className="panel-title">Leads by Source</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Leads</th>
                </tr>
              </thead>
              <tbody>
                {groupedBySource.map((row) => (
                  <tr key={row.source}>
                    <td>{row.source}</td>
                    <td>{row.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}
