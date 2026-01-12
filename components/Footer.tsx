
import React from 'react';
import { Instagram, Facebook, Music, Phone, MapPin } from 'lucide-react';
import { getStoredShopPhone } from '../store';

const Footer: React.FC = () => {
  const phone = getStoredShopPhone();

  return (
    <footer className="bg-black text-white py-12 px-4 mt-20">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          {/* Logo & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                <img src="https://i.ibb.co/3ykCjFz/p2p-logo.png" alt="P2P" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-black tracking-tighter">P2PIZZA</span>
            </div>
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xs">
              Найкраща піца в місті, приготовлена з любов'ю та найсвіжіших інгредієнтів. Спробуй один раз — замовляй завжди!
            </p>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Контакти</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm font-bold">
                <Phone size={18} className="text-orange-500" />
                <a href={`tel:${phone}`} className="hover:text-orange-500 transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3 text-sm font-bold">
                <MapPin size={18} className="text-orange-500" />
                <span>Україна, Ваше Місто</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Ми в соцмережах</h3>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.instagram.com/p2pizza.ua" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:scale-110 transition-all text-white"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://www.tiktok.com/@p2pizza" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:scale-110 transition-all text-white"
              >
                <Music size={24} />
              </a>
              <a 
                href="https://www.facebook.com/P2Pizza.ua/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:scale-110 transition-all text-white"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
            © {new Date().getFullYear()} P2PIZZA. ВСІ ПРАВА ЗАХИЩЕНІ.
          </p>
          <div className="flex gap-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">
            <button className="hover:text-white transition-colors">Політика конфіденційності</button>
            <button className="hover:text-white transition-colors">Публічна оферта</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
