
import React, { useState, useEffect } from 'react';
import { Pizza as PizzaIcon, CheckCircle2, Flame, UtensilsCrossed, Star } from 'lucide-react';

interface CookingTrackerProps {
  startTime: number; // timestamp
}

const CookingTracker: React.FC<CookingTrackerProps> = ({ startTime }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const PIZZA_TEXTURES = [
    'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=400',
  ];

  const MESSAGES = [
    "Починаємо готувати...",
    "Замішуємо тісто...",
    "Додаємо фірмовий соус...",
    "Розкладаємо інгредієнти...",
    "Додаємо багато сиру...",
    "Відправляємо у піч...",
    "Майже готово...",
    "Пакуємо вашу гарячу піцу!",
    "Замовлення готове до видачі!"
  ];

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diffInMinutes = Math.floor((now - startTime) / 60000);
      setElapsedMinutes(Math.min(diffInMinutes, 8));
    };

    update();
    const interval = setInterval(update, 2000); // Check more frequently for smooth UI
    return () => clearInterval(interval);
  }, [startTime]);

  const isReady = elapsedMinutes >= 8;
  const progressText = isReady ? MESSAGES[8] : MESSAGES[elapsedMinutes];

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-orange-50 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
      {/* Background celebration particles when ready */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <Star 
              key={i}
              size={20}
              className="absolute text-yellow-400 opacity-0 animate-celebrate-star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 200}ms`
              }}
            />
          ))}
        </div>
      )}

      <div className={`relative w-64 h-64 mb-8 transition-all duration-1000 ${isReady ? 'scale-110' : ''}`}>
        {/* Plate / Base */}
        <div className={`absolute inset-0 rounded-full border-8 border-gray-100 shadow-inner overflow-hidden transition-colors duration-1000 ${isReady ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`} />
        
        {/* Slices appearing one by one. The whole container spins when ready. */}
        <div className={`absolute inset-0 transition-transform duration-[3000ms] ease-in-out ${isReady ? 'rotate-[360deg]' : 'rotate-0'}`}>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${i < elapsedMinutes ? 'opacity-100 scale-100' : 'opacity-0 scale-150 rotate-[15deg]'}`}
              style={{ 
                clipPath: `polygon(50% 50%, ${50 + 60 * Math.cos((i * 45 - 22.5) * Math.PI / 180)}% ${50 + 60 * Math.sin((i * 45 - 22.5) * Math.PI / 180)}%, ${50 + 60 * Math.cos(((i + 1) * 45 - 22.5) * Math.PI / 180)}% ${50 + 60 * Math.sin(((i + 1) * 45 - 22.5) * Math.PI / 180)}%)`,
                zIndex: i + 1,
                transitionDelay: isReady ? '0ms' : `${i * 100}ms`
              }}
            >
              <div 
                className={`w-full h-full bg-cover bg-center transition-all duration-1000 ${isReady ? 'brightness-110 contrast-110 shadow-[inset_0_0_20px_rgba(251,191,36,0.4)]' : ''}`}
                style={{ backgroundImage: `url(${PIZZA_TEXTURES[i]})` }}
              />
            </div>
          ))}
        </div>

        {/* Center hub */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg z-20 flex items-center justify-center border-4 transition-all duration-1000 ${isReady ? 'border-green-500 scale-110 rotate-[360deg]' : 'border-orange-50'}`}>
            {isReady ? (
              <CheckCircle2 className="text-green-500 animate-in zoom-in duration-500" size={32} />
            ) : (
              <Flame className="text-orange-500 animate-pulse" size={24} />
            )}
        </div>
      </div>

      <div className="space-y-2 z-10">
        <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors duration-500 flex items-center justify-center gap-2 ${isReady ? 'text-green-600 scale-105' : 'text-black'}`}>
            {isReady ? <PizzaIcon className="text-yellow-500 animate-bounce" size={24} /> : <UtensilsCrossed className="text-orange-500 animate-bounce" size={20} />}
            {progressText}
        </h3>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            {elapsedMinutes < 8 ? `Залишилось приблизно ${8 - elapsedMinutes} хв.` : "Насолоджуйтесь вашою піцою!"}
        </p>
      </div>

      <div className="w-full h-3 bg-gray-100 rounded-full mt-6 overflow-hidden border border-gray-50 z-10">
        <div 
            className={`h-full transition-all duration-1000 ${isReady ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]'}`} 
            style={{ width: `${(elapsedMinutes / 8) * 100}%` }}
        />
      </div>

      <style>{`
        @keyframes celebrate-star {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          20% { transform: scale(1.2) rotate(45deg); opacity: 1; }
          80% { transform: scale(1) rotate(90deg); opacity: 0.8; }
          100% { transform: scale(0) rotate(180deg); opacity: 0; top: -10%; }
        }
        .animate-celebrate-star {
          animation: celebrate-star 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CookingTracker;
