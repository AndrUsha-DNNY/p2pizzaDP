
import React, { useState, useEffect } from 'react';
import { Pizza as PizzaIcon, CheckCircle2, Flame, UtensilsCrossed, Star } from 'lucide-react';

interface CookingTrackerProps {
  startTime: number;
  isReadyOverride?: boolean;
}

const CookingTracker: React.FC<CookingTrackerProps> = ({ startTime, isReadyOverride }) => {
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
    "Готуємо тісто...",
    "Додаємо соус...",
    "Кладемо начинку...",
    "Багато сиру...",
    "Відправляємо у піч...",
    "Запікаємо до скоринки...",
    "Майже готово...",
    "Пакуємо...",
    "Замовлення готове! Смачного!"
  ];

  useEffect(() => {
    if (isReadyOverride) {
      setElapsedMinutes(8);
      return;
    }
    const update = () => {
      const now = Date.now();
      const diffInMinutes = Math.floor((now - startTime) / 60000);
      setElapsedMinutes(Math.min(diffInMinutes, 7));
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [startTime, isReadyOverride]);

  const isReady = isReadyOverride || elapsedMinutes >= 8;
  const progressText = MESSAGES[elapsedMinutes] || MESSAGES[8];

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-orange-100 flex flex-col items-center text-center relative overflow-hidden transition-all duration-700">
      {isReady && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <Star key={i} size={20} className="absolute text-yellow-400 animate-celebrate-star" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, animationDelay: `${i*300}ms` }} />
          ))}
        </div>
      )}

      <div className={`relative w-56 h-56 mb-8 transition-transform duration-1000 ${isReady ? 'scale-110' : ''}`}>
        <div className={`absolute inset-0 rounded-full border-8 transition-colors duration-1000 ${isReady ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`} />
        <div className={`absolute inset-0 transition-transform duration-[3s] ${isReady ? 'rotate-[360deg]' : 'rotate-0'}`}>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ${i < (isReady ? 8 : elapsedMinutes) ? 'opacity-100 scale-100' : 'opacity-0 scale-150 rotate-[30deg]'}`}
              style={{ 
                clipPath: `polygon(50% 50%, ${50 + 60 * Math.cos((i * 45 - 22.5) * Math.PI / 180)}% ${50 + 60 * Math.sin((i * 45 - 22.5) * Math.PI / 180)}%, ${50 + 60 * Math.cos(((i + 1) * 45 - 22.5) * Math.PI / 180)}% ${50 + 60 * Math.sin(((i + 1) * 45 - 22.5) * Math.PI / 180)}%)`,
                transitionDelay: `${i * 100}ms`
              }}
            >
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${PIZZA_TEXTURES[i]})` }} />
            </div>
          ))}
        </div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center border-4 ${isReady ? 'border-green-500' : 'border-orange-50'}`}>
          {isReady ? <CheckCircle2 className="text-green-500 animate-in zoom-in" size={36} /> : <Flame className="text-orange-500 animate-pulse" size={28} />}
        </div>
      </div>

      <div className="space-y-2 z-10">
        <h3 className={`text-2xl font-black uppercase flex items-center justify-center gap-2 transition-colors ${isReady ? 'text-green-600' : 'text-black'}`}>
          {isReady ? <PizzaIcon className="text-yellow-500" size={24} /> : <UtensilsCrossed className="text-orange-500" size={20} />}
          {progressText}
        </h3>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          {isReady ? "Насолоджуйтесь вашим замовленням!" : "Ще трохи терпіння..."}
        </p>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full mt-6 overflow-hidden border border-gray-50">
        <div className={`h-full transition-all duration-1000 ${isReady ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${(elapsedMinutes / 8) * 100}%` }} />
      </div>

      <style>{`
        @keyframes celebrate-star {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: translateY(-50px) scale(0); opacity: 0; }
        }
        .animate-celebrate-star { animation: celebrate-star 2s infinite; }
      `}</style>
    </div>
  );
};

export default CookingTracker;
