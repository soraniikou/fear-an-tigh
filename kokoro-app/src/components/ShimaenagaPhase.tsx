import { useRef, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { P5Canvas } from './P5Canvas'
import { createShimaenagaSketch } from '../sketches/shimaenagaSketch'
import type { ShimaenagaSketchRef } from '../sketches/shimaenagaSketch'

interface Props {
  onReleaseComplete: () => void
}

type UiState = 'input' | 'releasing' | 'empty'

export function ShimaenagaPhase({ onReleaseComplete }: Props) {
  const [text, setText] = useState('')
  const [uiState, setUiState] = useState<UiState>('input')
  const isMounted = useRef(true)

  const sketchRef = useRef<ShimaenagaSketchRef>({ command: null })
  const sketch = useMemo(() => createShimaenagaSketch(sketchRef), [])

  const handleRelease = () => {
    const trimmed = text.trim()
    if (!trimmed || uiState !== 'input') return
    setUiState('releasing')
    setText('')

    sketchRef.current.command = {
      type: 'release',
      text: trimmed,
      onComplete: () => {
        if (!isMounted.current) return
        setUiState('empty')
        setTimeout(() => {
          if (isMounted.current) onReleaseComplete()
        }, 2200)
      },
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRelease()
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* p5 canvas: full-screen background */}
      <P5Canvas sketch={sketch} className="absolute inset-0 w-full h-full" />

      {/* UI overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {uiState === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -22, transition: { duration: 0.6 } }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-sm px-8 text-center"
            >
              {/* Label */}
              <p
                className="text-slate-400 text-xs mb-8"
                style={{ letterSpacing: '0.3em', fontFamily: 'Georgia, serif' }}
              >
                let go · 手放す
              </p>

              {/* Heading */}
              <h1
                className="text-slate-500 text-xl leading-loose mb-10 font-light"
                style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif" }}
              >
                今、手放したいものは<br />何ですか？
              </h1>

              {/* Textarea */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ここに書いてください…"
                rows={3}
                className="w-full resize-none rounded-2xl px-5 py-4 text-center text-base text-slate-600 placeholder-slate-300 focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.52)',
                  border: '1px solid rgba(180,200,220,0.5)',
                  backdropFilter: 'blur(6px)',
                  fontFamily: "'Hiragino Mincho ProN', Georgia, serif",
                }}
              />

              {/* Release button */}
              <motion.button
                onClick={handleRelease}
                disabled={!text.trim()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="mt-6 px-10 py-3 rounded-full text-slate-500 text-sm transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  letterSpacing: '0.18em',
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(180,205,225,0.6)',
                  fontFamily: "'Hiragino Mincho ProN', Georgia, serif",
                }}
              >
                手放す
              </motion.button>
            </motion.div>
          )}

          {uiState === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.8, ease: 'easeIn' }}
              className="text-center"
            >
              <p className="text-slate-300 text-2xl" style={{ fontFamily: 'Georgia, serif' }}>
                ✦
              </p>
              <p
                className="text-slate-300 text-xs mt-4"
                style={{ letterSpacing: '0.25em', fontFamily: 'Georgia, serif' }}
              >
                余白
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
