import { Link } from 'react-router-dom'
import type { Lead } from '../types'
import { getInitials } from '../utils/metrics'
import { StatusBadge } from './StatusBadge'

interface LeadRowCardProps {
  lead: Lead
}

export const LeadRowCard = ({ lead }: LeadRowCardProps) => {
  const companyLabel = lead.cdpProfile?.company || lead.email

  return (
    <article className="lead-row-card">
      <div className="lead-avatar">{getInitials(lead)}</div>
      <div className="lead-summary">
        <h3>{`${lead.firstName} ${lead.lastName}`.trim()}</h3>
        <p>{companyLabel}</p>
      </div>
      <div className="lead-meta">
        <p>{lead.unitSegment}</p>
        <small>{lead.multifamilyOwner ? 'MF confirmed' : 'Not MF'}</small>
      </div>
      <div className="lead-score">{lead.score}</div>
      <StatusBadge status={lead.status} />
      <Link to={`/leads/${encodeURIComponent(lead.id)}`} className="link-button">
        View
      </Link>
    </article>
  )
}
