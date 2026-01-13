
import React, { useState, useRef, useEffect } from 'react';
import { Pizza, Category, Order, OrderStatus, SiteSpecial } from './types';
import { 
  Plus, Edit2, Trash2, X, Check, Key, Shield, Image as ImageIcon, 
  Upload, List, ShoppingBag, Clock, CheckCircle, AlertCircle, 
  MapPin, Sparkles, MessageSquare, Phone, Settings, Send, Database, ExternalLink, Copy, Palette, Camera
} from 'lucide-react';
import { 
  saveAdminPassword, saveLogo, getStoredLogo, getStoredSpecial, 
  saveSpecial, getStoredShopPhone, saveShopPhone, getTelegramConfig, 
  saveTelegramConfig, getSupabaseConfig, saveSupabaseConfig, getSupabaseHeaders 
} from './store';

interface AdminPanelProps {
  pizzas: Pizza[];
  onUpdatePizzas: (pizzas: Pizza[]) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ pizzas, onUpdatePizzas, orders, onUpdateOrderStatus, onClose }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings'>('menu');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Pizza>>({});
  const [shopPhone, setShopPhone] = useState(getStoredShopPhone());
  const [siteLogo, setSiteLogo] = useState(getStoredLogo());
  
  const tgConfig = getTelegramConfig();
  const [tgToken, setTgToken] = useState(tgConfig.token);
  const [tgChatId, setTgChatId] = useState(tgConfig.chatId);

  const sbCfg = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(sbCfg.url);
  const [sbKey, setSbKey] = useState(sbCfg.key);
  const [showSql, setShowSql] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  const logoFileRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    saveSpecial(siteSpecial);
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSupabaseConfig(sbUrl, sbKey);
    setStatusMessage({ text: 'Налаштування успішно збережено!', type: 'success' });
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSiteLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const syncMenuToCloud = async () => {
    if (!sbUrl || !sbKey) {
      alert('Спочатку введіть дані Supabase у розділі Database!');
      return;
    }
    if (!confirm('Це замінить меню в хмарі поточними даними. Продовжити?')) return;

    try {
      const headers = getSupabaseHeaders();
      const res = await fetch(`${sbUrl}/rest/v1/pizzas`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(pizzas)
      });
      if (res.ok) alert('Меню синхронізовано з хмарою!');
      else throw new Error('Помилка синхронізації');
    } catch (e) {
      alert('Помилка синхронізації. Перевірте консоль.');
    }
  };

  const sqlCode = `-- SQL Схема для Supabase
CREATE TABLE IF NOT EXISTS pizzas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image TEXT,
  category TEXT DEFAULT 'pizza',
  is_new BOOLEAN DEFAULT false,
  is_promo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  date TEXT,
  status TEXT DEFAULT 'pending',
  type TEXT,
  address TEXT,
  house_number TEXT,
  phone TEXT,
  payment_method TEXT,
  notes TEXT,
  preparing_start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);`;

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto text-black pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Адмін-панель <span className="text-orange-500">P2P</span></h1>
            <div className="flex flex-wrap gap-4 mt-6">
              <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'menu' ? 'bg-black text-white shadow-xl' : 'bg-gray-100'}`}><List size={16}/> Меню</button>
              <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'orders' ? 'bg-black text-white shadow-xl' : 'bg-gray-100'}`}><ShoppingBag size={16}/> Замовлення</button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'settings' ? 'bg-black text-white shadow-xl' : 'bg-gray-100'}`}><Settings size={16}/> Налаштування</button>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors"><X size={24} /></button>
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-10">
            {/* Branding Section - NOW AT THE TOP */}
            <div className="bg-white p-8 rounded-[3rem] border-2 border-orange-400 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Palette size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Брендинг (Лого та Телефон)</h2>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Змініть аватарку та контакти закладу</p>
                  </div>
               </div>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Аватарка / Логотип сайту</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-gray-50 rounded-3xl overflow-hidden border-4 border-orange-50 flex-shrink-0 shadow-inner group relative">
                        <img src={siteLogo} alt="Logo" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => logoFileRef.current?.click()}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera size={24} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 flex-grow">
                        <input 
                          type="file" 
                          ref={logoFileRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleLogoUpload} 
                        />
                        <button 
                          onClick={() => logoFileRef.current?.click()}
                          className="bg-black text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500 transition-all"
                        >
                          <Upload size={14}/> Завантажити фото
                        </button>
                        <p className="text-[9px] text-gray-400 font-medium">Рекомендовано: квадратне фото (PNG/JPG)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Телефон для клієнтів</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                      <input 
                        className="w-full pl-14 p-5 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-orange-500 focus:bg-white outline-none font-black text-lg shadow-inner" 
                        value={shopPhone} 
                        onChange={e=>setShopPhone(e.target.value)} 
                        placeholder="+380..."
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium ml-1">Цей номер з'явиться у шапці сайту та в замовленнях</p>
                  </div>
               </div>
            </div>

            {/* Site Special */}
            <div className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                    <Sparkles size={28} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Головна акція (Банер)</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Заголовок</label>
                    <input className="w-full p-4 border rounded-2xl bg-gray-50/50 font-bold" value={siteSpecial.title} onChange={e=>setSiteSpecial({...siteSpecial, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Бейдж (Badge)</label>
                    <input className="w-full p-4 border rounded-2xl bg-gray-50/50 font-bold" value={siteSpecial.badge} onChange={e=>setSiteSpecial({...siteSpecial, badge: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Фонове фото (URL)</label>
                    <input className="w-full p-4 border rounded-2xl bg-gray-50/50 font-medium text-sm" value={siteSpecial.image} onChange={e=>setSiteSpecial({...siteSpecial, image: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Опис акції</label>
                    <textarea className="w-full p-4 border rounded-2xl bg-gray-50/50 font-medium" value={siteSpecial.description} onChange={e=>setSiteSpecial({...siteSpecial, description: e.target.value})} rows={2} />
                  </div>
               </div>
            </div>

            {/* Supabase Section */}
            <div className="bg-white p-8 rounded-[3rem] border-2 border-[#3ecf8e]/20 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-[#3ecf8e] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Database size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Supabase (База Даних)</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <input className="w-full p-4 border rounded-2xl bg-gray-50/50 text-sm" placeholder="URL" value={sbUrl} onChange={e=>setSbUrl(e.target.value)} />
                <input type="password" className="w-full p-4 border rounded-2xl bg-gray-50/50 text-sm" placeholder="Key" value={sbKey} onChange={e=>setSbKey(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setShowSql(!showSql)} className="flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-xl font-bold uppercase text-[10px]">
                  {showSql ? 'Сховати SQL' : 'Отримати SQL'}
                </button>
                <button onClick={syncMenuToCloud} className="bg-[#3ecf8e] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px]">
                  Синхронізувати меню
                </button>
              </div>
              {showSql && (
                <div className="mt-8 bg-gray-900 text-green-400 p-6 rounded-2xl text-xs font-mono overflow-x-auto relative">
                  <button onClick={() => {navigator.clipboard.writeText(sqlCode); alert('Скопійовано!')}} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg text-white">
                    <Copy size={16}/>
                  </button>
                  <pre>{sqlCode}</pre>
                </div>
              )}
            </div>

            {/* Telegram Section */}
            <div className="bg-white p-8 rounded-[3rem] border-2 border-blue-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-[#0088cc] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Send size={28} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Telegram Bot</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <input className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="Bot Token" value={tgToken} onChange={e=>setTgToken(e.target.value)} />
                <input className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="Chat ID" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} />
              </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 text-sm">
              Зберегти всі зміни
            </button>
          </div>
        )}

        {statusMessage && (
          <div className={`fixed top-10 left-1/2 -translate-x-1/2 px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest z-[300] shadow-2xl animate-in slide-in-from-top ${statusMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {statusMessage.text}
          </div>
        )}

        {activeTab === 'menu' && (
           <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
             <table className="w-full text-left">
                <thead className="bg-black text-white uppercase text-[9px] font-black tracking-widest">
                  <tr><th className="p-5">Піца</th><th className="p-5">Ціна</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50/30 transition-colors">
                      <td className="p-5 flex items-center gap-4">
                        <img src={p.image} className="w-12 h-12 object-cover rounded-xl" />
                        <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-5 font-black text-sm">{p.price} грн</td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-2 bg-blue-500 text-white rounded-lg"><Edit2 size={14}/></button>
                        <button onClick={()=>{if(confirm('Видалити?')) onUpdatePizzas(pizzas.filter(x=>x.id!==p.id))}} className="p-2 bg-red-500 text-white rounded-lg"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? <p className="text-center py-20 text-gray-400 font-black uppercase text-xs">Замовлень поки немає</p> : 
              orders.map(o => (
               <div key={o.id} className="bg-white p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-xs uppercase">{o.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600">{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-black text-lg">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-2 text-[9px] font-black uppercase rounded-xl border-2">
                      <option value="pending">Новий</option>
                      <option value="preparing">Готується</option>
                      <option value="ready">Готово</option>
                      <option value="completed">Виконано</option>
                    </select>
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-black mb-8 uppercase">Редагування позиції</h2>
            <div className="space-y-4 mb-8">
              <input className="w-full p-4 border rounded-2xl bg-gray-50/50 font-bold" placeholder="Назва" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
              <input type="number" className="w-full p-4 border rounded-2xl bg-gray-50/50 font-black" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price:Number(e.target.value)})} />
              <input className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="URL зображення" value={editForm.image} onChange={e=>setEditForm({...editForm, image:e.target.value})} />
              <textarea className="w-full p-4 border rounded-2xl bg-gray-50/50 font-medium text-sm h-32" placeholder="Опис" value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                onUpdatePizzas(pizzas.map(p => p.id === editingId ? { ...p, ...editForm } as Pizza : p));
                setEditingId(null);
              }} className="flex-grow bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-xs">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-8 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
