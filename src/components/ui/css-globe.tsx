import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PINS = [
  { id: 'france',  label: 'France',        flag: '🇫🇷', lat: 48.85,  lng:   2.35 },
  { id: 'usa',     label: 'United States', flag: '🇺🇸', lat: 38.90,  lng: -77.04 },
  { id: 'china',   label: 'China',         flag: '🇨🇳', lat: 39.90,  lng: 116.41 },
  { id: 'spain',   label: 'Spain',         flag: '🇪🇸', lat: 40.42,  lng:  -3.70 },
  { id: 'italy',   label: 'Italy',         flag: '🇮🇹', lat: 41.90,  lng:  12.50 },
]

function latLngToXY(lat: number, lng: number, phi: number, r: number, cx: number, cy: number) {
  const latR = (lat * Math.PI) / 180
  const lngR = (lng * Math.PI) / 180
  // 3D point on unit sphere
  const x3 = Math.cos(latR) * Math.cos(lngR)
  const y3 = Math.sin(latR)
  const z3 = Math.cos(latR) * Math.sin(lngR)
  // Rotate around Y axis by phi
  const xR = x3 * Math.cos(phi) - z3 * Math.sin(phi)
  const yR = y3
  const zR = x3 * Math.sin(phi) + z3 * Math.cos(phi)
  // Project
  const visible = xR > -0.1  // front hemisphere
  const screenX = cx + xR * r
  const screenY = cy - yR * r
  return { x: screenX, y: screenY, visible, depth: xR }
}

export function CSSGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [pins, setPins] = useState<Array<{ id: string; label: string; flag: string; x: number; y: number; visible: boolean; depth: number }>>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const dwellRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE = canvas.offsetWidth || 500
    canvas.width = SIZE * devicePixelRatio
    canvas.height = SIZE * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const cx = SIZE / 2
    const cy = SIZE / 2
    const r = SIZE * 0.46

    // Preload map texture
    const img = new Image()
    img.src = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg'

    let imgLoaded = false
    img.onload = () => { imgLoaded = true }

    function drawGlobe() {
      if (!ctx) return
      ctx.clearRect(0, 0, SIZE, SIZE)

      const phi = phiRef.current

      // Outer glow
      const glow = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r * 1.15)
      glow.addColorStop(0, 'rgba(59,130,246,0.0)')
      glow.addColorStop(0.85, 'rgba(59,130,246,0.08)')
      glow.addColorStop(1, 'rgba(99,102,241,0.22)')
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Globe base
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      // Dark ocean base
      const oceanGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
      oceanGrad.addColorStop(0, '#1a3a6e')
      oceanGrad.addColorStop(0.5, '#0d2050')
      oceanGrad.addColorStop(1, '#060e2a')
      ctx.fillStyle = oceanGrad
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

      // Longitude/latitude grid
      ctx.strokeStyle = 'rgba(59,130,246,0.12)'
      ctx.lineWidth = 0.5

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const latR = (lat * Math.PI) / 180
        const rowR = Math.cos(latR) * r
        const rowY = cy - Math.sin(latR) * r
        if (rowR > 0) {
          ctx.beginPath()
          ctx.ellipse(cx, rowY, rowR, rowR * 0.18, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Longitude lines
      for (let lng = 0; lng < 360; lng += 30) {
        const lngR = ((lng + phi * 180 / Math.PI) * Math.PI) / 180
        const x1 = cx + Math.cos(lngR) * r
        const x2 = cx - Math.cos(lngR) * r
        ctx.save()
        ctx.globalAlpha = Math.abs(Math.cos(lngR)) * 0.25 + 0.05
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.abs(Math.cos(lngR)) * r, r, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        void x1; void x2
      }

      // Continent blobs (hand-tuned simplified shapes)
      const continents: Array<{ lat: number; lng: number; rLat: number; rLng: number; label: string }> = [
        // North America
        { lat: 45,   lng: -100, rLat: 22, rLng: 28, label: 'NA' },
        // South America
        { lat: -15,  lng: -58,  rLat: 20, rLng: 14, label: 'SA' },
        // Europe
        { lat: 50,   lng: 15,   rLat: 12, rLng: 18, label: 'EU' },
        // Africa
        { lat: 5,    lng: 22,   rLat: 28, rLng: 16, label: 'AF' },
        // Asia
        { lat: 45,   lng: 90,   rLat: 22, rLng: 40, label: 'AS' },
        // Australia
        { lat: -25,  lng: 135,  rLat: 12, rLng: 14, label: 'AU' },
        // Greenland
        { lat: 72,   lng: -42,  rLat: 8,  rLng: 10, label: 'GL' },
      ]

      continents.forEach(({ lat, lng, rLat, rLng }) => {
        const latR = (lat * Math.PI) / 180
        const lngR = (lng * Math.PI) / 180
        const x3 = Math.cos(latR) * Math.cos(lngR)
        const z3 = Math.cos(latR) * Math.sin(lngR)
        const xR = x3 * Math.cos(phi) - z3 * Math.sin(phi)
        if (xR < -0.05) return // behind

        const centerX = cx + (x3 * Math.cos(phi) - z3 * Math.sin(phi)) * r
        const centerY = cy - Math.sin(latR) * r
        const radiusX = (rLng / 180) * r * Math.PI * 0.5 * Math.abs(Math.cos(phi - (lng * Math.PI) / 180))
        const radiusY = (rLat / 180) * r * Math.PI * 0.5

        if (radiusX < 1) return

        const cGrad = ctx.createRadialGradient(centerX - radiusX * 0.2, centerY - radiusY * 0.2, 0, centerX, centerY, Math.max(radiusX, radiusY))
        cGrad.addColorStop(0, 'rgba(37,99,180,0.55)')
        cGrad.addColorStop(0.6, 'rgba(29,78,140,0.40)')
        cGrad.addColorStop(1, 'rgba(15,40,80,0.20)')

        ctx.beginPath()
        ctx.ellipse(centerX, centerY, Math.max(radiusX, 2), Math.max(radiusY, 2), 0, 0, Math.PI * 2)
        ctx.fillStyle = cGrad
        ctx.fill()
      })

      // Specular highlight
      const spec = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.2, cy - r * 0.2, r * 0.7)
      spec.addColorStop(0, 'rgba(255,255,255,0.12)')
      spec.addColorStop(0.4, 'rgba(255,255,255,0.04)')
      spec.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = spec
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

      ctx.restore()

      // Edge glow ring
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      const ringGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r)
      ringGrad.addColorStop(0, 'rgba(59,130,246,0)')
      ringGrad.addColorStop(1, 'rgba(99,102,241,0.55)')
      ctx.strokeStyle = ringGrad
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.restore()
    }

    function tick() {
      phiRef.current += 0.004

      dwellRef.current++
      if (dwellRef.current >= 180) {
        dwellRef.current = 0
        setActiveIdx(i => (i + 1) % PINS.length)
      }

      drawGlobe()

      const phi = phiRef.current
      const next = PINS.map(p => latLngToXY(p.lat, p.lng, phi, r, cx, cy))
      setPins(PINS.map((p, i) => ({ ...p, ...next[i] })))

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div className="relative w-full aspect-square select-none">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
      />
      {/* Pin overlays */}
      {pins.map((pin, i) => {
        if (!pin.visible) return null
        const isActive = i === activeIdx
        return (
          <div
            key={pin.id}
            style={{
              position: 'absolute',
              left: `${(pin.x / (canvasRef.current?.offsetWidth || 500)) * 100}%`,
              top: `${(pin.y / (canvasRef.current?.offsetHeight || 500)) * 100}%`,
              transform: 'translate(-50%, -100%)',
              opacity: isActive ? 1 : 0.6,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              zIndex: isActive ? 10 : 5,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key={pin.id + '-label'}
                    initial={{ opacity: 0, y: 4, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.85 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      marginBottom: 4,
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'rgba(15,23,42,0.92)',
                      border: '1px solid rgba(96,165,250,0.5)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 0 12px rgba(96,165,250,0.25)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{pin.flag}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>{pin.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Dot */}
              <div style={{
                width: isActive ? 10 : 7,
                height: isActive ? 10 : 7,
                borderRadius: '50%',
                background: '#60a5fa',
                boxShadow: isActive
                  ? '0 0 0 3px rgba(96,165,250,0.3), 0 0 14px rgba(96,165,250,0.7)'
                  : '0 0 6px rgba(96,165,250,0.5)',
                transition: 'width 0.3s, height 0.3s',
              }} />
              {/* Stem */}
              <div style={{
                width: 1.5,
                height: isActive ? 14 : 8,
                background: 'rgba(96,165,250,0.7)',
                transition: 'height 0.3s',
              }} />
              {/* Base */}
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(147,197,253,0.5)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
