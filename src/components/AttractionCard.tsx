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
  if (attraction.imageUrl) return attraction.imageUrl;
  const query = attraction.imageSearchQuery || `${attraction.name} ${countryName}`;
  // Use Wikimedia Commons search as primary — free, no key, high quality
  const keywords = query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 3).join(',');
  return `https://loremflickr.com/800/600/${encodeURIComponent(keywords)}`;
}

export const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, countryName }) => {
  const [imageSrc, setImageSrc] = useState(() => buildImageSrc(attraction, countryName));
  const [fallbackStage, setFallbackStage] = useState(0);

  const handleError = () => {
    if (fallbackStage === 0) {
      const simpleQuery = encodeURIComponent(attraction.name.split(/\s+/).slice(0, 2).join(','));
      setImageSrc(`https://loremflickr.com/800/600/${simpleQuery}`);
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setImageSrc(`https://loremflickr.com/800/600/${encodeURIComponent(countryName)},travel`);
      setFallbackStage(2);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-[#e8dfd2] shadow-sm hover:shadow-md hover:border-[#b07a3a]/30 transition-all group">
      <div className="w-full sm:w-2/5 h-52 sm:h-auto shrink-0 relative overflow-hidden bg-[#e8dfd2]">
        <img
          src={imageSrc}
          alt={attraction.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
        {/* City badge overlay */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          {attraction.city}
        </div>
      </div>
      <div className="p-5 flex flex-col justify-center flex-1">
        <h3 className="font-bold text-lg text-[#1a1208] mb-2 leading-snug">{attraction.name}</h3>
        <p className="text-[#6b5740] text-sm mb-4 leading-relaxed">{attraction.famousFor}</p>
        <div className="mt-auto pt-3 border-t border-[#e8dfd2]">
          <p className="text-xs text-[#9c8470] italic leading-relaxed">
            <span className="font-semibold text-[#b07a3a] not-italic">Fact: </span>
            {attraction.interestingFact}
          </p>
        </div>
      </div>
    </div>
  );
}