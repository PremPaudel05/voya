import { useMemo, useRef } from "react";
import { motion } from "framer-motion";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  showLabels?: boolean;
  animationDuration?: number;
  loop?: boolean;
}

export function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
  showLabels = true,
  animationDuration = 2,
  loop = true,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // The dotted world is pre-rendered (public/world-dots.svg) instead of being
  // computed from country outlines in the browser on every visit.
  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Nearby cities (London, Paris, Moscow) would stack their labels, so each
  // label takes the first free spot around its dot.
  const labels = useMemo(() => layoutLabels(dots.flatMap((dot, i) => [
    { key: `${i}-start`, point: dot.start, delay: 0.5 * i + 0.3 },
    { key: `${i}-end`, point: dot.end, delay: 0.5 * i + 0.5 },
  ]).map(item => ({ ...item, ...projectPoint(item.point.lat, item.point.lng), label: item.point.label }))), [dots]);

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div className="w-full aspect-[2/1] relative font-sans overflow-hidden"
      style={{ background: 'transparent' }}>
      {/* A mask lets the dots use the current theme and fade into any canvas. */}
      <div
        className="h-full w-full pointer-events-none select-none object-cover"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, white 12%, white 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, white 8%, white 92%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, white 12%, white 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, white 8%, white 92%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <div role="img" aria-label="World map" className="h-full w-full"
          style={{
            backgroundColor: 'var(--map-dot)',
            maskImage: 'url("/world-dots.svg")', WebkitMaskImage: 'url("/world-dots.svg")',
            maskSize: 'cover', maskRepeat: 'no-repeat', maskPosition: 'center',
            WebkitMaskSize: 'cover', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
          }} />
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;
          const path = createCurvedPath(startPoint, endPoint);

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={path}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1.25"
                initial={{ pathLength: 0 }}
                animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={
                  loop
                    ? {
                        duration: fullCycleDuration,
                        times: [0, startTime, endTime, resetTime, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                      }
                    : { duration: animationDuration, delay: i * staggerDelay, ease: "easeInOut" }
                }
              />
              {loop && (
                <motion.circle
                  r="4"
                  fill={lineColor}
                  initial={{ offsetDistance: "0%", opacity: 0 }}
                  animate={{
                    offsetDistance: [null, "0%", "100%", "100%", "100%"],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                  style={{ offsetPath: `path('${path}')` }}
                />
              )}
            </g>
          );
        })}

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          return (
            <g key={`points-group-${i}`}>
              {/* Start point */}
              <motion.g
                className="cursor-pointer"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <circle cx={startPoint.x} cy={startPoint.y} r="3" fill={lineColor} filter="url(#glow)" />
                <circle cx={startPoint.x} cy={startPoint.y} r="3" fill={lineColor} opacity="0.5">
                  <animate attributeName="r" from="3" to="12" dur="2s" begin="0s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0s" repeatCount="indefinite" />
                </circle>
              </motion.g>

              {/* End point */}
              <motion.g
                className="cursor-pointer"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <circle cx={endPoint.x} cy={endPoint.y} r="3" fill={lineColor} filter="url(#glow)" />
                <circle cx={endPoint.x} cy={endPoint.y} r="3" fill={lineColor} opacity="0.5">
                  <animate attributeName="r" from="3" to="12" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </motion.g>
            </g>
          );
        })}
        {showLabels && labels.map(({ key, x, y, label, rect, delay }) => <CityLabel key={key} x={x} y={y} label={label} rect={rect} delay={delay} lineColor={lineColor} />)}
      </svg>
    </div>
  );
}

const LABEL_H = 22;
const GAP = 9;
type Rect = { x: number; y: number; w: number; h: number };
const overlaps = (a: Rect, b: Rect, pad = 3) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

// Greedy placement: above, below, then the sides; the first spot that stays on
// the visible map and clears every other label and city dot wins.
function layoutLabels<T extends { x: number; y: number; label?: string }>(items: T[]) {
  const dots: Rect[] = items.map(({ x, y }) => ({ x: x - 4, y: y - 4, w: 8, h: 8 }));
  const placed: Rect[] = [];
  return items.flatMap((item, index) => {
    if (!item.label) return [];
    const { x, y } = item;
    const w = Math.round(item.label.length * 5.6 + 18);
    const h = LABEL_H;
    const options: Rect[] = [
      { x: x - w / 2, y: y - h - GAP, w, h }, { x: x - w / 2, y: y + GAP, w, h },
      { x: x + GAP, y: y - h / 2, w, h }, { x: x - GAP - w, y: y - h / 2, w, h },
      { x: x + 2, y: y - h - GAP, w, h }, { x: x - w - 2, y: y - h - GAP, w, h },
      { x: x + 2, y: y + GAP, w, h }, { x: x - w - 2, y: y + GAP, w, h },
    ];
    const free = options.find(rect => rect.x >= 24 && rect.x + rect.w <= 776 && rect.y >= 8 && rect.y + rect.h <= 392 &&
      !placed.some(other => overlaps(rect, other)) && !dots.some((dot, i) => i !== index && overlaps(rect, dot, 1)));
    const rect = free || options[0];
    placed.push(rect);
    return [{ ...item, label: item.label, rect }];
  });
}

function CityLabel({ x, y, label, rect, delay, lineColor }: { x: number; y: number; label: string; rect: Rect; delay: number; lineColor: string }) {
  // Connector from the dot to the nearest edge of its label.
  const ex = Math.min(Math.max(x, rect.x), rect.x + rect.w);
  const ey = Math.min(Math.max(y, rect.y), rect.y + rect.h);
  const length = Math.hypot(ex - x, ey - y) || 1;

  return (
    <motion.g
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none"
    >
      <line x1={x + ((ex - x) / length) * 4} y1={y + ((ey - y) / length) * 4} x2={ex} y2={ey}
        stroke={lineColor} strokeWidth="0.8" strokeOpacity="0.5" />
      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="5" ry="5"
        fill="var(--map-label)" stroke="var(--line)" strokeWidth="0.75" />
      <rect x={rect.x} y={rect.y + 5} width="2.5" height={rect.h - 10} rx="1.5" fill={lineColor} />
      <text
        x={rect.x + 10}
        y={rect.y + rect.h / 2 + 0.5}
        textAnchor="start"
        dominantBaseline="middle"
        fill="var(--map-label-ink)"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.04em"
      >
        {label}
      </text>
    </motion.g>
  );
}
