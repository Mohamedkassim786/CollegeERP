import React, { useEffect, useState } from 'react';

const LoginTransition = ({ onComplete }) => {
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    // Faster sequence: 4 seconds total
    // 0s-0.6s: Letters stagger in
    // 3s: Start fade out
    // 4s: Complete
    const fadeOutTimer = setTimeout(() => {
      setPhase('fading');
    }, 3000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${phase === 'fading' ? 'opacity-0' : 'opacity-100'}`}
         style={{ 
           background: 'radial-gradient(circle at center, #003B73 0%, #001A33 100%)',
           willChange: 'opacity' 
         }}>
      
      {/* Background Animation Elements - Optimized for fluidity */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-blob left-1/4 top-1/4" style={{ willChange: 'transform' }}></div>
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000 right-1/4 bottom-1/4" style={{ willChange: 'transform' }}></div>
      </div>

      {/* Center MIET Text */}
      <div className="relative flex items-center justify-center gap-4 md:gap-8 scale-75 md:scale-100" style={{ willChange: 'transform' }}>
        {['M', 'I', 'E', 'T'].map((letter, index) => (
          <span
            key={index}
            className="text-[120px] md:text-[180px] font-black text-white tracking-tighter"
            style={{
              animation: `letterIntro 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.2) ${index * 0.15}s forwards, letterGlow 2.5s ease-in-out infinite alternate ${index * 0.15 + 0.8}s`,
              opacity: 0,
              display: 'inline-block',
              willChange: 'transform, opacity, filter',
              textShadow: '0 0 30px rgba(255,255,255,0.3)',
              background: 'linear-gradient(to bottom, #FFFFFF 40%, #89CFF0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div className="absolute bottom-20 left-0 w-full text-center">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 opacity-0" 
             style={{ 
               animation: 'fadeInUp 0.6s ease-out 1.2s forwards',
               willChange: 'transform, opacity' 
             }}>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          <span className="text-white/60 text-sm font-medium tracking-[0.3em] uppercase">Initializing Secure Portal</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes letterIntro {
          0% { transform: scale(0.6) translateY(30px) rotate(-10deg); opacity: 0; filter: blur(8px); }
          100% { transform: scale(1) translateY(0) rotate(0); opacity: 1; filter: blur(0); }
        }
        @keyframes letterGlow {
          0% { filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); transform: translateY(0); }
          100% { filter: drop-shadow(0 0 40px rgba(255,255,255,0.6)); transform: translateY(-8px); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fadeInUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animation-delay-2000 { animation-delay: 2000ms; }
        .animate-blob { animation: blob 8s infinite alternate ease-in-out; }
      `}} />
    </div>
  );
};

export default LoginTransition;
