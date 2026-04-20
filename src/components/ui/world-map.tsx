import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PINS = [
  { id: 'france',   label: 'France',        flag: '🇫🇷', x: 48.5,  y: 28.5  },
  { id: 'spain',    label: 'Spain',         flag: '🇪🇸', x: 45.2,  y: 31.5  },
  { id: 'usa',      label: 'United States', flag: '🇺🇸', x: 19.5,  y: 34.0  },
  { id: 'china',    label: 'China',         flag: '🇨🇳', x: 73.5,  y: 30.0  },
  { id: 'italy',    label: 'Italy',         flag: '🇮🇹', x: 51.0,  y: 30.5  },
  { id: 'turkey',   label: 'Turkey',        flag: '🇹🇷', x: 57.5,  y: 30.0  },
  { id: 'mexico',   label: 'Mexico',        flag: '🇲🇽', x: 16.5,  y: 38.5  },
  { id: 'thailand', label: 'Thailand',      flag: '🇹🇭', x: 75.5,  y: 41.5  },
  { id: 'germany',  label: 'Germany',       flag: '🇩🇪', x: 50.5,  y: 25.5  },
  { id: 'japan',    label: 'Japan',         flag: '🇯🇵', x: 82.5,  y: 29.0  },
]

export function WorldMap({ onSearch }: { onSearch?: (country: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '2 / 1' }}>
      {/* Map image */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/2560px-World_map_-_low_resolution.svg.png"
        alt="World Map"
        className="w-full h-full object-cover"
        style={{ filter: 'brightness(0.55) saturate(0.7) hue-rotate(200deg)' }}
        draggable={false}
      />

      {/* Blue ocean tint overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5, 20, 60, 0.45)', mixBlendMode: 'multiply' }}
      />

      {/* Grid lines overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 50"
        preserveAspectRatio="none"
      >
        {[10, 20, 30, 40].map(y => (
          <line key={`lat-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(96,165,250,0.08)" strokeWidth="0.15" />
        ))}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => (
          <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="50" stroke="rgba(96,165,250,0.08)" strokeWidth="0.15" />
        ))}
      </svg>

      {/* Pins */}
      {PINS.map((pin) => {
        const isHovered = hovered === pin.id
        return (
          <div
            key={pin.id}
            className="absolute"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: isHovered ? 20 : 10,
              cursor: onSearch ? 'pointer' : 'default',
            }}
            onMouseEnter={() => setHovered(pin.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSearch?.(pin.label)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Tooltip label */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      marginBottom: 5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'rgba(10,20,50,0.92)',
                      border: '1px solid rgba(96,165,250,0.5)',
                      borderRadius: 6,
                      padding: '4px 9px',
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 0 14px rgba(96,165,250,0.3)',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{pin.flag}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.03em' }}>{pin.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pulse ring */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'rgba(96,165,250,0.5)',
                  }}
                />
                {/* Dot */}
                <div style={{
                  width: isHovered ? 10 : 7,
                  height: isHovered ? 10 : 7,
                  borderRadius: '50%',
                  background: isHovered ? '#93c5fd' : '#60a5fa',
                  boxShadow: isHovered
                    ? '0 0 0 3px rgba(96,165,250,0.35), 0 0 16px rgba(96,165,250,0.8)'
                    : '0 0 8px rgba(96,165,250,0.6)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }} />
              </div>

              {/* Stem */}
              <div style={{
                width: 1.5,
                height: isHovered ? 14 : 9,
                background: 'rgba(96,165,250,0.7)',
                transition: 'height 0.2s',
              }} />
              {/* Base dot */}
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(147,197,253,0.4)' }} />
            </div>
          </div>
        )
      })}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.7))' }} />
      <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none"
        style={{ background: 'linear-gradient(to top, transparent, rgba(2,6,23,0.5))' }} />
      <div className="absolute top-0 left-0 bottom-0 w-8 pointer-events-none"
        style={{ background: 'linear-gradient(to left, transparent, rgba(2,6,23,0.5))' }} />
      <div className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(2,6,23,0.5))' }} />
    </div>
  )
}
