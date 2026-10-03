import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { IconTile } from '@/components/IconTile'

export function StatCard({ icon, label, value, hint, onClick }) {
  const card = (
    <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
      <CardContent className="flex items-center gap-4">
        <IconTile icon={icon} className="size-11 transition group-hover:bg-primary group-hover:text-primary-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value ?? '…'}</p>
          {hint && <div className="mt-1">{hint}</div>}
        </div>
        {onClick && (
          <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
        )}
      </CardContent>
    </Card>
  )
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${value ?? 'loading'}. Open list`}
      className="group cursor-pointer rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {card}
    </button>
  ) : (
    <div className="group">{card}</div>
  )
}
