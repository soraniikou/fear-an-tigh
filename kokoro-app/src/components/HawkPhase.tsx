import { useRef, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { P5Canvas } from './P5Canvas'
import { createHawkSketch } from '../sketches/hawkSketch'
import type { HawkSketchRef } from '../sketches/hawkSketch'

type UiState = 'input' | 'launching' | 'soaring'

export function HawkPhase() {
  const [text, setText] = useState('')
  const [uiState, setUiState] = useState<UiState>('input')
  const [visionText, setVisionText] = useState('')
  const isMounted = useRef(true)

  const sketchRef = useRef<HawkSketchRef>({ command: null })
  const sketch = useMemo(() => createHawkSketch(sketchRef), [])

  const handleLaunch = () => {
    const trimmed = text.trim()
    if (!trimmed || uiState !== 'input') return
    setUiState('launching')
    setVisionText(trimmed)

    sketchRef.current.command = {
      type: 'launch',
      text: trimmed,
      onComplete: () => {
        if (isMounted.current) setUiState('soaring')
      },
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleLaunch()
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* p5 canvas */}
      <P5Canvas sketch={sketch} className="absolute inset-0 w-full h-full" />

      {/* UI overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {uiState === 'input' && (
            <motion.div
              key="hawk-input"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -28, scale: 0.94 }}
              transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
              className="w-full max-w-sm px-8 text-center"
            >
              {/* Label */}
              <p
                className="text-blue-300 text-xs mb-8"
                style={{
                  opacity: 0.55,
                  letterSpacing: '0.3em',
                  fontFamily: 'Georgia, serif',
                }}
              >
                take flight · 飛び立つ
              </p>

              {/* Heading */}
              <h1
                className="text-blue-100 text-xl leading-loose mb-10 font-light"
                style={{
                  opacity: 0.75,
                  fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif",
                }}
              >
                さあ、種を蒔きましょう。<br />
                あなたが始めたいことは？
              </h1>

              {/* Textarea */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ひとつのフレーズで…"
                rows={2}
                className="w-full resize-none rounded-2xl px-5 py-4 text-center text-base focus:outline-none transition-colors"
                style={{
                  background: 'rgba(10, 20, 50, 0.45)',
                  border: '1px solid rgba(100, 160, 220, 0.22)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(200, 220, 245, 0.85)',
                  fontFamily: "'Hiragino Mincho ProN', Georgia, serif",
                }}
              />

              {/* Launch button */}
              <motion.button
                onClick={handleLaunch}
                disabled={!text.trim()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="mt-6 px-10 py-3 rounded-full text-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  letterSpacing: '0.18em',
                  color: 'rgba(180, 215, 250, 0.75)',
                  background: 'rgba(15, 35, 75, 0.4)',
                  border: '1px solid rgba(100, 160, 220, 0.3)',
                  fontFamily: "'Hiragino Mincho ProN', Georgia, serif",
                }}
              >
                飛び立つ
              </motion.button>
            </motion.div>
          )}

          {/* "Launching" state: brief vision echo */}
          {uiState === 'launching' && (
            <motion.div
              key="launching"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: [0, 0.7, 0], scale: [1.1, 1.0, 0.85] }}
              transition={{ duration: 3.5, ease: 'easeInOut' }}
              className="text-center pointer-events-none"
            >
              <p
                className="text-blue-100 text-2xl md:text-3xl font-light"
                style={{
                  opacity: 0.9,
                  fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif",
                  textShadow: '0 0 40px rgba(140,190,255,0.6)',
                }}
              >
                {visionText}
              </p>
            </motion.div>
          )}

          {/* Soaring: final peaceful state */}
          {uiState === 'soaring' && (
            <motion.div
              key="soaring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2.5, ease: 'easeIn' }}
              className="text-center pointer-events-none flex flex-col items-center gap-6"
            >
              <motion.p
                className="text-blue-100 text-2xl font-light"
                style={{
                  opacity: 0.85,
                  fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif",
                  textShadow: '0 0 30px rgba(140,190,255,0.5)',
                }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              >
                {visionText}
              </motion.p>
              <p
                className="text-blue-300 text-xs"
                style={{
                  opacity: 0.45,
                  letterSpacing: '0.28em',
                  fontFamily: 'Georgia, serif',
                }}
              >
                あなたの種は、宇宙へ。
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
