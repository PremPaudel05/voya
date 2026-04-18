import { useEffect, useRef, useState, type MutableRefObject } from "react"
import { motion, AnimatePresence } from "framer-motion"

const PI = Math.PI

// Top 5 most visited countries — capital/major city coordinates
const PINS = [
  { id: "france",  label: "France",        flag: "🇫🇷", lat: 48.8566,   lng:   2.3522  },
  { id: "spain",   label: "Spain",         flag: "🇪🇸", lat: 40.4168,   lng:  -3.7038  },
  { id: "usa",     label: "United States", flag: "🇺🇸", lat: 38.8951,   lng: -77.0364  },
  { id: "china",   label: "China",         flag: "🇨🇳", lat: 39.9042,   lng: 116.4074  },
  { id: "italy",   label: "Italy",         flag: "🇮🇹", lat: 41.9028,   lng:  12.4964  },
]

// Exact replica of cobe's internal U() function: lat/lng -> 3D unit sphere
function latLngTo3D(lat: number, lng: number): [number, number, number] {
  const latR = (lat * PI) / 180
  const lngR = (lng * PI) / 180 - PI
  const cosLat = Math.cos(latR)
  return [
    -cosLat * Math.cos(lngR),
     Math.sin(latR),
     cosLat * Math.sin(lngR),
  ]
}

// Exact replica of cobe's internal O() function: 3D point -> screen coords
function project(
  point: [number, number, number],
  phi: number,
  theta: number,
  elevation: number,
): { x: number; y: number; visible: boolean; depth: number } {
  const t: [number, number, number] = [
    point[0] * elevation,
    point[1] * elevation,
    point[2] * elevation,
  ]
  const cosT = Math.cos(theta), cosP = Math.cos(phi)
  const sinT = Math.sin(theta), sinP = Math.sin(phi)

  const cx = cosP * t[0] + sinP * t[2]
  const cy = sinP * sinT * t[0] + cosT * t[1] - cosP * sinT * t[2]
  const cz = -sinP * cosT * t[0] + sinT * t[1] + cosP * cosT * t[2]

  const visible = !(cz < 0 && cx * cx + cy * cy < 0.64)

  return {
    x: (cx + 1) / 2,
    y: (-cy + 1) / 2,
    visible,
    depth: cz,
  }
}

interface PinData {
  id: string
  label: string
  flag: string
  x: number
  y: number
  visible: boolean
  depth: number
}

interface GlobePinsProps {
  // Refs to the globe's live phi/theta so pins track rotation exactly
  phiRef: MutableRefObject<number>
  thetaRef: MutableRefObject<number>
  elevation?: number
}

export function GlobePins({ phiRef, thetaRef, elevation = 0.82 }: GlobePinsProps) {
  const [pins, setPins] = useState<PinData[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const frameRef = useRef<number>(0)
  const dwellRef = useRef(0)
  const DWELL = 200

  // Pre-compute 3D positions once
  const points3D = PINS.map(p => latLngTo3D(p.lat, p.lng))

  useEffect(() => {
    let active = 0
    let dwell = 0

    function tick() {
      const phi = phiRef.current
      const theta = thetaRef.current

      dwell++
      if (dwell >= DWELL) {
        dwell = 0
        active = (active + 1) % PINS.length
        setActiveIdx(active)
      }
      dwellRef.current = dwell

      const next: PinData[] = PINS.map((p, i) => {
        const proj = project(points3D[i], phi, theta, elevation)
        return { id: p.id, label: p.label, flag: p.flag, ...proj }
      })
      setPins(next)

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phiRef, thetaRef, elevation])

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: "50%", overflow: "hidden" }}>
      {pins.map((pin, i) => {
        if (!pin.visible) return null
        const isActive = i === activeIdx
        const opacity = isActive ? 1 : 0.55

        return (
          <div
            key={pin.id}
            style={{
              position: "absolute",
              left: `${pin.x * 100}%`,
              top: `${pin.y * 100}%`,
              transform: "translate(-50%, -100%)",
              opacity,
              transition: "opacity 0.4s ease",
              marginTop: "-10px", // lift pin above the dot centre
            }}
          >
            <div className="flex flex-col items-center gap-0">
              {/* Label bubble — only shown for active */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key={pin.id + "-label"}
                    initial={{ opacity: 0, y: 4, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.85 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="mb-1 flex items-center gap-1 bg-slate-900/90 border border-blue-400/50 rounded-md px-2 py-0.5 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    style={{ backdropFilter: "blur(8px)" }}
                  >
                    <span className="text-[11px]">{pin.flag}</span>
                    <span className="text-[10px] font-semibold text-white leading-none">{pin.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pin needle */}
              <div
                className="rounded-full bg-blue-400 shadow-md shadow-blue-400/60"
                style={{
                  width:  isActive ? 10 : 7,
                  height: isActive ? 10 : 7,
                  transition: "width 0.3s ease, height 0.3s ease",
                  boxShadow: isActive
                    ? "0 0 0 3px rgba(96,165,250,0.3), 0 0 12px rgba(96,165,250,0.6)"
                    : "0 0 6px rgba(96,165,250,0.4)",
                }}
              />
              {/* Stem */}
              <div
                className="bg-blue-400/70"
                style={{ width: 1.5, height: isActive ? 14 : 8, transition: "height 0.3s ease" }}
              />
              {/* Base dot */}
              <div className="w-1 h-1 rounded-full bg-blue-300/60" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
