import { useEffect, useRef, useCallback, type MutableRefObject } from "react"
import createGlobe from "cobe"

interface GlobeProps {
  className?: string
  baseColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
  mapBrightness?: number
  speed?: number
  theta?: number
  diffuse?: number
  mapSamples?: number
  phiRef?: MutableRefObject<number>
  thetaRef?: MutableRefObject<number>
}

export function Globe({
  className = "",
  baseColor = [0.06, 0.10, 0.26],
  glowColor = [0.2, 0.4, 0.9],
  dark = 1,
  mapBrightness = 6,
  speed = 0.004,
  theta = 0.15,
  diffuse = 1.2,
  mapSamples = 16000,
  phiRef,
  thetaRef,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const propsRef = useRef({ baseColor, glowColor, dark, mapBrightness, speed, theta, diffuse })
  useEffect(() => {
    propsRef.current = { baseColor, glowColor, dark, mapBrightness, speed, theta, diffuse }
  })

  const externalPhiRef = phiRef
  const externalThetaRef = thetaRef

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x
      const deltaY = e.clientY - pointerInteracting.current.y
      dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 }
      const now = Date.now()
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.t, 1)
        const max = 0.15
        velocity.current = {
          phi: Math.max(-max, Math.min(max, ((e.clientX - lastPointer.current.x) / dt) * 0.3)),
          theta: Math.max(-max, Math.min(max, ((e.clientY - lastPointer.current.y) / dt) * 0.08)),
        }
      }
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now }
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
      lastPointer.current = null
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Pre-check WebGL availability
    const testCtx = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!testCtx) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      if (!canvas) return
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      const p = propsRef.current
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width,
        height: width,
        phi: 0,
        theta: p.theta,
        dark: p.dark,
        diffuse: p.diffuse,
        mapSamples,
        mapBrightness: p.mapBrightness,
        baseColor: p.baseColor,
        markerColor: [0, 0, 0],
        glowColor: p.glowColor,
        markers: [],
        opacity: 0.9,
      })

      function animate() {
        const p = propsRef.current

        if (!isPausedRef.current) {
          phi += p.speed

          if (Math.abs(velocity.current.phi) > 0.00005 || Math.abs(velocity.current.theta) > 0.00005) {
            phiOffsetRef.current += velocity.current.phi
            thetaOffsetRef.current += velocity.current.theta
            velocity.current.phi *= 0.92
            velocity.current.theta *= 0.92
          } else {
            velocity.current.phi = 0
            velocity.current.theta = 0
          }

          const tMin = -0.35, tMax = 0.35
          if (thetaOffsetRef.current < tMin) thetaOffsetRef.current += (tMin - thetaOffsetRef.current) * 0.08
          else if (thetaOffsetRef.current > tMax) thetaOffsetRef.current += (tMax - thetaOffsetRef.current) * 0.08
        }

        const currentPhi = phi + phiOffsetRef.current + dragOffset.current.phi
        const currentTheta = p.theta + thetaOffsetRef.current + dragOffset.current.theta

        if (externalPhiRef) externalPhiRef.current = currentPhi
        if (externalThetaRef) externalThetaRef.current = currentTheta

        globe!.update({
          phi: currentPhi,
          theta: currentTheta,
          dark: p.dark,
          mapBrightness: p.mapBrightness,
          baseColor: p.baseColor,
          markers: [],
        })
        animationId = requestAnimationFrame(animate)
      }

      animate()
      setTimeout(() => { if (canvas) canvas.style.opacity = "1" }, 0)
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
      return () => {
        ro.disconnect()
        if (animationId) cancelAnimationFrame(animationId)
        if (globe) globe.destroy()
      }
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapSamples])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.4s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
    </div>
  )
}
