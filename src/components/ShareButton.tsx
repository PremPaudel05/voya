import { useState, useRef, useId } from 'react';
import { Check, Copy, Share2, Twitter, Facebook, Mail } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  countryName: string;
}

export function ShareButton({ countryName }: ShareButtonProps) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://voyatravel.vercel.app/country/${encodeURIComponent(countryName)}`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const isHomepage = countryName === 'Voya';
  const encodedText = encodeURIComponent(
    isHomepage
      ? 'Voya — your free AI travel guide for every country on Earth'
      : `Explore ${countryName} with Voya — your free AI travel guide`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: <Twitter size={15} />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: 'Facebook',
      icon: <Facebook size={15} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Email',
      icon: <Mail size={15} />,
      href: `mailto:?subject=Check out ${countryName} on Voya&body=${encodedText}%0A${encodedUrl}`,
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1208] text-white text-sm font-semibold hover:bg-[#2d1f0e] transition-colors">
          <Share2 size={15} />
          Share
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end" showArrow>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b07a3a]">{isHomepage ? 'Share Voya' : `Share ${countryName}`}</p>

          {/* Social buttons */}
          <div className="flex gap-2">
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

          {/* Copy link */}
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
