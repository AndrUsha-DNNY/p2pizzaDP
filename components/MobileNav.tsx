
import React from 'react';
import { Pizza, Package, Heart, History, Home, Star } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  hasUser: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, hasUser }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Піца' },
    { id: 'box', icon: Package, label: 'BOX' },
    { id: 'promotions', icon: Star, label: 'Акції' },
    { id: 'favorites', icon: Heart, label: 'Обране' },
    { id: 'history', icon: History, label: 'Історія', auth: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-orange-100 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-20 px-2">
        {tabs.map((tab) => {
          if (tab.auth && !hasUser) return null;
          
          const isActive = currentView === tab.id || (tab.id === 'home' && currentView === 'home');
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300 ${
                isActive ? 'text-orange-500 scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-500 ${isActive ? 'bg-orange-100/50' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-colors ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-2 w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
