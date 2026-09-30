"use client";

import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import './expanding-cards.css';

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
  linkLabel?: string;
  imgPosition?: string;
}

export interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCards = React.forwardRef<HTMLUListElement, ExpandingCardsProps>(
  ({ className, items, defaultActiveIndex = 0, style, ...props }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(defaultActiveIndex);
    const activeIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));
    const id = React.useId();
    const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
    const gridStyle = React.useMemo(() => ({
      '--expanding-columns': items.map((_, index) => index === activeIndex ? '4fr' : '1fr').join(' '),
      '--expanding-mobile-columns': items.map((_, index) => index === activeIndex ? 'min(76vw, 320px)' : '64px').join(' '),
    } as React.CSSProperties), [activeIndex, items]);

    if (!items.length) return null;

    const moveFocus = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const destinations: Record<string, number> = { ArrowRight: (index + 1) % items.length, ArrowDown: (index + 1) % items.length,
        ArrowLeft: (index - 1 + items.length) % items.length, ArrowUp: (index - 1 + items.length) % items.length,
        Home: 0, End: items.length - 1 };
      const next = destinations[event.key];
      if (next === undefined) return;
      event.preventDefault();
      buttons.current[next]?.focus();
    };

    return (
      <ul {...props} ref={ref} className={cn('expanding-cards w-full max-w-6xl gap-2', className)} style={{ ...gridStyle, ...style }}>
        {items.map((item, index) => {
          const active = activeIndex === index;
          return <li key={item.id} data-active={active}
            className="expanding-card group relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-line bg-card text-card-foreground shadow-sm" style={{ backgroundColor: '#28241f' }}
            onPointerEnter={event => { if (event.pointerType === 'mouse') setSelectedIndex(index); }}
            onFocusCapture={() => setSelectedIndex(index)}>
            <img src={item.imgSrc} alt={item.title} loading="lazy" decoding="async"
              className="expanding-card-image absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: item.imgPosition || 'center' }}
              onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
            <button type="button" ref={element => { buttons.current[index] = element; }}
              className="expanding-card-trigger absolute inset-0 z-10 cursor-pointer rounded-xl"
              aria-expanded={active} aria-controls={`${id}-panel-${index}`} aria-label={`Show ${item.title}`}
              onClick={() => setSelectedIndex(index)} onKeyDown={event => moveFocus(event, index)} />
            <span aria-hidden="true" className="expanding-card-collapsed pointer-events-none absolute text-sm font-semibold tracking-wide text-white">{item.title}</span>
            <article id={`${id}-panel-${index}`} aria-hidden={!active}
              className="expanding-card-details pointer-events-none absolute inset-0 flex flex-col justify-end gap-2 p-5 md:p-6">
              <div aria-hidden="true" className="text-white/90">{item.icon}</div>
              <h3 className="text-xl font-bold leading-tight text-white md:text-2xl">{item.title}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-white/90">{item.description}</p>
              <a href={item.linkHref} tabIndex={active ? 0 : -1}
                className="expanding-card-link pointer-events-auto relative z-20 mt-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-900 hover:bg-stone-100">
                {item.linkLabel || `Explore ${item.title}`}<ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </article>
          </li>;
        })}
      </ul>
    );
  },
);
ExpandingCards.displayName = 'ExpandingCards';
