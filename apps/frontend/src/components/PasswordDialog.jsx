import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FormError } from '@/components/Field'
import { useForm } from '@/hooks/useForm'
import { api } from '@/lib/api'

export function PasswordDialog({ open, setOpen }) {
  const [done, setDone] = useState(false)
  const form = useForm(
    { current_password: '', new_password: '' },
    {
      fields: ['new_password'],
      ruleFor: { new_password: 'password' },
      onSubmit: async (values) => {
        await api('/auth/password', { method: 'PATCH', body: values })
        setDone(true)
        form.reset()
      },
    },
  )

  const onOpenChange = (next) => {
    setOpen(next)
    if (!next) {
      form.reset()
      setDone(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>8 to 16 characters, with one uppercase letter and one special character.</DialogDescription>
        </DialogHeader>
        {done ? (
          <p role="status" className="text-sm">Your password was updated.</p>
        ) : (
          <form id="password-form" onSubmit={form.handleSubmit} className="grid gap-4" noValidate>
            <Field label="Current password" type="password" autoComplete="current-password" {...form.bind('current_password')} />
            <Field label="New password" type="password" autoComplete="new-password" {...form.bind('new_password')} />
            <FormError message={form.errors.form} />
          </form>
        )}
        <DialogFooter>
          {done ? (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          ) : (
            <Button type="submit" form="password-form" disabled={form.busy}>
              {form.busy ? 'Saving…' : 'Update password'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
