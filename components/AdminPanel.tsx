
import React, { useState, useRef, useEffect } from 'react';
import { Pizza, Order, OrderStatus, SiteSpecial } from '../types.ts';
import { 
  Plus, Edit2, Trash2, X, Check, Key, Database, Send, Settings, 
  Palette, Camera, Upload, Phone, ShoppingBag, List, Image as ImageIcon, Sparkles, Copy
} from 'lucide-react';
import { 
  getStoredSpecial, saveSpecial, getStoredShopPhone, 
  saveShopPhone, getTelegramConfig, saveTelegramConfig, getSupabaseConfig, 
  saveSupabaseConfig, getStoredLogo, saveLogo, getSupabaseHeaders, syncSettingsToCloud
} from '../store.ts';

interface AdminPanelProps {
  pizzas: Pizza[];
  onUpdatePizzas: (pizzas: Pizza[]) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ pizzas, onUpdatePizzas, orders, onUpdateOrderStatus, onClose }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings' | 'database'>('menu');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Pizza>>({});
  
  const [shopPhone, setShopPhone] = useState(getStoredShopPhone());
  const [siteLogo, setSiteLogo] = useState(getStoredLogo());
  
  const tgCfg = getTelegramConfig();
  const [tgToken, setTgToken] = useState(tgCfg.token);
  const [tgChatId, setTgChatId] = useState(tgCfg.chatId);
  
  const sbCfg = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(sbCfg.url);
  const [sbKey, setSbKey] = useState(sbCfg.key);
  
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const pizzaFileRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = async () => {
    // Save locally
    saveSpecial(siteSpecial);
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSupabaseConfig(sbUrl, sbKey);
    
    // Attempt cloud sync
    await syncSettingsToCloud();
    
    setStatusMessage('Налаштування збережено всюди!');
    setTimeout(() => setStatusMessage(null), 3000);
    window.dispatchEvent(new Event('storage'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'pizza') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'logo') setSiteLogo(base64);
        else setEditForm(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sqlCode = `-- SQL Схема для Supabase (Вставте це в SQL Editor)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

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
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto text-black">
      <div className="container mx-auto px-4 py-8 md:p-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors shadow-sm"><X size={24}/></button>
        </div>

        <div className="flex gap-2 md:gap-4 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={()=>setActiveTab('menu')} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='menu'?'bg-black text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><List size={18}/> Меню</button>
          <button onClick={()=>setActiveTab('orders')} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='orders'?'bg-black text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><ShoppingBag size={18}/> Замовлення</button>
          <button onClick={()=>setActiveTab('settings')} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='settings'?'bg-orange-500 text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><Settings size={18}/> Налаштування</button>
          <button onClick={()=>setActiveTab('database')} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='database'?'bg-green-600 text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><Database size={18}/> База Даних</button>
        </div>

        {activeTab === 'database' && (
          <div className="max-w-4xl space-y-8 pb-32">
             <div className="bg-white p-8 border-2 border-green-500 rounded-[3rem] shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Database size={28} /></div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Підключення Supabase</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1">Для синхронізації між комп'ютером та телефоном</p>
                  </div>
               </div>
               <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Project URL</label>
                    <input className="w-full p-4 border-2 border-gray-50 rounded-2xl focus:border-green-500 outline-none text-xs font-bold" value={sbUrl} onChange={e=>setSbUrl(e.target.value)} placeholder="https://xyz.supabase.co" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">API Key (Anon/Public)</label>
                    <input type="password" className="w-full p-4 border-2 border-gray-50 rounded-2xl focus:border-green-500 outline-none text-xs font-bold" value={sbKey} onChange={e=>setSbKey(e.target.value)} placeholder="Ваш публічний ключ" />
                  </div>
               </div>
               <div className="p-6 bg-gray-900 rounded-3xl relative">
                  <button onClick={() => {navigator.clipboard.writeText(sqlCode); alert('Скопійовано!');}} className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-xl hover:bg-white/20"><Copy size={16} /></button>
                  <pre className="text-[10px] font-mono text-green-400 overflow-x-auto">{sqlCode}</pre>
               </div>
               <p className="mt-6 text-xs text-gray-500 font-medium">1. Створіть проект на supabase.com<br/>2. Скопіюйте URL та Key сюди<br/>3. Вставте SQL код вище у "SQL Editor" на сайті Supabase і натисніть Run.</p>
             </div>
             <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Активувати синхронізацію</button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8 pb-32">
            <div className="bg-white p-8 border-2 border-orange-400 rounded-[3rem] shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white"><Palette size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Брендинг</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Логотип (завантажити)</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-gray-100 shadow-inner">
                        <img src={siteLogo} className="w-full h-full object-cover" alt="Logo" />
                      </div>
                      <input type="file" ref={logoFileRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'logo')} />
                      <button onClick={() => logoFileRef.current?.click()} className="bg-black text-white px-5 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:bg-orange-500 transition-all shadow-md"><Upload size={14}/> Оновити фото</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Телефон закладу</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                       <input className="w-full pl-12 p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-orange-500 outline-none font-black text-lg" value={shopPhone} onChange={e=>setShopPhone(e.target.value)} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 border-2 border-blue-500 rounded-[3rem] shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white"><Send size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Telegram Сповіщення</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                  <input className="w-full p-4 border-2 border-gray-50 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold" value={tgToken} onChange={e=>setTgToken(e.target.value)} placeholder="Bot Token" />
                  <input className="w-full p-4 border-2 border-gray-50 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} placeholder="Chat ID" />
               </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Зберегти всюди</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="animate-in fade-in duration-500 pb-32">
            <button onClick={()=>{setEditingId('new'); setEditForm({name:'', price:0, category:'pizza', image:'', description: ''});}} className="bg-green-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs mb-8 shadow-xl">+ Додати страву</button>
            <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-black text-white text-[10px] uppercase font-black tracking-widest">
                  <tr><th className="p-6">Страва</th><th className="p-6">Категорія</th><th className="p-6">Ціна</th><th className="p-6 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50/50 transition-colors">
                      <td className="p-6 flex items-center gap-4">
                        <img src={p.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png'} className="w-14 h-14 object-cover rounded-2xl border" alt={p.name} />
                        <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-6"><span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase text-gray-500">{p.category}</span></td>
                      <td className="p-6 font-black text-sm">{p.price} грн</td>
                      <td className="p-6 text-right flex gap-3 justify-end">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-3 bg-blue-500 text-white rounded-xl shadow-md"><Edit2 size={18}/></button>
                        <button onClick={()=>{if(confirm('Видалити?')) onUpdatePizzas(pizzas.filter(x=>x.id!==p.id))}} className="p-3 bg-red-500 text-white rounded-xl shadow-md"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 pb-32">
            {orders.length === 0 ? <p className="text-center py-24 text-gray-400 font-black uppercase text-xs">Немає замовлень</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[3rem] border-2 border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                  <div className="space-y-2">
                    <span className="font-black text-xs uppercase bg-black text-white px-3 py-1 rounded-xl">{o.id}</span>
                    <p className="text-sm font-bold">{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-[10px] font-black text-orange-500 uppercase">{o.phone} • {o.date}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-black text-2xl">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-3 text-[10px] font-black uppercase rounded-2xl border-2">
                      <option value="pending">Новий</option>
                      <option value="preparing">Готується</option>
                      <option value="ready">Готово</option>
                      <option value="completed">Виконано</option>
                      <option value="cancelled">Скасовано</option>
                    </select>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest z-[300] shadow-2xl animate-in slide-in-from-top">
          {statusMessage}
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">{editingId === 'new' ? 'Створення' : 'Редагування'}</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <input className="w-full p-4 border rounded-2xl bg-gray-50 font-bold" placeholder="Назва" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
              <input type="number" className="w-full p-4 border rounded-2xl bg-gray-50 font-black" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price:Number(e.target.value)})} />
              <div className="md:col-span-2 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden border">
                  {editForm.image && <img src={editForm.image} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-grow space-y-2">
                  <input type="file" ref={pizzaFileRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'pizza')} />
                  <button onClick={() => pizzaFileRef.current?.click()} className="w-full bg-black text-white p-2 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2"><Camera size={14}/> Завантажити фото</button>
                  <input className="w-full p-2 border-b text-[10px]" placeholder="Або вставте URL" value={editForm.image} onChange={e=>setEditForm({...editForm, image:e.target.value})} />
                </div>
              </div>
              <textarea className="md:col-span-2 w-full p-4 border rounded-2xl bg-gray-50 font-medium text-sm h-32" placeholder="Опис" value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                if(!editForm.name || !editForm.price) return alert('Вкажіть назву та ціну');
                if (editingId === 'new') {
                  onUpdatePizzas([{...editForm, id: 'p' + Date.now()} as Pizza, ...pizzas]);
                } else {
                  onUpdatePizzas(pizzas.map(p => p.id === editingId ? { ...p, ...editForm } as Pizza : p));
                }
                setEditingId(null);
              }} className="flex-grow bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-10 py-5 bg-gray-100 rounded-[2rem] font-black uppercase text-xs">Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
