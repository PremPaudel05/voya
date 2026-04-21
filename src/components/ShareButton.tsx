import { useState, useRef, useId } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  countryName: string;
}

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const IconTikTok = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
  </svg>
);

export function ShareButton({ countryName }: ShareButtonProps) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : 'https://voyatravel.vercel.app';

  const encodedUrl = encodeURIComponent(shareUrl);
  const isHomepage = countryName === 'Voya';
  const shareText = isHomepage
    ? 'Voya — your free AI travel guide for every country on Earth'
    : `Explore ${countryName} with Voya — your free AI travel guide`;
  const encodedText = encodeURIComponent(shareText);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: <IconX />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: 'Facebook',
      icon: <IconFacebook />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Instagram',
      icon: <IconInstagram />,
      href: `https://www.instagram.com/`,
    },
    {
      label: 'TikTok',
      icon: <IconTikTok />,
      href: `https://www.tiktok.com/`,
    },
    {
      label: 'Email',
      icon: <Mail size={15} />,
      href: `mailto:?subject=Check out Voya Travel&body=${encodedText}%0A${encodedUrl}`,
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hidden sm:block hover:text-[#1a1208] transition-colors text-sm font-medium text-[#6b5740]">
          Share
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="center" showArrow>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b07a3a]">
            {isHomepage ? 'Share Voya' : `Share ${countryName}`}
          </p>

          <div className="flex gap-2 flex-wrap">
            {shareLinks.map(({ label, icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#e8dfd2] bg-white text-[#6b5740] hover:bg-[#b07a3a] hover:text-white hover:border-[#b07a3a] transition-all"
              >
                {icon}
              </a>
            ))}
          </div>

          <div className="relative">
            <input
              ref={inputRef}
              id={id}
              type="text"
              readOnly
              value={shareUrl}
              aria-label="Share link"
              className="w-full h-9 rounded-lg border border-[#e8dfd2] bg-white px-3 pr-10 text-xs text-[#6b5740] outline-none focus:border-[#b07a3a]"
            />
            <button
              onClick={handleCopy}
              disabled={copied}
              aria-label={copied ? 'Copied' : 'Copy link'}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-9 text-[#9c8470] hover:text-[#b07a3a] transition-colors disabled:pointer-events-none"
            >
              <div className={cn('transition-all absolute', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
                <Check size={14} className="stroke-emerald-500" />
              </div>
              <div className={cn('transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
                <Copy size={14} />
              </div>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
