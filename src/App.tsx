import { useNavigate } from 'react-router-dom';
import { Hero } from './components/Hero';
import { LandingFeatures } from './components/LandingFeatures';

export default function App() {
  const navigate = useNavigate();

  const handleSearch = (country: string) => {
    const trimmed = country.trim();
    if (trimmed) {
      navigate(`/country/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-900">
      <Hero onSearch={handleSearch} isLoading={false} />
      <LandingFeatures />
    </div>
  );
}
