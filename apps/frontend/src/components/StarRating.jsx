import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const star = (filled, size) =>
  cn(size, filled ? 'fill-rating text-rating' : 'text-rating-empty')

export function StarRating({ value, onRate, disabled, label = 'Rating' }) {
  const [hover, setHover] = useState(0)
  const n = hover || Math.round(value ?? 0)

  if (!onRate) {
    return (
      <span role="img" className="inline-flex items-center gap-1.5" aria-label={value == null ? 'No ratings yet' : `${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={star(i <= n, 'size-4')} aria-hidden />)}
        <span className="text-xs text-muted-foreground tabular-nums" aria-hidden>{value == null ? 'No ratings' : value.toFixed(1)}</span>
      </span>
    )
  }

  return (
    <span role="group" aria-label={label} className="inline-flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onRate(i)}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(0)}
          aria-label={`Rate ${i} out of 5`}
          aria-pressed={value === i}
          className="rounded p-1.5 transition-transform sm:p-0.5 hover:scale-125 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          <Star className={star(i <= n, 'size-5')} aria-hidden />
        </button>
      ))}
    </span>
  )
}
