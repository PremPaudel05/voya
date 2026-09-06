import React, { useState } from 'react';

interface AttractionCardProps {
  attraction: {
    name: string;
    city: string;
    famousFor: string;
    interestingFact: string;
    imageSearchQuery?: string;
    imageUrl?: string;
  };
  countryName: string;
}

function buildImageSrc(attraction: AttractionCardProps['attraction'], countryName: string): string {
  return `/api/image?${new URLSearchParams({ name: attraction.name, country: countryName })}`;
}

export const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, countryName }) => {
  const imageSrc = buildImageSrc(attraction, countryName);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div className="flex flex-col sm:flex-row bg-surface rounded-2xl overflow-hidden border border-line shadow-sm hover:shadow-md hover:border-accent/30 transition-all group">
      <div className="w-full sm:w-2/5 h-52 sm:h-auto shrink-0 relative overflow-hidden bg-surface-alt">
        {failedSrc !== imageSrc ? <img
          src={imageSrc}
          alt={attraction.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailedSrc(imageSrc)}
        /> : <div className="flex items-center justify-center h-full min-h-52 p-6 text-center text-sm text-muted" role="img" aria-label={`Photo unavailable for ${attraction.name}`}>Photo unavailable</div>}
        {/* City badge overlay */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          {attraction.city}
        </div>
      </div>
      <div className="p-5 flex flex-col justify-center flex-1">
        <h3 className="font-bold text-lg text-ink mb-2 leading-snug">{attraction.name}</h3>
        <p className="text-muted text-sm mb-4 leading-relaxed">{attraction.famousFor}</p>
        <div className="mt-auto pt-3 border-t border-line">
          <p className="text-xs text-subtle italic leading-relaxed">
            <span className="font-semibold text-accent not-italic">Fact: </span>
            {attraction.interestingFact}
          </p>
        </div>
      </div>
    </div>
  );
}
