const AnimatedShaderBackground = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#020617]">

    {/* Aurora blob 1 — teal/cyan, top-left */}
    <div style={{
      position: 'absolute', top: '-15%', left: '-5%',
      width: '60%', height: '65%',
      background: 'radial-gradient(ellipse at 40% 40%, rgba(16,185,129,0.22) 0%, rgba(6,182,212,0.13) 35%, transparent 68%)',
      filter: 'blur(55px)',
      animation: 'voya-a1 16s ease-in-out infinite alternate',
    }} />

    {/* Aurora blob 2 — indigo/blue, top-right */}
    <div style={{
      position: 'absolute', top: '-20%', right: '-10%',
      width: '58%', height: '60%',
      background: 'radial-gradient(ellipse at 55% 40%, rgba(99,102,241,0.24) 0%, rgba(59,130,246,0.14) 40%, transparent 68%)',
      filter: 'blur(65px)',
      animation: 'voya-a2 20s ease-in-out infinite alternate',
    }} />

    {/* Aurora blob 3 — violet mid */}
    <div style={{
      position: 'absolute', top: '5%', left: '20%',
      width: '55%', height: '50%',
      background: 'radial-gradient(ellipse at 50% 45%, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)',
      filter: 'blur(75px)',
      animation: 'voya-a3 24s ease-in-out infinite alternate',
    }} />

    {/* Shooting star 1 */}
    <div style={{
      position: 'absolute', top: '10%', left: '8%',
      width: '140px', height: '1.5px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(147,210,255,0.95) 50%, transparent 100%)',
      borderRadius: '999px',
      transform: 'rotate(-32deg)',
      animation: 'voya-s1 9s ease-in-out infinite',
    }} />

    {/* Shooting star 2 */}
    <div style={{
      position: 'absolute', top: '6%', left: '52%',
      width: '90px', height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(196,160,255,0.9) 50%, transparent 100%)',
      borderRadius: '999px',
      transform: 'rotate(-28deg)',
      animation: 'voya-s2 14s ease-in-out infinite',
    }} />

    {/* Shooting star 3 */}
    <div style={{
      position: 'absolute', top: '18%', right: '12%',
      width: '70px', height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(100,200,255,0.8) 50%, transparent 100%)',
      borderRadius: '999px',
      transform: 'rotate(-38deg)',
      animation: 'voya-s3 18s ease-in-out infinite',
    }} />

    {/* Static star field */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `
      radial-gradient(1px 1px at  8% 12%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(1px 1px at 19% 37%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 33%  7%, rgba(255,255,255,0.70) 0%, transparent 100%),
      radial-gradient(1px 1px at 47% 52%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 58% 19%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1px 1px at 71% 68%, rgba(255,255,255,0.40) 0%, transparent 100%),
      radial-gradient(1px 1px at 84% 11%, rgba(255,255,255,0.60) 0%, transparent 100%),
      radial-gradient(1px 1px at 91% 43%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at  4% 78%, rgba(255,255,255,0.50) 0%, transparent 100%),
      radial-gradient(1px 1px at 16% 63%, rgba(255,255,255,0.40) 0%, transparent 100%),
      radial-gradient(1px 1px at 29% 83%, rgba(255,255,255,0.30) 0%, transparent 100%),
      radial-gradient(1px 1px at 42% 28%, rgba(255,255,255,0.50) 0%, transparent 100%),
      radial-gradient(1px 1px at 55% 88%, rgba(255,255,255,0.40) 0%, transparent 100%),
      radial-gradient(1px 1px at 66%  4%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(1px 1px at 77% 35%, rgba(255,255,255,0.30) 0%, transparent 100%),
      radial-gradient(1px 1px at 87% 73%, rgba(255,255,255,0.50) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 13% 26%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 38% 70%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 63% 48%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 89% 20%, rgba(255,255,255,0.70) 0%, transparent 100%),
      radial-gradient(1px 1px at 24% 55%, rgba(200,230,255,0.45) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 90%, rgba(200,230,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 51% 15%, rgba(200,230,255,0.50) 0%, transparent 100%)
    `}} />

    <style>{`
      @keyframes voya-a1 {
        0%   { transform: translate(0%,0%)   scale(1);    opacity:.75; }
        33%  { transform: translate(7%,10%)  scale(1.08); opacity:1;   }
        66%  { transform: translate(-4%,6%)  scale(0.94); opacity:.82; }
        100% { transform: translate(10%,-4%) scale(1.04); opacity:.90; }
      }
      @keyframes voya-a2 {
        0%   { transform: translate(0%,0%)    scale(1);    opacity:.65; }
        33%  { transform: translate(-9%,7%)   scale(1.06); opacity:.92; }
        66%  { transform: translate(5%,-9%)   scale(1.01); opacity:.72; }
        100% { transform: translate(-7%,4%)   scale(0.96); opacity:1;   }
      }
      @keyframes voya-a3 {
        0%   { transform: translate(0%,0%)  scale(1);    opacity:.55; }
        50%  { transform: translate(4%,-7%) scale(1.10); opacity:.82; }
        100% { transform: translate(-5%,5%) scale(0.97); opacity:.62; }
      }
      @keyframes voya-s1 {
        0%,100% { opacity:0; transform:rotate(-32deg) translateX(-30px); }
        4%      { opacity:1; }
        14%     { opacity:0; transform:rotate(-32deg) translateX(160px); }
      }
      @keyframes voya-s2 {
        0%,38%,100% { opacity:0; }
        0%          { transform:rotate(-28deg) translateX(-20px); }
        43%         { opacity:1; }
        53%         { opacity:0; transform:rotate(-28deg) translateX(110px); }
      }
      @keyframes voya-s3 {
        0%,68%,100% { opacity:0; }
        0%          { transform:rotate(-38deg) translateX(-15px); }
        72%         { opacity:1; }
        80%         { opacity:0; transform:rotate(-38deg) translateX(90px); }
      }
    `}</style>
  </div>
);

export default AnimatedShaderBackground;
