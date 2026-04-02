import React, { useState } from 'react';

interface AttractionCardProps {
  attraction: {
    name: string;
    city: string;
    famousFor: string;
    interestingFact: string;
    imageSearchQuery?: string;
  };
  countryName: string;
}

export const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, countryName }) => {
  const query = attraction.imageSearchQuery || `${attraction.name} ${attraction.city} ${countryName}`;
  const [imageSrc, setImageSrc] = useState(`/api/image?q=${encodeURIComponent(query)}`);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative group">
      <div className="w-full sm:w-2/5 h-48 sm:h-auto shrink-0 relative overflow-hidden bg-slate-200">
        <img 
          src={imageSrc} 
          alt={attraction.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => {
            if (!hasError) {
              setHasError(true);
              setImageSrc(`https://picsum.photos/seed/${encodeURIComponent(attraction.name)}/400/300`);
            }
          }}
        />
      </div>
      <div className="p-5 flex flex-col justify-center flex-1">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          {attraction.city}
        </div>
        <h3 className="font-bold text-xl text-slate-800 mb-2">{attraction.name}</h3>
        <p className="text-slate-600 text-sm mb-3">{attraction.famousFor}</p>
        <div className="mt-auto pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 italic">
            <span className="font-semibold text-slate-700 not-italic">Fact: </span>
            {attraction.interestingFact}
          </p>
        </div>
      </div>
    </div>
  );
}