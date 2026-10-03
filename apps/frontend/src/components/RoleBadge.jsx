import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/roles'

export function RoleBadge({ role }) {
  return <Badge variant={role === 'admin' ? 'default' : role === 'owner' ? 'secondary' : 'outline'}>{ROLE_LABELS[role]}</Badge>
}
