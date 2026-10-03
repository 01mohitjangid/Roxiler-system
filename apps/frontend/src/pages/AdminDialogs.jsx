import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FormError, SelectField } from '@/components/Field'
import { RoleBadge } from '@/components/RoleBadge'
import { StarRating } from '@/components/StarRating'
import { useForm } from '@/hooks/useForm'
import { api } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/roles'

function FormDialog({ title, description, trigger, form, open, setOpen, children }) {
  const onOpenChange = (next) => {
    setOpen(next)
    if (!next) form.reset()
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus aria-hidden />{trigger}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit} className="grid gap-4" noValidate>
          {children}
          <FormError message={form.errors.form} />
          <DialogFooter>
            <Button type="submit" disabled={form.busy}>{form.busy ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AddUserDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const form = useForm(
    { name: '', email: '', address: '', password: '', role: 'user' },
    {
      fields: ['name', 'email', 'address', 'password', 'role'],
      onSubmit: async (values) => {
        await api('/admin/users', { method: 'POST', body: values })
        setOpen(false)
        form.reset()
        onCreated()
      },
    },
  )
  return (
    <FormDialog title="Add user" description="Create a normal user, store owner or admin." trigger="Add user" form={form} open={open} setOpen={setOpen}>
      <Field label="Full name" hint="20 to 60 characters." {...form.bind('name')} />
      <Field label="Email" type="email" {...form.bind('email')} />
      <Field label="Address" hint="Up to 400 characters." {...form.bind('address')} />
      <Field label="Password" type="password" autoComplete="new-password" hint="8 to 16 characters, one uppercase letter and one special character." {...form.bind('password')} />
      <SelectField
        id="role"
        label="Role"
        value={form.values.role}
        onChange={(v) => form.set('role', v)}
        options={Object.entries(ROLE_LABELS)}
        error={form.errors.role}
      />
    </FormDialog>
  )
}

export function AddStoreDialog({ onCreated }) {
  const [owners, setOwners] = useState([])
  const [ownersError, setOwnersError] = useState('')
  const [open, setOpen] = useState(false)
  const form = useForm(
    { name: '', email: '', address: '', owner_id: 'none' },
    {
      fields: ['name', 'email', 'address'],
      ruleFor: { name: 'storeName' },
      onSubmit: async ({ owner_id, ...values }) => {
        await api('/admin/stores', { method: 'POST', body: { ...values, owner_id: owner_id === 'none' ? null : Number(owner_id) } })
        setOpen(false)
        form.reset()
        onCreated()
      },
    },
  )

  useEffect(() => {
    if (!open) return
    api('/admin/users?role=owner').then(
      ({ users }) => {
        setOwnersError('')
        setOwners(users.filter((u) => !u.store_id))
      },
      (e) => setOwnersError(`Could not load owners: ${e.message}`),
    )
  }, [open])

  return (
    <FormDialog title="Add store" description="Register a store, and optionally link its owner." trigger="Add store" form={form} open={open} setOpen={setOpen}>
      <Field label="Store name" {...form.bind('name')} />
      <Field label="Store email" type="email" {...form.bind('email')} />
      <Field label="Address" hint="Up to 400 characters." {...form.bind('address')} />
      <SelectField
        id="owner_id"
        label="Owner"
        value={form.values.owner_id}
        onChange={(v) => form.set('owner_id', v)}
        options={[['none', 'No owner'], ...owners.map((o) => [String(o.id), `${o.name} (${o.email})`])]}
        error={form.errors.owner_id}
      />
      <FormError message={ownersError} />
    </FormDialog>
  )
}

export function UserDetailDialog({ userId, onClose }) {
  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>Account information for this user.</DialogDescription>
        </DialogHeader>
        {userId && <UserDetail key={userId} userId={userId} />}
      </DialogContent>
    </Dialog>
  )
}

function UserDetail({ userId }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/admin/users/${userId}`).then(({ user }) => setUser(user), (e) => setError(e.message))
  }, [userId])

  return (
    <>
      <FormError message={error} />
      {!user && !error && <p role="status" className="text-sm text-muted-foreground">Loading…</p>}
      {user && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{user.name}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="break-words">{user.address}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd><RoleBadge role={user.role} /></dd>
          {user.role === 'owner' && (
            <>
              <dt className="text-muted-foreground">Store rating</dt>
              <dd>{user.store_id ? <StarRating value={user.rating} /> : 'No store linked'}</dd>
            </>
          )}
        </dl>
      )}
    </>
  )
}
