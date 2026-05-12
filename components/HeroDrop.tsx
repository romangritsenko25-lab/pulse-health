'use client'

import { useEffect, useRef } from 'react'

interface Ripple {
  born: number
  speed: number
  maxR: number
  lw: number
  initOpacity: number
}

interface Splash {
  x0: number; y0: number
  vx: number; vy: number
  size: number; born: number
}

export default function HeroDrop({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cbRef = useRef(onComplete)
  cbRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const cx = W / 2
    const cy = H * 0.44

    const IMPACT_AT = 720
    const FADE_START = IMPACT_AT + 900
    const FADE_DURATION = 350

    let impacted = false
    let completed = false

    const ripples: Ripple[] = []
    const splashes: Splash[] = []
    const diag = Math.sqrt(W * W + H * H)

    // Worthington jet state
    const jet = { born: IMPACT_AT, vy0: -165, gravity: 285, size: 7 }

    function triggerImpact(t: number) {
      impacted = true

      const waves = [
        { d: 0,   speed: 260, maxR: diag * 0.6, lw: 3.0, io: 0.75 },
        { d: 70,  speed: 200, maxR: diag * 0.5, lw: 2.2, io: 0.65 },
        { d: 160, speed: 150, maxR: diag * 0.4, lw: 1.6, io: 0.55 },
        { d: 270, speed: 110, maxR: diag * 0.3, lw: 1.1, io: 0.45 },
      ]
      waves.forEach(w => ripples.push({
        born: t + w.d, speed: w.speed, maxR: w.maxR, lw: w.lw, initOpacity: w.io,
      }))

      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 / 9) * i + (Math.random() - 0.5) * 0.5
        const spd = 60 + Math.random() * 80
        splashes.push({
          x0: cx, y0: cy,
          vx: Math.cos(angle) * spd,
          vy: -55 - Math.random() * 80,
          size: 2.5 + Math.random() * 3,
          born: t,
        })
      }
    }

    function drawDrop(
      x: number, y: number, r: number,
      sx: number, sy: number, alpha: number,
    ) {
      if (alpha <= 0) return
      ctx.save()
      ctx.globalAlpha = Math.min(1, alpha)
      ctx.translate(x, y)
      ctx.scale(sx, sy)
      ctx.beginPath()
      ctx.moveTo(0, -r * 1.2)
      ctx.bezierCurveTo( r * 0.55, -r * 0.3,  r * 0.9,  r * 0.5, 0,  r)
      ctx.bezierCurveTo(-r * 0.9,  r * 0.5, -r * 0.55, -r * 0.3, 0, -r * 1.2)
      ctx.closePath()
      ctx.fillStyle = '#0d9488'
      ctx.fill()
      // Specular highlight
      ctx.beginPath()
      ctx.ellipse(-r * 0.22, -r * 0.48, r * 0.13, r * 0.2, -0.35, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.fill()
      ctx.restore()
    }

    let startTime = -1
    let rafId: number

    function frame(now: number) {
      if (startTime < 0) startTime = now
      const t = now - startTime
      ctx.clearRect(0, 0, W, H)

      // ── FALLING DROP ──────────────────────────────────────
      if (!impacted) {
        const p = Math.min(t / IMPACT_AT, 1)
        const eased = p * p  // gravity curve
        const dropY = -80 + (cy + 80) * eased
        const vel = 2 * p
        drawDrop(cx, dropY, 16, 1 - vel * 0.07, 1 + vel * 0.22, Math.min(t / 150, 1))
        if (t >= IMPACT_AT) triggerImpact(t)
      }

      // ── IMPACT SQUISH ─────────────────────────────────────
      if (impacted) {
        const age = t - IMPACT_AT
        if (age < 120) {
          const pct = age / 120
          const sq = Math.sin(pct * Math.PI)
          drawDrop(cx, cy, 16, 1 + sq * 0.9, 1 - sq * 0.55, 1 - pct)
        }
      }

      // ── RIPPLE WAVES ──────────────────────────────────────
      for (const rp of ripples) {
        if (t < rp.born) continue
        const age = (t - rp.born) / 1000
        const r = Math.min(rp.speed * age, rp.maxR)
        const alpha = rp.initOpacity * Math.exp(-age * 1.8)
        if (alpha < 0.008) continue
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.ellipse(cx, cy, r, r * 0.32, 0, 0, Math.PI * 2)
        ctx.strokeStyle = '#0d9488'
        ctx.lineWidth = rp.lw
        ctx.stroke()
        ctx.restore()
      }

      // ── SPLASH PARTICLES ──────────────────────────────────
      const gravity = 320
      for (const sp of splashes) {
        const age = (t - sp.born) / 1000
        if (age < 0) continue
        const x = sp.x0 + sp.vx * age
        const y = sp.y0 + sp.vy * age + 0.5 * gravity * age * age
        const alpha = Math.max(0, 0.85 - age * 2.8)
        const r = Math.max(0.4, sp.size * (1 - age * 2.2))
        if (alpha < 0.01) continue
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = '#0d9488'
        ctx.fill()
        ctx.restore()
      }

      // ── WORTHINGTON JET ───────────────────────────────────
      if (impacted) {
        const age = (t - jet.born) / 1000
        if (age > 0 && age < 0.9) {
          const y = cy + jet.vy0 * age + 0.5 * jet.gravity * age * age
          const alpha = Math.max(0, 0.9 - age * 1.5)
          const elongate = 1 + Math.abs(jet.vy0 * age) * 0.006
          drawDrop(cx, y, jet.size, 1 / Math.sqrt(elongate), elongate, alpha)
        }
      }

      // ── FADE OUT & COMPLETE ───────────────────────────────
      if (t > FADE_START) {
        const fadeAge = t - FADE_START
        const alpha = Math.max(0, 1 - fadeAge / FADE_DURATION)
        canvas.style.opacity = String(alpha)
        if (alpha === 0 && !completed) {
          completed = true
          canvas.style.pointerEvents = 'none'
          cbRef.current()
          return
        }
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 30, pointerEvents: 'none' }}
    />
  )
}
