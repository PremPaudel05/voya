import { useNavigate } from 'react-router-dom';
import { Hero } from './components/Hero';
import { LandingFeatures } from './components/LandingFeatures';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';

export default function App() {
  const navigate = useNavigate();

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
      <AboutSection />
      <Footer />
    </div>
  );
}
