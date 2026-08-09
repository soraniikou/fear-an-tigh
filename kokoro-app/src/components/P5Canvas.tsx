import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface Props {
  sketch: (p: p5) => void
  className?: string
}

export function P5Canvas({ sketch, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<p5 | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    instanceRef.current?.remove()
    instanceRef.current = new p5(sketch, container)

    return () => {
      instanceRef.current?.remove()
      instanceRef.current = null
    }
  }, [sketch])

  return <div ref={containerRef} className={`pointer-events-none ${className ?? ''}`} />
}
