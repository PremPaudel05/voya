import React from 'react';

interface GlowingSearchWrapperProps {
  children: React.ReactNode;
}

const GlowingSearchWrapper = ({ children }: GlowingSearchWrapperProps) => {
  return (
    <div className="relative flex items-center justify-center w-full">
      <div id="poda" className="relative flex items-center justify-center group w-full">

        {/* Layer 1 — outermost conic glow */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[3px]
          before:absolute before:content-[''] before:z-[-2]
          before:w-[999px] before:h-[999px]
          before:bg-no-repeat before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:rotate-[60deg]
          before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-120deg]
          group-focus-within:before:rotate-[420deg]
          group-focus-within:before:duration-[4000ms]" />

        {/* Layer 2 — inner purple/magenta ring */}
        <div className="absolute z-[-1] overflow-hidden h-[calc(100%-4px)] w-[calc(100%-2px)] rounded-full blur-[3px]
          before:absolute before:content-[''] before:z-[-2]
          before:w-[600px] before:h-[600px]
          before:bg-no-repeat before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:rotate-[82deg]
          before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-98deg]
          group-focus-within:before:rotate-[442deg]
          group-focus-within:before:duration-[4000ms]" />

        {/* Layer 3 — duplicate for intensity */}
        <div className="absolute z-[-1] overflow-hidden h-[calc(100%-4px)] w-[calc(100%-2px)] rounded-full blur-[3px]
          before:absolute before:content-[''] before:z-[-2]
          before:w-[600px] before:h-[600px]
          before:bg-no-repeat before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:rotate-[82deg]
          before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-98deg]
          group-focus-within:before:rotate-[442deg]
          group-focus-within:before:duration-[4000ms]" />

        {/* Layer 4 — soft lavender shimmer */}
        <div className="absolute z-[-1] overflow-hidden h-[calc(100%-6px)] w-[calc(100%-4px)] rounded-full blur-[2px]
          before:absolute before:content-[''] before:z-[-2]
          before:w-[600px] before:h-[600px]
          before:bg-no-repeat before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:rotate-[83deg]
          before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)]
          before:brightness-[1.4]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-97deg]
          group-focus-within:before:rotate-[443deg]
          group-focus-within:before:duration-[4000ms]" />

        {/* Layer 5 — dark fill with subtle colour */}
        <div className="absolute z-[-1] overflow-hidden h-[calc(100%-8px)] w-[calc(100%-6px)] rounded-full blur-[0.5px]
          before:absolute before:content-[''] before:z-[-2]
          before:w-[600px] before:h-[600px]
          before:bg-no-repeat before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:rotate-[70deg]
          before:bg-[conic-gradient(#0d0d1a,#402fb5_5%,#0d0d1a_14%,#0d0d1a_50%,#cf30aa_60%,#0d0d1a_64%)]
          before:brightness-[1.3]
          before:transition-all before:duration-[2000ms]
          group-hover:before:rotate-[-110deg]
          group-focus-within:before:rotate-[430deg]
          group-focus-within:before:duration-[4000ms]" />

        {/* Actual content */}
        <div className="relative w-full z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GlowingSearchWrapper;
