import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'
import type { COBEOptions } from 'cobe'

export function CSSGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let phi = 0
    let globe: ReturnType<typeof createGlobe> | null = null
    let rafId = 0

    let pointerDown = false
    let lastX = 0
    let velocity = 0

    function onPointerDown(e: PointerEvent) {
      pointerDown = true
      lastX = e.clientX
      velocity = 0
      canvas!.style.cursor = 'grabbing'
    }

    function onPointerMove(e: PointerEvent) {
      if (!pointerDown) return
      const dx = e.clientX - lastX
      phi += dx * 0.008
      velocity = dx * 0.008
      lastX = e.clientX
    }

    function onPointerUp() {
      pointerDown = false
      canvas!.style.cursor = 'grab'
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerdown', onPointerDown)

    function init() {
      if (globe) { globe.destroy(); globe = null }
      cancelAnimationFrame(rafId)

      const size = container!.offsetWidth
      if (!size) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      const opts: COBEOptions = {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: 0,
        theta: 0.15,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.06, 0.10, 0.26],
        markerColor: [0.37, 0.51, 0.86],
        glowColor: [0.2, 0.4, 0.9],
        markers: [
          { location: [48.85, 2.35],    size: 0.05 },
          { location: [38.90, -77.04],  size: 0.05 },
          { location: [39.90, 116.41],  size: 0.05 },
          { location: [35.68, 139.69],  size: 0.05 },
          { location: [-23.55, -46.63], size: 0.05 },
        ],
      }

      globe = createGlobe(canvas!, opts)
      canvas!.style.opacity = '1'

      function animate() {
        if (!pointerDown) {
          velocity *= 0.92
          phi += 0.004 + velocity
        }
        globe!.update({ phi })
        rafId = requestAnimationFrame(animate)
      }
      rafId = requestAnimationFrame(animate)
    }

    const size = container.offsetWidth
    if (size > 0) {
      init()
    } else {
      const ro = new ResizeObserver(() => {
        if (container!.offsetWidth > 0) { ro.disconnect(); init() }
      })
      ro.observe(container)
      return () => { ro.disconnect(); cancelAnimationFrame(rafId) }
    }

    return () => {
      cancelAnimationFrame(rafId)
      globe?.destroy()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full aspect-square select-none">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          cursor: 'grab',
          opacity: 0,
          transition: 'opacity 1s ease',
        }}
      />
    </div>
  )
}
