import { Link, useParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { getDisplayName } from '../utils/metrics'
import { StatusBadge } from '../components/StatusBadge'

export const LeadDetailPage = () => {
  const { leadId = '' } = useParams()
  const { leads } = useAppData()
  const lead = leads.find((item) => item.id === decodeURIComponent(leadId))

  if (!lead) {
    return (
      <section className="panel empty-panel">
        <h1>Lead not found</h1>
        <p>This lead may have been filtered out or does not exist.</p>
        <Link className="text-link" to="/leads">
          Back to leads
        </Link>
      </section>
    )
  }

  return (
    <section className="page-grid lead-detail-grid">
      <header className="lead-header panel">
        <div className="avatar avatar-lg">{`${lead.firstName[0] ?? ''}${lead.lastName[0] ?? ''}`}</div>
        <div className="lead-title-stack">
          <h1>{getDisplayName(lead)}</h1>
          <p>
            {lead.cdpProfile?.company ?? lead.email} · {lead.id}
          </p>
          <div className="button-row">
            <button type="button" className="ghost-btn">
              Set reminder
            </button>
            <button type="button" className="ghost-btn">
              Send nurture
            </button>
            <button type="button" className="primary-btn">
              Push to CRM
            </button>
          </div>
        </div>
      </header>

      <article className="panel">
        <h2>Contact</h2>
        <dl className="definition-list">
          <div>
            <dt>Email</dt>
            <dd>{lead.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{lead.phone}</dd>
          </div>
          <div>
            <dt>Company</dt>
            <dd>{lead.cdpProfile?.company ?? 'N/A'}</dd>
          </div>
          <div>
            <dt>Units segment</dt>
            <dd>{lead.unitSegment}</dd>
          </div>
          <div>
            <dt>Multifamily owner</dt>
            <dd>{lead.multifamilyOwner ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{lead.source}</dd>
          </div>
          <div>
            <dt>Campaign</dt>
            <dd>{lead.campaignName}</dd>
          </div>
          <div>
            <dt>TCPA consent</dt>
            <dd>{lead.tcpaConsentVerified ? '✓ Verified' : 'Not verified'}</dd>
          </div>
        </dl>
      </article>

      <article className="surface panel">
        <h2>Lead Score</h2>
        <p className="score-big">{lead.score}/100</p>
        <StatusBadge status={lead.status} />
      </article>

      <article className="panel">
        <h2>AI Conversion Forecast</h2>
        <p className="subtle">
          Forecast based on engagement patterns, segment behavior, and historical conversion data.
        </p>
        <div className="forecast-grid">
          <div>
            <span>7 days</span>
            <strong>{lead.forecast.day7}%</strong>
          </div>
          <div>
            <span>14 days</span>
            <strong>{lead.forecast.day14}%</strong>
          </div>
          <div>
            <span>30 days</span>
            <strong>{lead.forecast.day30}%</strong>
          </div>
        </div>
      </article>

      <article className="panel">
        <h2>CDP Enrichment Match</h2>
        {lead.cdpProfile ? (
          <dl className="definition-list">
            <div>
              <dt>Matched</dt>
              <dd>Yes</dd>
            </div>
            <div>
              <dt>Job title</dt>
              <dd>{lead.cdpProfile.jobTitle}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{lead.cdpProfile.company}</dd>
            </div>
            <div>
              <dt>Industry</dt>
              <dd>{lead.cdpProfile.industry}</dd>
            </div>
            <div>
              <dt>Seniority</dt>
              <dd>{lead.cdpProfile.seniority}</dd>
            </div>
            <div>
              <dt>Net worth</dt>
              <dd>{lead.cdpProfile.netWorth}</dd>
            </div>
            <div>
              <dt>Income range</dt>
              <dd>{lead.cdpProfile.incomeRange}</dd>
            </div>
            <div>
              <dt>Age range</dt>
              <dd>{lead.cdpProfile.ageRange}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{lead.cdpProfile.location}</dd>
            </div>
          </dl>
        ) : (
          <p className="subtle">No matching profile found for this lead.</p>
        )}
      </article>

      <article className="panel timeline-panel">
        <h2>Activity Timeline</h2>
        <ul className="timeline">
          {lead.activityTimeline.map((event) => (
            <li key={event.id}>
              <p>{event.label}</p>
              <span>{event.timestamp}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>CRM Sync</h2>
        <p className="subtle">
          Push this lead to your connected CRM with one click.
        </p>
        <div className="button-row">
          <button type="button" className="ghost-btn">
            Salesforce
          </button>
          <button type="button" className="ghost-btn">
            HubSpot
          </button>
        </div>
      </article>
    </section>
  )
}
