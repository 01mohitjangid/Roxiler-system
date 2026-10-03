import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Field({ label, error, id, hint, ...props }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} aria-describedby={describedBy} {...props} />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function FormError({ message }) {
  return message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null
}

export function SearchInput({ label, value, onChange }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input aria-label={label} placeholder={label} value={value} onChange={(e) => onChange(e.target.value)} className="pl-8" />
    </div>
  )
}

export function SelectField({ id, label, value, onChange, options, error }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, text]) => <SelectItem key={v} value={v}>{text}</SelectItem>)}
        </SelectContent>
      </Select>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
