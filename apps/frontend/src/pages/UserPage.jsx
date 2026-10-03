import { useState } from 'react'
import { Check, Store } from 'lucide-react'
import { DataList } from '@/components/DataList'
import { PageHeader } from '@/components/PageHeader'
import { FormError, SearchInput } from '@/components/Field'
import { StarRating } from '@/components/StarRating'
import { useList, useSort } from '@/hooks/useList'
import { api } from '@/lib/api'

export function UserPage() {
  const [filters, setFilters] = useState({ name: '', address: '' })
  const [sort, toggleSort] = useSort('name')
  const { data, error, refresh } = useList('/stores', { ...filters, ...sort })
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)
  const [rateError, setRateError] = useState('')

  async function rate(storeId, score) {
    setSaving(storeId)
    setRateError('')
    try {
      await api(`/stores/${storeId}/rating`, { method: 'PUT', body: { score } })
      refresh()
      setSaved(storeId)
      setTimeout(() => setSaved((id) => (id === storeId ? null : id)), 1800)
    } catch (e) {
      setRateError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Store' },
    { key: 'address', label: 'Address', placement: 'subtitle' },
    { key: 'rating', label: 'Overall rating', render: (s) => <StarRating value={s.rating} /> },
    {
      key: 'my_rating',
      label: 'Your rating',
      placement: 'footer',
      render: (s) => (
        <div className="flex items-center gap-2">
          <StarRating
            value={s.my_rating}
            onRate={(n) => rate(s.id, n)}
            disabled={saving === s.id}
            label={`Your rating for ${s.name}`}
          />
          {saved === s.id ? (
            <span role="status" className="page-enter inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Check className="size-3.5" aria-hidden />
              Saved
            </span>
          ) : (
            !s.my_rating && <span className="text-xs text-muted-foreground">Not rated</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <section className="grid gap-6">
      <PageHeader title="Stores" description="Find a store and rate it from 1 to 5 stars." />
      <div className="grid gap-3 sm:grid-cols-2">
        <SearchInput label="Search by name" value={filters.name} onChange={(name) => setFilters((f) => ({ ...f, name }))} />
        <SearchInput label="Search by address" value={filters.address} onChange={(address) => setFilters((f) => ({ ...f, address }))} />
      </div>
      <FormError message={error || rateError} />
      <DataList icon={Store} emptyArt={!filters.name && !filters.address} columns={columns} rows={data?.stores ?? null} sort={sort} onSort={toggleSort} empty={filters.name || filters.address ? 'No stores match your search.' : 'No stores yet. An admin needs to add them.'} />
    </section>
  )
}
