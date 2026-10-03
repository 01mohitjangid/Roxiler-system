import { useEffect, useState } from 'react'
import { Store } from 'lucide-react'
import { IconTile } from '@/components/IconTile'
import { ProfileMenu } from '@/components/ProfileMenu'
import { StoreBackdrop } from '@/components/StoreBackdrop'
import { api, session } from '@/lib/api'
import { AdminPage } from '@/pages/AdminPage'
import { AuthPage } from '@/pages/AuthPage'
import { OwnerPage } from '@/pages/OwnerPage'
import { UserPage } from '@/pages/UserPage'

const PAGES = { admin: AdminPage, user: UserPage, owner: OwnerPage }

export default function App() {
  const [user, setUser] = useState(() => session.get()?.user ?? null)

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('logout', onLogout)
    const token = session.get()?.token
    if (token) {
      api('/auth/me').then(({ user }) => {
        if (session.get()?.token !== token) return
        session.set({ ...session.get(), user })
        setUser(user)
      }, () => {})
    }
    return () => window.removeEventListener('logout', onLogout)
  }, [])

  const login = ({ token, user }) => {
    session.set({ token, user })
    setUser(user)
  }
  const logout = () => {
    session.clear()
    setUser(null)
  }

  if (!user) {
    return (
      <>
        <StoreBackdrop className="w-[min(40rem,96vw)]" />
        <AuthPage onLogin={login} />
      </>
    )
  }
  const Page = PAGES[user.role]

  return (
    <div className="min-h-svh">
      <header className="glass sticky top-0 z-10 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <IconTile icon={Store} solid className="size-9" iconClassName="size-4" />
            <span className="sr-only sm:not-sr-only">Store Ratings</span>
          </div>
          <div className="ml-auto">
            <ProfileMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>
      <main key={user.id} className="page-enter mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Page />
      </main>
    </div>
  )
}
