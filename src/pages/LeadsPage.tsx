import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { FilterTabs } from '../components/FilterTabs'
import { LeadRowCard } from '../components/LeadRowCard'
import { useAppData } from '../context/AppDataContext'
import type { DateRangeFilter, LeadSource, LeadStatus } from '../types'
import { filterByRange, getReferenceDate } from '../utils/filters'
import { exportLeadsToCsv } from '../lib/leadData'

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

export const LeadsPage = () => {
  const { leads, loading, error } = useAppData()
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all')
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('month')
  const [healthFilter, setHealthFilter] = useState<'all' | 'Sales Ready' | 'Nurture' | 'Inactive'>('all')
  const [qualityFilter, setQualityFilter] = useState<'all' | 'Excluded' | 'Valid Only'>('all')
  const [search, setSearch] = useState('')

  const referenceDate = getReferenceDate(leads)

  const filteredLeads = useMemo(() => {
    const rangeFiltered = filterByRange(leads, rangeFilter, referenceDate)
    const query = search.trim().toLowerCase()

    return rangeFiltered
      .filter((lead) => {
        if (statusFilter !== 'all' && lead.status !== statusFilter) return false
        if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false
        if (healthFilter !== 'all' && lead.health.classification !== healthFilter) return false
        if (qualityFilter === 'Excluded' && !lead.exclusion.excluded) return false
        if (
          qualityFilter === 'Valid Only' &&
          (!lead.validation.emailValid || !lead.validation.phoneValid || lead.exclusion.excluded)
        ) {
          return false
        }

        if (!query) return true
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase()
        return (
          fullName.includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.id.toLowerCase().includes(query)
        )
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [healthFilter, leads, qualityFilter, rangeFilter, referenceDate, search, sourceFilter, statusFilter])

  if (error) {
    return <p className="loading-state">Failed to load leads: {error}</p>
  }

  return (
    <section>
      <header className="page-header">
        <h1 className="page-title">Leads</h1>
        <p className="page-subtitle">
          {filteredLeads.length} of {leads.length} leads
        </p>
      </header>

      <div className="filters-bar">
        <FilterTabs value={rangeFilter} onChange={setRangeFilter} />
        <select
          className="input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)}
        >
          <option value="all">All statuses</option>
          <option value="High Intent">High Intent</option>
          <option value="Qualified">Qualified</option>
          <option value="Nurturing">Nurturing</option>
          <option value="Low Intent">Low Intent</option>
          <option value="Opted Out">Opted Out</option>
        </select>
        <select
          className="input"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as 'all' | LeadSource)}
        >
          <option value="all">All sources</option>
          <option value="Meta - Facebook">Facebook</option>
          <option value="Meta - Instagram">Instagram</option>
          <option value="Email">Email</option>
        </select>
        <select
          className="input"
          value={healthFilter}
          onChange={(event) =>
            setHealthFilter(event.target.value as 'all' | 'Sales Ready' | 'Nurture' | 'Inactive')
          }
        >
          <option value="all">All health classes</option>
          <option value="Sales Ready">Sales Ready</option>
          <option value="Nurture">Nurture</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          className="input"
          value={qualityFilter}
          onChange={(event) => setQualityFilter(event.target.value as 'all' | 'Excluded' | 'Valid Only')}
        >
          <option value="all">All quality states</option>
          <option value="Valid Only">Valid only</option>
          <option value="Excluded">Excluded only</option>
        </select>
        <input
          className="input"
          type="search"
          placeholder="Search by name, email, or lead ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="button"
          className="btn"
          onClick={() => downloadCsv('proplead-export.csv', exportLeadsToCsv(filteredLeads))}
        >
          Export CSV
        </button>
        <button type="button" className="btn btn-primary">
          Push qualified to CRM
        </button>
      </div>

      {loading ? (
        <p className="loading-state">Loading leads...</p>
      ) : (
        <>
          <div className="lead-list">
            {filteredLeads.map((lead) => (
              <LeadRowCard key={lead.id} lead={lead} />
            ))}
          </div>

          <div className="surface panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>ID</th>
                  <th>Units</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Health</th>
                  <th>Validation</th>
                  <th>TCPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={`table-${lead.id}`}>
                    <td>{`${lead.firstName} ${lead.lastName}`.trim()}</td>
                    <td>{lead.id}</td>
                    <td>{lead.unitSegment}</td>
                    <td>{lead.score}</td>
                    <td>{lead.status}</td>
                    <td>{lead.source.replace('Meta - ', 'Meta ')}</td>
                    <td>{lead.health.score} · {lead.health.classification}</td>
                    <td>{lead.validation.issues.length === 0 ? 'Clean' : lead.validation.issues.length}</td>
                    <td>{lead.compliance.compliant ? 'Compliant' : 'Review'}</td>
                    <td>
                      <Link to={`/leads/${encodeURIComponent(lead.id)}`}>View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
