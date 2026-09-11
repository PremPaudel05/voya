// Geometry from the supplied icon_final.svg; colors follow the active site theme.
// The unmodified source asset is preserved at /brand/voya-compass.svg.
export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" width="40" height="40" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
  
  <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ink)" strokeWidth="3"/>
  <g fill="var(--ink)">
    <circle cx="100" cy="10" r="2.4"/>
    <circle cx="100" cy="190" r="2.4"/>
    <circle cx="10" cy="100" r="2.4"/>
    <circle cx="190" cy="100" r="2.4"/>
  </g>

  
  <g transform="translate(100,100)">
    
    <path d="M 0 0 L -4.6 -21.5 L 0 -78 L 4.6 -21.5 Z" fill="var(--ink)"/>
    <path d="M 0 0 L 21.5 -4.6 L 78 0 L 21.5 4.6 Z" fill="var(--ink)"/>
    <path d="M 0 0 L 4.6 21.5 L 0 78 L -4.6 21.5 Z" fill="var(--ink)"/>
    <path d="M 0 0 L -21.5 4.6 L -78 0 L -21.5 -4.6 Z" fill="var(--ink)"/>

    
    <path d="M 0 0 L 12 -18.5 L 35.4 -35.4 L 18.5 -12 Z" fill="var(--accent)"/>
    <path d="M 0 0 L 18.5 12 L 35.4 35.4 L 12 18.5 Z" fill="var(--accent)"/>
    <path d="M 0 0 L -12 18.5 L -35.4 35.4 L -18.5 12 Z" fill="var(--accent)"/>
    <path d="M 0 0 L -18.5 -12 L -35.4 -35.4 L -12 -18.5 Z" fill="var(--accent)"/>

    
    <circle cx="0" cy="0" r="9" fill="var(--ink)"/>
    <circle cx="0" cy="0" r="3.5" fill="var(--canvas)"/>
  </g>
    </svg>
  );
}
