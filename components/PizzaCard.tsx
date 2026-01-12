
import React, { useRef, useState } from 'react';
import { Pizza } from '../types';
import { Heart, Plus, Check, Package, Pizza as PizzaIcon } from 'lucide-react';

interface PizzaCardProps {
  pizza: Pizza;
  onAddToCart: (pizza: Pizza, rect: DOMRect) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const PizzaCard: React.FC<PizzaCardProps> = ({ pizza, onAddToCart, isFavorite, onToggleFavorite }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (isAdding) return;
    
    // Use either the image element or the fallback div for the flying animation position
    const element = imageRef.current || fallbackRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      onAddToCart(pizza, rect);
      
      // Local feedback for the button
      setIsAdding(true);
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  return (
    <div ref={cardRef} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col border border-orange-50">
      <div className="relative overflow-hidden h-48 sm:h-64 bg-orange-50">
        {pizza.image ? (
          <img 
            ref={imageRef}
            src={pizza.image} 
            alt={pizza.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div 
            ref={fallbackRef}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 group-hover:scale-105 transition-transform duration-700"
          >
            {pizza.category === 'box' ? (
              <Package size={64} className="text-orange-400 opacity-50" strokeWidth={1.5} />
            ) : (
              <PizzaIcon size={64} className="text-orange-400 opacity-50" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-2">P2PIZZA</span>
          </div>
        )}
        
        <button 
          onClick={() => onToggleFavorite(pizza.id)}
          className={`absolute top-5 right-5 p-2.5 rounded-2xl shadow-lg transition-all ${
            isFavorite ? 'bg-red-500 text-white scale-110' : 'bg-white/90 backdrop-blur-sm text-black hover:text-red-500'
          }`}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
        <div className="absolute top-5 left-5 flex flex-col gap-2">
          {pizza.isNew && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              Новинка
            </span>
          )}
          {pizza.isPromo && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              Акція
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow text-black">
        <h3 className="text-xl font-black mb-2 group-hover:text-orange-600 transition-colors leading-tight">{pizza.name}</h3>
        <p className="text-black/70 text-sm mb-6 line-clamp-3 flex-grow font-medium leading-relaxed">{pizza.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ціна</span>
            <span className="text-2xl font-black text-black">{pizza.price} <span className="text-sm font-bold uppercase text-orange-500">грн</span></span>
          </div>
          <button 
            onClick={handleAdd}
            className={`p-3 rounded-2xl font-black flex items-center justify-center transition-all duration-300 shadow-lg group/btn relative active:scale-90 ${
              isAdding 
                ? 'bg-green-500 text-white scale-110 shadow-green-100' 
                : 'bg-orange-500 text-white hover:bg-black shadow-orange-100'
            }`}
          >
            {isAdding ? (
              <Check size={24} className="animate-in zoom-in duration-300" />
            ) : (
              <Plus size={24} className="group-hover/btn:rotate-90 transition-transform duration-300" />
            )}
            {isAdding && (
              <span className="absolute inset-0 rounded-2xl bg-green-500 animate-ping opacity-25"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;
