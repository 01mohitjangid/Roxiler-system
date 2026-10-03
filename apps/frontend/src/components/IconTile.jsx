import { cn } from '@/lib/utils'

export function IconTile({ icon: Icon, hue, solid, className, iconClassName = 'size-5' }) {
  const style =
    hue == null
      ? undefined
      : {
          backgroundColor: `oklch(var(--tile-bg-l) var(--tile-bg-c) ${hue})`,
          color: `oklch(var(--tile-fg-l) var(--tile-fg-c) ${hue})`,
        }
  return (
    <span
      style={style}
      aria-hidden
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-lg',
        hue == null && (solid ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'),
        className,
      )}
    >
      <Icon className={iconClassName} />
    </span>
  )
}
