import { BrandMark } from './BrandMark';
import { Link, NavLink } from 'react-router-dom';
import { AccountLink } from './AccountLink';
import { ShareButton } from './ShareButton';
import { usePreferences } from '../preferences/PreferencesContext';

export function SiteHeader({ onExplore }: { onExplore?: () => void }) {
  const { t } = usePreferences();
  const exploreClassName = 'inline-flex items-center justify-center min-h-10 px-4 py-2 rounded-full bg-action text-action-ink text-xs font-semibold hover:bg-action-hover transition-colors whitespace-nowrap';

  return (
    <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur border-b border-line w-full">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" aria-label="Voya home" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-xl font-black tracking-tight text-ink">Voya</span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-accent bg-brand/10 px-2 py-0.5 rounded-full">World</span>
        </Link>
        <nav aria-label="Main navigation" className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:w-auto sm:justify-end sm:gap-x-5 text-sm font-medium text-muted">
          <NavLink
            to="/about-developer"
            className={({ isActive }) => `inline-flex items-center min-h-10 py-2 text-xs sm:text-sm transition-colors ${isActive ? 'text-accent underline underline-offset-4' : 'hover:text-ink'}`}
          >
            {t('About Developer')}
          </NavLink>
          <ShareButton countryName="Voya" />
          <AccountLink />
          {onExplore ? (
            <button onClick={onExplore} className={exploreClassName}>{t('Explore')} →</button>
          ) : (
            <Link to="/" className={exploreClassName}>{t('Explore')} →</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
