import { useState } from 'react'
import { ChevronDown, KeyRound, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PasswordDialog } from '@/components/PasswordDialog'
import { RoleBadge } from '@/components/RoleBadge'

const initials = (name) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

function Avatar({ name, className = 'size-9 text-sm' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground ${className}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function ProfileMenu({ user, onLogout }) {
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Account menu for ${user.name}`}
          className="group flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:bg-accent"
        >
          <Avatar name={user.name} />
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-64">
          <DropdownMenuLabel className="flex items-center gap-3 p-2 font-normal">
            <Avatar name={user.name} className="size-10 text-sm" />
            <div className="grid min-w-0 gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              <span className="mt-1"><RoleBadge role={user.role} /></span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="py-2" onSelect={() => setPasswordOpen(true)}>
            <KeyRound aria-hidden />
            Change password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="py-2" onSelect={onLogout}>
            <LogOut aria-hidden />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PasswordDialog open={passwordOpen} setOpen={setPasswordOpen} />
    </>
  )
}
