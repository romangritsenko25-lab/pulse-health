export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#0d9488',
        borderRadius: Math.round(size * 0.22),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-playfair)',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: Math.round(size * 0.62),
          color: 'white',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        m
      </span>
    </div>
  )
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cfg = {
    sm: { icon: 24, name: 13, sub: 7,  gap: 6  },
    md: { icon: 32, name: 16, sub: 8,  gap: 8  },
    lg: { icon: 56, name: 24, sub: 10, gap: 12 },
  }[size]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cfg.gap }}>
      <LogoMark size={cfg.icon} />
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
