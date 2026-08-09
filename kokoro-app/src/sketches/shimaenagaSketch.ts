import p5 from 'p5'

export interface ShimaenagaCommand {
  type: 'release'
  text: string
  onComplete: () => void
}

export interface ShimaenagaSketchRef {
  command: ShimaenagaCommand | null
}

interface Flake {
  x: number; y: number; size: number
  baseAlpha: number; speed: number
  wobble: number; wobbleOff: number
}

interface TextParticle {
  x: number; y: number; char: string
  vx: number; vy: number; alpha: number; size: number
}

export function createShimaenagaSketch(ref: { current: ShimaenagaSketchRef }) {
  return (p: p5) => {
    const flakes: Flake[] = []
    const textParts: TextParticle[] = []

    let birdX = 0, birdY = 0, birdBob = 0
    let birdAlpha = 255, birdVY = 0, birdFlying = false

    let releasing = false
    let releaseTimer = 0
    let onComplete: (() => void) | null = null

    // ── Init ──────────────────────────────────────────────
    function initFlakes() {
      for (let i = 0; i < 55; i++) {
        const f = {} as Flake
        respawnFlake(f)
        flakes.push(f)
      }
    }

    function respawnFlake(f: Flake) {
      f.x = p.random(p.width)
      f.y = p.random(-20, p.height)
      f.size = p.random(3, 11)
      f.baseAlpha = p.random(20, 65)
      f.speed = p.random(0.2, 0.9)
      f.wobble = p.random(0.006, 0.022)
      f.wobbleOff = p.random(p.TWO_PI)
    }

    // ── Background ────────────────────────────────────────
    function drawBackground() {
      p.background(248, 250, 255)
    }

    // ── Snow / feather particles ──────────────────────────
    function drawFlakes() {
      p.noStroke()
      for (const f of flakes) {
        f.y += f.speed
        f.x += Math.sin(p.frameCount * f.wobble + f.wobbleOff) * 0.7
        if (f.y > p.height + 15) { f.y = -10; f.x = p.random(p.width) }

        const pulse = (Math.sin(p.frameCount * f.wobble * 1.5 + f.wobbleOff) + 1) * 0.5
        const a = f.baseAlpha + pulse * 18

        // 3-layer soft glow
        p.fill(255, 255, 255, a * 0.3)
        p.ellipse(f.x, f.y, f.size * 1.8)
        p.fill(255, 255, 255, a * 0.65)
        p.ellipse(f.x, f.y, f.size * 1.05)
        p.fill(255, 255, 255, a)
        p.ellipse(f.x, f.y, f.size * 0.55)
      }
    }

    // ── Shima-enaga bird ──────────────────────────────────
    function drawBird(x: number, y: number, bob: number, alpha: number) {
      if (alpha <= 0) return
      const yo = Math.sin(bob) * 5
      const a = alpha

      p.push()
      p.translate(x, y + yo)
      p.noStroke()

      // Drop shadow
      p.fill(185, 205, 225, 16 * (a / 255))
      p.ellipse(3, 6, 48, 36)

      // Body
      p.fill(255, 255, 255, a)
      p.ellipse(0, 0, 44, 36)

      // Wing fold highlight
      p.fill(232, 238, 248, a * 0.8)
      p.ellipse(-7, 2, 28, 12)

      // Long tail (characteristic)
      p.fill(252, 252, 255, a * 0.92)
      p.ellipse(-26, 7, 20, 9)
      p.ellipse(-35, 10, 11, 6)

      // Head cap (dark)
      p.fill(28, 24, 20, a)
      p.ellipse(15, -13, 23, 22)

      // White face mask
      p.fill(255, 255, 255, a)
      p.ellipse(18, -12, 17, 15)

      // Eye
      p.fill(12, 10, 8, a)
      p.ellipse(23, -15, 5, 5)
      // Shine
      p.fill(255, 255, 255, a * 0.9)
      p.ellipse(24.5, -16.5, 2, 2)

      // Beak
      p.fill(135, 105, 55, a)
      p.triangle(28, -13, 33, -11, 28, -10)

      // Feet
      p.stroke(95, 85, 72, a * 0.55)
      p.strokeWeight(1.5)
      p.noFill()
      for (const ox of [5, -3]) {
        p.line(ox, 17, ox, 24)
        p.line(ox, 24, ox - 4, 29)
        p.line(ox, 24, ox + 4, 29)
      }

      p.pop()
    }

    // ── Release animation ─────────────────────────────────
    function startRelease(text: string, cb: () => void) {
      releasing = true
      releaseTimer = 0
      onComplete = cb

      const charW = 20
      const startX = p.width / 2 - (text.length * charW) / 2 + charW / 2
      const startY = p.height / 2

      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === ' ' || ch === '　') continue
        textParts.push({
          x: startX + i * charW,
          y: startY,
          char: ch,
          vx: p.random(-1.6, 1.6),
          vy: p.random(-4.5, -1.5),
          alpha: 195,
          size: p.random(15, 22),
        })
      }

      birdFlying = true
      birdVY = -0.4
    }

    function updateTextParticles() {
      p.noStroke()
      for (let i = textParts.length - 1; i >= 0; i--) {
        const tp = textParts[i]
        tp.x += tp.vx + Math.sin(p.frameCount * 0.055 + i * 0.9) * 0.55
        tp.y += tp.vy
        tp.vy += 0.035
        tp.vx *= 0.97
        tp.alpha -= 2.6
        if (tp.alpha <= 0) { textParts.splice(i, 1); continue }
        p.fill(140, 170, 200, tp.alpha)
        p.textFont('Georgia')
        p.textSize(tp.size)
        p.textAlign(p.CENTER, p.CENTER)
        p.text(tp.char, tp.x, tp.y)
      }
    }

    function updateBird() {
      if (!birdFlying) {
        birdBob += 0.033
        return
      }
      birdBob += 0.09
      birdVY -= 0.038
      birdY += birdVY
      birdX += Math.sin(birdBob * 0.45) * 1.4
      birdAlpha = Math.max(birdAlpha - 1.5, 0)
    }

    // ── p5 lifecycle ──────────────────────────────────────
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight)
      birdX = p.width / 2
      birdY = p.height / 2 - 160
      initFlakes()
    }

    p.draw = () => {
      const state = ref.current
      if (state.command && !releasing) {
        const cmd = state.command
        state.command = null
        startRelease(cmd.text, cmd.onComplete)
      }

      drawBackground()
      drawFlakes()
      updateTextParticles()
      updateBird()
      drawBird(birdX, birdY, birdBob, birdAlpha)

      if (releasing) {
        releaseTimer++
        if (textParts.length === 0 && birdAlpha <= 0 && releaseTimer > 40) {
          releasing = false
          onComplete?.()
          onComplete = null
        }
        // Safety timeout
        if (releaseTimer > 240) {
          releasing = false
          onComplete?.()
          onComplete = null
        }
      }
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
      if (!birdFlying) {
        birdX = p.width / 2
        birdY = p.height / 2 - 160
      }
    }
  }
}
