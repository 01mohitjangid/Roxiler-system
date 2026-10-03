import { Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FormError } from '@/components/Field'
import { IconTile } from '@/components/IconTile'
import { useForm } from '@/hooks/useForm'
import { api } from '@/lib/api'

function LoginForm({ onLogin }) {
  const form = useForm(
    { email: '', password: '' },
    { onSubmit: async (values) => onLogin(await api('/auth/login', { method: 'POST', body: values })) },
  )
  return (
    <form onSubmit={form.handleSubmit} className="grid gap-4" noValidate>
      <Field label="Email" type="email" autoComplete="email" required {...form.bind('email')} />
      <Field label="Password" type="password" autoComplete="current-password" required {...form.bind('password')} />
      <FormError message={form.errors.form} />
      <Button type="submit" disabled={form.busy}>{form.busy ? 'Logging in…' : 'Log in'}</Button>
    </form>
  )
}

function SignupForm({ onLogin }) {
  const form = useForm(
    { name: '', email: '', address: '', password: '' },
    {
      fields: ['name', 'email', 'address', 'password'],
      onSubmit: async (values) => onLogin(await api('/auth/signup', { method: 'POST', body: values })),
    },
  )
  return (
    <form onSubmit={form.handleSubmit} className="grid gap-4" noValidate>
      <Field label="Full name" autoComplete="name" hint="20 to 60 characters." {...form.bind('name')} />
      <Field label="Email" type="email" autoComplete="email" {...form.bind('email')} />
      <Field label="Address" autoComplete="street-address" hint="Up to 400 characters." {...form.bind('address')} />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="8 to 16 characters, one uppercase letter and one special character."
        {...form.bind('password')}
      />
      <FormError message={form.errors.form} />
      <Button type="submit" disabled={form.busy}>{form.busy ? 'Creating account…' : 'Create account'}</Button>
    </form>
  )
}

export function AuthPage({ onLogin }) {
  return (
    <main className="flex min-h-svh items-start justify-center p-4 pt-8 sm:pt-12">
      <div className="page-enter w-full max-w-md">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <IconTile icon={Store} solid className="size-12 rounded-xl shadow-card-hover" iconClassName="size-6" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Store Ratings</h1>
            <p className="text-sm text-muted-foreground">Discover stores and share how they did.</p>
          </div>
        </div>
        <Card className="shadow-card-hover">
          <Tabs defaultValue="login">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Log in, or create an account to rate stores.</CardDescription>
              <TabsList className="mt-2 grid w-full grid-cols-2">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-2">
              <TabsContent value="login"><LoginForm onLogin={onLogin} /></TabsContent>
              <TabsContent value="signup"><SignupForm onLogin={onLogin} /></TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </main>
  )
}
