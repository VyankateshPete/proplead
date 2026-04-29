import type { LeadStatus } from '../types'
import { toStatusTone } from '../utils/metrics'

interface StatusBadgeProps {
  status: LeadStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`status-badge status-${toStatusTone(status)}`}>{status}</span>
)
