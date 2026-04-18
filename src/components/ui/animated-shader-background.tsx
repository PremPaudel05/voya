const AnimatedShaderBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Deep space base */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* Aurora layer 1 — teal/green */}
      <div
        className="absolute"
        style={{
          top: '-20%', left: '-10%', width: '70%', height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.10) 40%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora1 14s ease-in-out infinite alternate',
        }}
      />

      {/* Aurora layer 2 — blue/indigo */}
      <div
        className="absolute"
        style={{
          top: '-10%', right: '-15%', width: '65%', height: '55%',
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.12) 40%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'aurora2 18s ease-in-out infinite alternate',
        }}
      />

      {/* Aurora layer 3 — purple accent */}
      <div
        className="absolute"
        style={{
          top: '10%', left: '25%', width: '55%', height: '45%',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.13) 0%, rgba(99,102,241,0.07) 50%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora3 22s ease-in-out infinite alternate',
        }}
      />

      {/* Shooting star 1 */}
      <div
        className="absolute"
        style={{
          top: '12%', left: '15%', width: '120px', height: '1.5px',
          background: 'linear-gradient(90deg, transparent, rgba(99,210,255,0.9), transparent)',
          transform: 'rotate(-35deg)',
          animation: 'shoot1 8s ease-in-out infinite',
          borderRadius: '999px',
        }}
      />

      {/* Shooting star 2 */}
      <div
        className="absolute"
        style={{
          top: '7%', left: '55%', width: '80px', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(180,140,255,0.85), transparent)',
          transform: 'rotate(-30deg)',
          animation: 'shoot2 12s ease-in-out infinite',
          borderRadius: '999px',
        }}
      />

      {/* Star field — small static dots */}
      <div className="absolute inset-0" style={{ backgroundImage: `
        radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 22% 40%, rgba(255,255,255,0.4) 0%, transparent 100%),
        radial-gradient(1px 1px at 35% 8%,  rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1px 1px at 48% 55%, rgba(255,255,255,0.3) 0%, transparent 100%),
        radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1px 1px at 72% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
        radial-gradient(1px 1px at 85% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 92% 45%, rgba(255,255,255,0.3) 0%, transparent 100%),
        radial-gradient(1px 1px at 5%  80%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1px 1px at 18% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
        radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
        radial-gradient(1px 1px at 44% 30%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1px 1px at 57% 90%, rgba(255,255,255,0.4) 0%, transparent 100%),
        radial-gradient(1px 1px at 68% 5%,  rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1px 1px at 78% 38%, rgba(255,255,255,0.3) 0%, transparent 100%),
        radial-gradient(1px 1px at 88% 75%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 14% 28%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 40% 72%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 65% 50%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 90% 22%, rgba(255,255,255,0.7) 0%, transparent 100%)
      `}} />

      <style>{`
        @keyframes aurora1 {
          0%   { transform: translate(0%, 0%)   scale(1);    opacity: 0.7; }
          33%  { transform: translate(8%, 12%)  scale(1.1);  opacity: 1;   }
          66%  { transform: translate(-5%, 8%)  scale(0.95); opacity: 0.8; }
          100% { transform: translate(12%, -5%) scale(1.05); opacity: 0.9; }
        }
        @keyframes aurora2 {
          0%   { transform: translate(0%, 0%)    scale(1);    opacity: 0.6; }
          33%  { transform: translate(-10%, 8%)  scale(1.08); opacity: 0.9; }
          66%  { transform: translate(6%, -10%)  scale(1.02); opacity: 0.7; }
          100% { transform: translate(-8%, 5%)   scale(0.97); opacity: 1;   }
        }
        @keyframes aurora3 {
          0%   { transform: translate(0%, 0%)   scale(1);    opacity: 0.5; }
          50%  { transform: translate(5%, -8%)  scale(1.12); opacity: 0.8; }
          100% { transform: translate(-6%, 6%)  scale(0.98); opacity: 0.6; }
        }
        @keyframes shoot1 {
          0%   { opacity: 0; transform: rotate(-35deg) translateX(-60px); }
          5%   { opacity: 1; }
          15%  { opacity: 0; transform: rotate(-35deg) translateX(80px);  }
          100% { opacity: 0; transform: rotate(-35deg) translateX(80px);  }
        }
        @keyframes shoot2 {
          0%   { opacity: 0; transform: rotate(-30deg) translateX(-40px); }
          40%  { opacity: 0; }
          45%  { opacity: 1; }
          55%  { opacity: 0; transform: rotate(-30deg) translateX(60px);  }
          100% { opacity: 0; transform: rotate(-30deg) translateX(60px);  }
        }
      `}</style>
    </div>
  );
};

export default AnimatedShaderBackground;
