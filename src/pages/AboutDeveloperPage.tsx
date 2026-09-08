import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AboutSection } from '../components/AboutSection';
import { Footer } from '../components/Footer';
import { SiteHeader } from '../components/SiteHeader';
import { usePreferences } from '../preferences/PreferencesContext';

export default function AboutDeveloperPage() {
  const { t } = usePreferences();
  const title = t('About Developer');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Voya`;
    return () => { document.title = previousTitle; };
  }, [title]);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <SiteHeader />
      <main>
        <div className="max-w-7xl mx-auto px-6 pt-10 sm:pt-14 pb-8">
          <Link to="/" className="inline-flex items-center gap-2 min-h-10 text-sm text-muted hover:text-ink transition-colors mb-5">
            <ArrowLeft size={16} aria-hidden="true" />
            {t('Back to exploring')}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{title}</h1>
        </div>
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
