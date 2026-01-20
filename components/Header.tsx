
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Heart, History, Star, Settings, Package, ShoppingCart, Phone } from 'lucide-react';
import { User } from '../types';
import { getStoredLogo, getStoredShopPhone, DEFAULT_LOGO } from '../store';

interface HeaderProps {
  user: User | null;
  onOpenAuth: () => void;
  onNavigate: (view: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  siteSettings: any;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onNavigate, cartCount, onOpenCart, siteSettings }) => {
  const [logo, setLogo] = useState(siteSettings?.logo || getStoredLogo());
  const [phone, setPhone] = useState(siteSettings?.phone || getStoredShopPhone());

  useEffect(() => {
    if (siteSettings) {
      setLogo(siteSettings.logo || DEFAULT_LOGO);
      setPhone(siteSettings.phone || '+380 00 000 00 00');
    }
  }, [siteSettings]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform border border-orange-200">
             <img src={logo} alt="P2Pizza Logo" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).src = DEFAULT_LOGO;}} />
          </div>
          <span className="text-2xl font-black text-black tracking-tighter hidden sm:block">P2PIZZA</span>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          <button onClick={() => onNavigate('home')} className="text-black hover:text-orange-600 font-bold transition-colors">Меню</button>
          <button onClick={() => onNavigate('box')} className="flex items-center gap-1 text-black hover:text-orange-600 font-bold transition-colors text-sm"><Package size={16} className="text-orange-500" /> BOX</button>
          <button onClick={() => onNavigate('promotions')} className="flex items-center gap-1 text-black hover:text-orange-600 font-bold transition-colors text-sm"><Star size={16} className="text-orange-500" /> Акції</button>
          <button onClick={() => onNavigate('favorites')} className="flex items-center gap-1 text-black hover:text-orange-600 font-bold transition-colors text-sm"><Heart size={16} className="text-red-500" /> Улюблене</button>
          {user && <button onClick={() => onNavigate('history')} className="flex items-center gap-1 text-black hover:text-orange-600 font-bold transition-colors text-sm"><History size={16} /> Історія</button>}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <a href={`tel:${phone}`} className="hidden md:flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl text-orange-600 font-black text-xs hover:bg-orange-100 transition-colors border border-orange-100 shadow-sm">
            <Phone size={14} /> {phone}
          </a>

          {user?.role === 'admin' && (
            <button onClick={() => onNavigate('admin')} className="p-2 hover:bg-orange-100 rounded-full transition-colors text-orange-600 bg-orange-50"><Settings size={22} /></button>
          )}
          
          <button 
            id="cart-icon-target"
            onClick={onOpenCart}
            className="relative p-2.5 hover:bg-orange-50 rounded-full transition-colors group"
          >
            <ShoppingCart className="text-black group-hover:text-orange-500 transition-colors" size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          <button onClick={onOpenAuth} className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-2 sm:px-3 py-2 transition-colors">
            <UserIcon className="text-orange-500" size={20} />
            <span className="hidden md:inline font-bold text-black text-sm">{user ? user.name : 'Увійти'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
