import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from './components/Hero';
import { LandingFeatures } from './components/LandingFeatures';
import { Footer } from './components/Footer';

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSearch = (country: string) => {
    const trimmed = country.trim();
    if (trimmed) {
      navigate(`/country/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <Hero onSearch={handleSearch} isLoading={false} />
      <LandingFeatures />
      <Footer />
    </div>
  );
}
