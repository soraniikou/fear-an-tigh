import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShimaenagaPhase } from './components/ShimaenagaPhase'
import { HawkPhase } from './components/HawkPhase'

type AppPhase = 'shimaenaga' | 'hawk'

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('shimaenaga')

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'shimaenaga' && (
          <motion.div
            key="shimaenaga"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          >
            <ShimaenagaPhase onReleaseComplete={() => setPhase('hawk')} />
          </motion.div>
        )}

        {phase === 'hawk' && (
          <motion.div
            key="hawk"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
          >
            <HawkPhase />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
