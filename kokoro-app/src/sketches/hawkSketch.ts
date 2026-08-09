import p5 from 'p5'

export interface HawkCommand {
  type: 'launch'
  text: string
  onComplete: () => void
}

export interface HawkSketchRef {
  command: HawkCommand | null
}

interface Star {
  x: number; y: number; size: number
  alpha: number; twinkle: number; twinkleOff: number
  baseX: number; baseY: number
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  alpha: number; size: number
  r: number; g: number; b: number
  trail: Array<{ x: number; y: number }>
}

export function createHawkSketch(ref: { current: HawkSketchRef }) {
  return (p: p5) => {
    const stars: Star[] = []
    const particles: Particle[] = []

    // Moon
    let moonAlpha = 0
    let moonPulse = 0

    // Hawk
    let hawkY = 0
    let hawkAlpha = 0
    let hawkActive = false
    let hawkFlapT = 0

    // Stars zoom
    let zoom = 1.0
    let zooming = false

    // State
    let launched = false
    let launchTimer = 0
    let onComplete: (() => void) | null = null
    let completeCalled = false

    // Background colors (set in setup)
    let bgTop: p5.Color
    let bgBottom: p5.Color

    // ── Init ──────────────────────────────────────────────
    function initStars() {
      for (let i = 0; i < 200; i++) {
        const x = p.random(p.width)
        const y = p.random(p.height)
        stars.push({
          x, y, baseX: x, baseY: y,
          size: p.random(0.5, 2.8),
          alpha: p.random(55, 190),
          twinkle: p.random(0.01, 0.045),
          twinkleOff: p.random(p.TWO_PI),
        })
      }
    }

    // ── Background gradient ───────────────────────────────
    function drawBackground() {
      p.noStroke()
      const strips = 14
      for (let i = 0; i < strips; i++) {
        const t = i / (strips - 1)
        p.fill(p.lerpColor(bgTop, bgBottom, t))
        p.rect(0, (p.height / strips) * i, p.width, p.height / strips + 2)
      }
    }

    // ── Stars ─────────────────────────────────────────────
    function drawStars() {
      p.noStroke()
      const cx = p.width / 2
      const cy = p.height / 2

      for (const s of stars) {
        const tw = (Math.sin(p.frameCount * s.twinkle + s.twinkleOff) + 1) * 0.5
        const a = s.alpha * (0.55 + tw * 0.45)

        // Apply zoom from center
        const sx = cx + (s.baseX - cx) * zoom
        const sy = cy + (s.baseY - cy) * zoom

        p.fill(210, 225, 248, a * 0.28)
        p.ellipse(sx, sy, s.size * 2.4)
        p.fill(225, 238, 255, a)
        p.ellipse(sx, sy, s.size)

        // Sparkle cross on larger stars
        if (s.size > 2.0) {
          p.stroke(225, 238, 255, a * 0.45)
          p.strokeWeight(0.5)
          const sp = s.size * 2.2
          p.line(sx - sp, sy, sx + sp, sy)
          p.line(sx, sy - sp, sx, sy + sp)
          p.noStroke()
        }
      }
    }

    // ── Moon / new-moon glow ──────────────────────────────
    function drawMoon() {
      if (moonAlpha <= 0) return
      moonPulse += 0.022
      const pulse = (Math.sin(moonPulse) + 1) * 0.5

      const cx = p.width / 2
      const cy = p.height * 0.32
      const r = 18

      p.noStroke()
      // Concentric glow rings
      for (let layer = 7; layer >= 0; layer--) {
        const lr = r + layer * 14
        const la = moonAlpha * (0.025 + layer * 0.008) * (0.75 + pulse * 0.25)
        p.fill(170, 205, 245, la)
        p.ellipse(cx, cy, lr * 2)
      }
      // Core
      p.fill(230, 242, 255, moonAlpha * 0.92)
      p.ellipse(cx, cy, r * 2)
      // Highlight
      p.fill(248, 252, 255, moonAlpha * 0.55)
      p.ellipse(cx - 4, cy - 4, r * 1.25)
    }

    // ── Hawk silhouette ───────────────────────────────────
    function drawHawk(x: number, y: number, alpha: number) {
      if (alpha <= 0) return
      hawkFlapT += 0.14
      const flap = Math.sin(hawkFlapT) * 12

      p.push()
      p.translate(x, y)
      p.noFill()

      const ws = 55
      // Wing stroke with glow
      for (let pass = 0; pass < 2; pass++) {
        const sw = pass === 0 ? 3.5 : 1.5
        const sa = pass === 0 ? alpha * 0.3 : alpha
        p.stroke(220, 200, 145, sa)
        p.strokeWeight(sw)

        // Left wing
        p.beginShape()
        p.vertex(0, 0)
        p.vertex(-ws, flap)
        p.vertex(-ws * 0.62, flap * 0.45)
        p.vertex(-ws * 0.18, 2)
        p.endShape()

        // Right wing
        p.beginShape()
        p.vertex(0, 0)
        p.vertex(ws, flap)
        p.vertex(ws * 0.62, flap * 0.45)
        p.vertex(ws * 0.18, 2)
        p.endShape()
      }

      // Body
      p.noStroke()
      p.fill(215, 195, 135, alpha)
      p.triangle(0, -9, -7, 14, 7, 14)

      // Head
      p.fill(228, 210, 148, alpha)
      p.ellipse(0, -14, 11, 11)

      // Tail fan
      p.noFill()
      p.stroke(200, 180, 120, alpha * 0.75)
      p.strokeWeight(1)
      for (let f = -2; f <= 2; f++) {
        p.line(f * 2, 14, f * 4, 26)
      }

      p.pop()
    }

    // ── Rising particles ──────────────────────────────────
    function spawnParticles(cx: number, cy: number, count: number) {
      for (let i = 0; i < count; i++) {
        const isGold = p.random() > 0.35
        const angle = p.random(p.TWO_PI)
        const spd = p.random(1.5, 7)
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - p.random(2, 6),
          alpha: p.random(160, 255),
          size: p.random(1.5, 4.5),
          r: isGold ? 220 : 185,
          g: isGold ? 190 : 215,
          b: isGold ? 100 : 248,
          trail: [],
        })
      }
    }

    function updateParticles() {
      p.noStroke()
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i]
        pt.trail.push({ x: pt.x, y: pt.y })
        if (pt.trail.length > 14) pt.trail.shift()

        pt.x += pt.vx
        pt.y += pt.vy
        pt.vy -= 0.07
        pt.vx *= 0.985
        pt.alpha -= 1.6

        if (pt.alpha <= 0 || pt.y < -60) { particles.splice(i, 1); continue }

        // Trail
        for (let j = 0; j < pt.trail.length; j++) {
          const t = j / pt.trail.length
          p.fill(pt.r, pt.g, pt.b, pt.alpha * t * 0.38)
          p.ellipse(pt.trail[j].x, pt.trail[j].y, pt.size * t)
        }
        // Head
        p.fill(pt.r, pt.g, pt.b, pt.alpha)
        p.ellipse(pt.x, pt.y, pt.size)
      }
    }

    // ── Launch sequence ───────────────────────────────────
    function startLaunch(text: string, cb: () => void) {
      launched = true
      launchTimer = 0
      onComplete = cb
      completeCalled = false

      hawkY = p.height * 0.68
      hawkAlpha = 0
      hawkActive = true

      zooming = true
      zoom = 1.0

      void text // vision text is drawn by HawkPhase's UI overlay after p5 fires onComplete
      spawnParticles(p.width / 2, p.height * 0.68, 70)
    }

    // ── p5 lifecycle ──────────────────────────────────────
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight)
      bgTop = p.color(2, 6, 15)
      bgBottom = p.color(12, 22, 42)
      initStars()
    }

    p.draw = () => {
      const state = ref.current
      if (state.command && !launched) {
        const cmd = state.command
        state.command = null
        startLaunch(cmd.text, cmd.onComplete)
      }

      drawBackground()

      // Moon fade in
      moonAlpha = Math.min(moonAlpha + 1.2, 210)
      drawStars()
      drawMoon()

      // Stars zoom effect
      if (zooming) {
        zoom += 0.01
        if (zoom >= 1.9) { zoom = 1.9; zooming = false }
      }

      // Hawk update
      if (hawkActive) {
        hawkAlpha = Math.min(hawkAlpha + 5, 230)
        hawkY -= 2.5 + launchTimer * 0.025
        if (launchTimer % 5 === 0) {
          spawnParticles(p.width / 2, hawkY + 15, 10)
        }
        if (hawkY < -100) {
          hawkActive = false
          hawkAlpha = 0
        }
        drawHawk(p.width / 2, hawkY, hawkAlpha)
      }

      updateParticles()

      if (launched) {
        launchTimer++
        if (!hawkActive && launchTimer > 200 && !completeCalled) {
          completeCalled = true
          onComplete?.()
          onComplete = null
        }
      }
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
    }
  }
}
