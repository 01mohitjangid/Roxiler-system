import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const PRODUCT_COLORS = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-3)']

function Shelf({ x, y, seed }) {
  return (
    <g>
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <rect x={x} y={y + 30 + row * 34} width="150" height="3" rx="1.5" fill="var(--primary)" opacity="0.35" />
          {Array.from({ length: 6 }, (_, i) => {
            const color = PRODUCT_COLORS[(i + row + seed) % PRODUCT_COLORS.length]
            const h = 14 + ((i * 7 + row * 5 + seed) % 10)
            return i % 2 ? (
              <circle key={i} cx={x + 14 + i * 24} cy={y + 30 + row * 34 - 8} r="7" fill={color} opacity="0.75" />
            ) : (
              <rect key={i} x={x + 6 + i * 24} y={y + 30 + row * 34 - h} width="15" height={h} rx="3" fill={color} opacity="0.75" />
            )
          })}
        </g>
      ))}
    </g>
  )
}

export function StoreBackdrop({ className }) {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onMove = (e) => {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--px', (e.clientX / window.innerWidth - 0.5).toFixed(3))
      el.style.setProperty('--py', (e.clientY / window.innerHeight - 0.5).toFixed(3))
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const stripes = Array.from({ length: 10 }, (_, i) => i)

  return createPortal(
    <div
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none fixed bottom-0 left-1/2 -z-10 w-[min(54rem,96vw)] -translate-x-1/2 opacity-25 sm:opacity-40', className)}
    >
      <svg viewBox="0 0 800 430" className="w-full overflow-visible">
        <g className="backdrop-layer" style={{ '--depth': 18 }}>
          <rect x="160" y="130" width="480" height="270" rx="12" fill="var(--card)" stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="3" />

          <g className="backdrop-glow">
            <rect x="255" y="74" width="290" height="54" rx="14" fill="var(--primary)" />
            <text x="400" y="110" textAnchor="middle" fontSize="26" fontWeight="700" letterSpacing="4" fill="var(--primary-foreground)">
              SUPERMARKET
            </text>
          </g>

          {stripes.map((i) => (
            <rect key={i} x={150 + i * 50} y="150" width="50" height="42" fill={i % 2 ? 'var(--card)' : 'var(--primary)'} opacity={i % 2 ? 1 : 0.85} />
          ))}
          <rect x="150" y="150" width="500" height="42" fill="none" stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="2" />
          <g className="backdrop-sway">
            {stripes.map((i) => (
              <path key={i} d={`M${150 + i * 50} 192 a25 18 0 0 0 50 0Z`} fill={i % 2 ? 'var(--card)' : 'var(--primary)'} opacity={i % 2 ? 1 : 0.85} stroke="var(--primary)" strokeOpacity="0.3" />
            ))}
          </g>

          {[190, 460].map((x, k) => (
            <g key={x}>
              <rect x={x} y="225" width="150" height="120" rx="8" fill="var(--primary)" opacity="0.08" stroke="var(--primary)" strokeOpacity="0.3" strokeWidth="2" />
              <Shelf x={x} y={228} seed={k * 2} />
            </g>
          ))}

          <rect x="358" y="232" width="84" height="168" rx="6" fill="var(--primary)" opacity="0.14" stroke="var(--primary)" strokeOpacity="0.4" strokeWidth="2" />
          <line x1="400" y1="232" x2="400" y2="400" stroke="var(--primary)" strokeOpacity="0.3" strokeWidth="2" />
          <circle cx="390" cy="320" r="3" fill="var(--primary)" opacity="0.6" />
          <circle cx="410" cy="320" r="3" fill="var(--primary)" opacity="0.6" />
          <g className="backdrop-blink">
            <rect x="374" y="252" width="52" height="20" rx="4" fill="var(--chart-1)" />
            <text x="400" y="267" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="1.5" fill="var(--primary-foreground)">OPEN</text>
          </g>

        </g>

        <g className="backdrop-layer" style={{ '--depth': 30 }}>
          <line x1="40" y1="401" x2="760" y2="401" stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
          {[[110, 372], [690, 372]].map(([cx, cy], i) => (
            <g key={cx} className="backdrop-sway" style={{ animationDelay: `${i * -1.5}s`, transformOrigin: '50% 100%' }}>
              <rect x={cx - 4} y={cy} width="8" height="28" rx="3" fill="var(--stone-500)" opacity="0.5" />
              <circle cx={cx} cy={cy - 18} r="30" fill="var(--chart-1)" opacity="0.45" />
              <circle cx={cx - 18} cy={cy - 2} r="20" fill="var(--chart-1)" opacity="0.4" />
              <circle cx={cx + 18} cy={cy - 2} r="20" fill="var(--chart-1)" opacity="0.4" />
            </g>
          ))}

          <g className="backdrop-cart">
            <path d="M0 0h14l10 38h46l9-28H20" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="26" y="-2" width="14" height="14" rx="3" fill="var(--chart-4)" opacity="0.8" />
            <rect x="44" y="-8" width="12" height="20" rx="3" fill="var(--chart-2)" opacity="0.8" />
            <circle cx="66" cy="4" r="7" fill="var(--chart-1)" opacity="0.8" />
            <circle cx="32" cy="48" r="5" fill="var(--primary)" />
            <circle cx="64" cy="48" r="5" fill="var(--primary)" />
          </g>
        </g>
      </svg>
    </div>,
    document.body,
  )
}
