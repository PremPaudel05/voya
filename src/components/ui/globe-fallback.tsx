import React from 'react';

interface GlobeErrorBoundaryProps {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

export class GlobeErrorBoundary extends React.Component<GlobeErrorBoundaryProps, State> {
  constructor(props: GlobeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <CSSGlobe />;
    return this.props.children;
  }
}

function CSSGlobe() {
  return (
    <div className="w-full max-w-[500px] lg:max-w-[600px] flex items-center justify-center">
      <div className="relative aspect-square w-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(59,130,246,0.35) 0%, rgba(99,102,241,0.18) 45%, transparent 70%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="absolute inset-4 rounded-full overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #1e3a6e 0%, #0f1f4a 40%, #060e2a 75%, #020817 100%)',
            boxShadow: '0 0 60px rgba(59,130,246,0.25), inset -20px -20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {[20, 38, 56, 74].map((top) => (
            <div key={top} className="absolute left-[8%] right-[8%] border-t border-blue-500/10" style={{ top: `${top}%` }} />
          ))}
          {[20, 35, 50, 65, 80].map((left) => (
            <div key={left} className="absolute top-[8%] bottom-[8%] border-l border-blue-500/10" style={{ left: `${left}%` }} />
          ))}
          <div className="absolute top-[22%] left-[20%] w-[22%] h-[18%] rounded-[40%_60%_55%_45%] bg-blue-700/30" />
          <div className="absolute top-[40%] left-[18%] w-[14%] h-[22%] rounded-[45%_55%_50%_50%] bg-blue-700/25" />
          <div className="absolute top-[28%] left-[46%] w-[20%] h-[28%] rounded-[50%_45%_55%_50%] bg-blue-700/30" />
          <div className="absolute top-[25%] right-[15%] w-[18%] h-[30%] rounded-[55%_45%_50%_55%] bg-blue-700/25" />
          <div
            className="absolute top-[12%] left-[20%] w-[28%] h-[22%] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
          />
          {[
            { top: 28, left: 48 }, { top: 34, left: 26 }, { top: 30, left: 70 },
            { top: 52, left: 60 }, { top: 44, left: 38 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-blue-400 animate-pulse"
              style={{ top: `${pos.top}%`, left: `${pos.left}%`, boxShadow: '0 0 6px 2px rgba(96,165,250,0.7)', animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </div>
        <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap">
          Drag to rotate
        </p>
      </div>
    </div>
  );
}
