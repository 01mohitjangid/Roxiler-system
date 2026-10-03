import { CalendarClock, MessageSquare, Star, Store, UserRound } from 'lucide-react'
import { DataList } from '@/components/DataList'
import { FormError } from '@/components/Field'
import { IconTile } from '@/components/IconTile'
import { PageHeader } from '@/components/PageHeader'
import { StarRating } from '@/components/StarRating'
import { StatCard } from '@/components/StatCard'
import { StoreBackdrop } from '@/components/StoreBackdrop'
import { useList, useSort } from '@/hooks/useList'

export function OwnerPage() {
  const [sort, toggleSort] = useSort('updated_at', 'desc')
  const { data, error } = useList('/owner/dashboard', sort)

  if (error) return <FormError message={error} />
  if (!data) return <p role="status" className="text-sm text-muted-foreground">Loading…</p>
  if (!data.store) {
    return (
      <section className="grid gap-6">
        <StoreBackdrop />
        <PageHeader title="Your store" description="Your dashboard appears once a store is linked to you." />
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <IconTile icon={Store} className="size-12" iconClassName="size-6" />
          <p className="font-semibold">No store yet</p>
          <p className="text-sm text-muted-foreground">An admin has not linked a store to your account yet.</p>
        </div>
      </section>
    )
  }

  const { store, raters } = data
  const latest = raters.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), '')
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', placement: 'subtitle' },
    { key: 'score', label: 'Rating', render: (r) => <StarRating value={r.score} /> },
    { key: 'updated_at', label: 'Rated on', render: (r) => new Date(r.updated_at).toLocaleDateString() },
  ]

  return (
    <section className="grid gap-6">
      <PageHeader title={store.name} description={store.address} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Star} label="Average rating" value={store.rating?.toFixed(1) ?? '—'} hint={<StarRating value={store.rating} />} />
        <StatCard icon={MessageSquare} label="Total ratings" value={store.rating_count} />
        <StatCard icon={CalendarClock} label="Latest rating" value={latest ? new Date(latest).toLocaleDateString() : '—'} />
      </div>
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Who rated your store</h2>
        <DataList icon={UserRound} emptyArt columns={columns} rows={raters} sort={sort} onSort={toggleSort} empty="No ratings yet." />
      </div>
    </section>
  )
}
