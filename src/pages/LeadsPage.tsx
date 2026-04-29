import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { FilterTabs } from '../components/FilterTabs'
import { LeadRowCard } from '../components/LeadRowCard'
import { useAppData } from '../context/AppDataContext'
import type { DateRangeFilter, LeadSource, LeadStatus } from '../types'
import { filterByRange, getReferenceDate } from '../utils/filters'

export const LeadsPage = () => {
  const { leads, loading, error } = useAppData()
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all')
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('month')
  const [search, setSearch] = useState('')

  const referenceDate = getReferenceDate(leads)

  const filteredLeads = useMemo(() => {
    const rangeFiltered = filterByRange(leads, rangeFilter, referenceDate)
    const query = search.trim().toLowerCase()

    return rangeFiltered
      .filter((lead) => {
        if (statusFilter !== 'all' && lead.status !== statusFilter) return false
        if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false

        if (!query) return true
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase()
        return (
          fullName.includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.id.toLowerCase().includes(query)
        )
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [leads, rangeFilter, referenceDate, search, sourceFilter, statusFilter])

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
        <input
          className="input"
          type="search"
          placeholder="Search by name, email, or lead ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="button" className="btn">
          Export
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
