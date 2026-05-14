import Image from 'next/image'

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Metanoia"
      width={size}
      height={size}
      className="rounded-xl object-contain"
    />
  )
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
      {showMark && (
        <Image
          src="/logo.jpg"
          alt="Metanoia"
          width={cfg.icon}
          height={cfg.icon}
          className="rounded-xl object-contain"
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: cfg.name,
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
            color: '#06b6d4',
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
