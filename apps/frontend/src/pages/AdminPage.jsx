import { useEffect, useState } from 'react'
import { Star, Store, UserRound, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataList } from '@/components/DataList'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { FormError, SearchInput } from '@/components/Field'
import { StarRating } from '@/components/StarRating'
import { useList, useSort } from '@/hooks/useList'
import { api } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/roles'
import { RoleBadge } from '@/components/RoleBadge'
import { AddStoreDialog, AddUserDialog, UserDetailDialog } from './AdminDialogs'

function Overview({ onOpen }) {
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api('/admin/dashboard').then(setCounts, (e) => setError(e.message))
  }, [])

  return (
    <div className="grid gap-4">
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={counts?.users} onClick={() => onOpen('users')} />
        <StatCard icon={Store} label="Total stores" value={counts?.stores} onClick={() => onOpen('stores')} />
        <StatCard icon={Star} label="Total ratings" value={counts?.ratings} />
      </div>
    </div>
  )
}

function useFilters(keys) {
  const [filters, setFilters] = useState(Object.fromEntries(keys.map((k) => [k, ''])))
  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }))
  return [filters, set]
}

function UsersTab() {
  const [filters, set] = useFilters(['name', 'email', 'address', 'role'])
  const [sort, toggleSort] = useSort('name')
  const { data, error, refresh } = useList('/admin/users', { ...filters, ...sort })
  const [viewing, setViewing] = useState(null)

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', placement: 'subtitle' },
    { key: 'address', label: 'Address' },
    { key: 'role', label: 'Role', render: (u) => <RoleBadge role={u.role} /> },
    {
      key: 'rating',
      label: 'Store rating',
      show: (u) => u.role === 'owner',
      render: (u) => (u.store_id ? <StarRating value={u.rating} /> : 'No store yet'),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      placement: 'footer',
      render: (u) => <Button variant="outline" size="sm" onClick={() => setViewing(u.id)}>View</Button>,
    },
  ]

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput label="Filter by name" value={filters.name} onChange={set('name')} />
          <SearchInput label="Filter by email" value={filters.email} onChange={set('email')} />
          <SearchInput label="Filter by address" value={filters.address} onChange={set('address')} />
          <Select value={filters.role || 'all'} onValueChange={(v) => set('role')(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full" aria-label="Filter by role"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <AddUserDialog onCreated={refresh} />
      </div>
      <FormError message={error} />
      <DataList icon={UserRound} emptyArt={!Object.values(filters).some(Boolean)} columns={columns} rows={data?.users ?? null} sort={sort} onSort={toggleSort} empty={Object.values(filters).some(Boolean) ? 'No users match these filters.' : 'No users yet.'} />
      <UserDetailDialog userId={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function StoresTab() {
  const [filters, set] = useFilters(['name', 'email', 'address'])
  const [sort, toggleSort] = useSort('name')
  const { data, error, refresh } = useList('/admin/stores', { ...filters, ...sort })

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', placement: 'subtitle' },
    { key: 'address', label: 'Address' },
    { key: 'rating', label: 'Rating', render: (s) => <StarRating value={s.rating} /> },
  ]

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <SearchInput label="Filter by name" value={filters.name} onChange={set('name')} />
          <SearchInput label="Filter by email" value={filters.email} onChange={set('email')} />
          <SearchInput label="Filter by address" value={filters.address} onChange={set('address')} />
        </div>
        <AddStoreDialog onCreated={refresh} />
      </div>
      <FormError message={error} />
      <DataList icon={Store} emptyArt={!Object.values(filters).some(Boolean)} columns={columns} rows={data?.stores ?? null} sort={sort} onSort={toggleSort} empty={Object.values(filters).some(Boolean) ? 'No stores match these filters.' : 'No stores yet. Use "Add store" to create one.'} />
    </div>
  )
}

export function AdminPage() {
  const [tab, setTab] = useState('overview')
  return (
    <section className="grid gap-6">
      <PageHeader title="Admin dashboard" description="Manage users and stores." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><Overview onOpen={setTab} /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
        <TabsContent value="stores" className="mt-6"><StoresTab /></TabsContent>
      </Tabs>
    </section>
  )
}
