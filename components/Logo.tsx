function DropIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 3 C20 3 34 17 34 26 C34 33.2 27.7 38 20 38 C12.3 38 6 33.2 6 26 C6 17 20 3 20 3 Z"
        fill="#0d9488"
      />
      <path d="M20 33 L20 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
      <path d="M20 26 C18 23 15 22 13.5 20" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
      <path d="M20 24 C22 21 25 20 26.5 18" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return <DropIcon size={size} />
}

export function Logo({
  size = 'md',
  showMark = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  showMark?: boolean
}) {
  const cfg = {
    sm: { icon: 28, name: 13, sub: 7,  gap: 6  },
    md: { icon: 34, name: 16, sub: 8,  gap: 8  },
    lg: { icon: 52, name: 24, sub: 10, gap: 12 },
  }[size]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showMark ? cfg.gap : 0 }}>
      {showMark && <DropIcon size={cfg.icon} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: cfg.name,
            color: '#0d9488',
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}
        >
          metanoia
        </span>
        <span
          style={{
            fontSize: cfg.sub,
            fontWeight: 700,
            color: '#9ca3af',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          AI ASSISTANT
        </span>
      </div>
    </div>
  )
}
