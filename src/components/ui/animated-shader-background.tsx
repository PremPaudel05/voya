const AnimatedShaderBackground = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ background: '#020617' }}>

    {/* Aurora blob 1 — teal/cyan */}
    <div style={{
      position: 'absolute', top: '-25%', left: '-10%',
      width: '75%', height: '80%',
      background: 'radial-gradient(ellipse at 40% 40%, rgba(16,185,129,0.35) 0%, rgba(6,182,212,0.20) 35%, transparent 65%)',
      filter: 'blur(50px)',
      animation: 'voya-a1 16s ease-in-out infinite alternate',
    }} />

    {/* Aurora blob 2 — indigo/blue */}
    <div style={{
      position: 'absolute', top: '-25%', right: '-15%',
      width: '75%', height: '75%',
      background: 'radial-gradient(ellipse at 55% 40%, rgba(99,102,241,0.38) 0%, rgba(59,130,246,0.22) 38%, transparent 65%)',
      filter: 'blur(55px)',
      animation: 'voya-a2 20s ease-in-out infinite alternate',
    }} />

    {/* Aurora blob 3 — violet, centre */}
    <div style={{
      position: 'absolute', top: '0%', left: '15%',
      width: '70%', height: '60%',
      background: 'radial-gradient(ellipse at 50% 45%, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.12) 50%, transparent 70%)',
      filter: 'blur(70px)',
      animation: 'voya-a3 24s ease-in-out infinite alternate',
    }} />

    {/* Shooting star 1 */}
    <div style={{
      position: 'absolute', top: '10%', left: '8%',
      width: '150px', height: '1.5px',
      background: 'linear-gradient(90deg, transparent, rgba(147,210,255,0.95), transparent)',
      borderRadius: '999px',
      transform: 'rotate(-32deg)',
      animation: 'voya-s1 9s ease-in-out infinite',
    }} />

    {/* Shooting star 2 */}
    <div style={{
      position: 'absolute', top: '6%', left: '50%',
      width: '100px', height: '1.5px',
      background: 'linear-gradient(90deg, transparent, rgba(196,160,255,0.9), transparent)',
      borderRadius: '999px',
      transform: 'rotate(-28deg)',
      animation: 'voya-s2 14s ease-in-out infinite',
    }} />

    {/* Shooting star 3 */}
    <div style={{
      position: 'absolute', top: '16%', right: '10%',
      width: '80px', height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(100,200,255,0.85), transparent)',
      borderRadius: '999px',
      transform: 'rotate(-38deg)',
      animation: 'voya-s3 18s ease-in-out infinite',
    }} />

    {/* Star field */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `
      radial-gradient(1px 1px at  8% 12%, rgba(255,255,255,0.70) 0%, transparent 100%),
      radial-gradient(1px 1px at 19% 37%, rgba(255,255,255,0.50) 0%, transparent 100%),
      radial-gradient(1px 1px at 33%  7%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(1px 1px at 47% 52%, rgba(255,255,255,0.40) 0%, transparent 100%),
      radial-gradient(1px 1px at 58% 19%, rgba(255,255,255,0.60) 0%, transparent 100%),
      radial-gradient(1px 1px at 71% 68%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 84% 11%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(1px 1px at 91% 43%, rgba(255,255,255,0.40) 0%, transparent 100%),
      radial-gradient(1px 1px at  4% 78%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1px 1px at 16% 63%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 29% 83%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 42% 28%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1px 1px at 55% 88%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 66%  4%, rgba(255,255,255,0.70) 0%, transparent 100%),
      radial-gradient(1px 1px at 77% 35%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 87% 73%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 13% 26%, rgba(255,255,255,0.80) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 38% 70%, rgba(255,255,255,0.70) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 63% 48%, rgba(255,255,255,0.60) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 89% 20%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(1px 1px at 24% 55%, rgba(200,230,255,0.50) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 90%, rgba(200,230,255,0.40) 0%, transparent 100%),
      radial-gradient(1px 1px at 51% 15%, rgba(200,230,255,0.55) 0%, transparent 100%)
    `}} />

    <style>{`
      @keyframes voya-a1 {
        0%   { transform:translate(0%,0%)   scale(1);    opacity:.85; }
        33%  { transform:translate(7%,10%)  scale(1.08); opacity:1;   }
        66%  { transform:translate(-4%,6%)  scale(0.94); opacity:.88; }
        100% { transform:translate(10%,-4%) scale(1.04); opacity:.92; }
      }
      @keyframes voya-a2 {
        0%   { transform:translate(0%,0%)   scale(1);    opacity:.75; }
        33%  { transform:translate(-9%,7%)  scale(1.06); opacity:.95; }
        66%  { transform:translate(5%,-9%)  scale(1.01); opacity:.78; }
        100% { transform:translate(-7%,4%)  scale(0.96); opacity:1;   }
      }
      @keyframes voya-a3 {
        0%   { transform:translate(0%,0%)  scale(1);    opacity:.65; }
        50%  { transform:translate(4%,-7%) scale(1.10); opacity:.90; }
        100% { transform:translate(-5%,5%) scale(0.97); opacity:.70; }
      }
      @keyframes voya-s1 {
        0%,100% { opacity:0; transform:rotate(-32deg) translateX(-30px); }
        4%      { opacity:1; }
        14%     { opacity:0; transform:rotate(-32deg) translateX(180px); }
      }
      @keyframes voya-s2 {
        0%,38%  { opacity:0; transform:rotate(-28deg) translateX(-20px); }
        43%     { opacity:1; }
        53%,100%{ opacity:0; transform:rotate(-28deg) translateX(120px); }
      }
      @keyframes voya-s3 {
        0%,68%  { opacity:0; transform:rotate(-38deg) translateX(-15px); }
        72%     { opacity:1; }
        80%,100%{ opacity:0; transform:rotate(-38deg) translateX(100px); }
      }
    `}</style>
  </div>
);

export default AnimatedShaderBackground;
