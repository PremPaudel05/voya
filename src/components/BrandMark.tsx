// Transparent Story Globe artwork, shared across Voya's branding areas.
export function BrandMark({ className = 'h-12 w-12 sm:h-[52px] sm:w-[52px]' }: { className?: string }) {
  return (
    <img
      src="/brand/voya-globe.webp"
      width="52"
      height="52"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`brand-mark block shrink-0 object-contain ${className}`}
    />
  );
}
