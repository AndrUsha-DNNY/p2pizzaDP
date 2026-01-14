
import React, { useState, useRef, useEffect } from 'react';
import { Pizza, Order, OrderStatus, SiteSpecial } from './types';
import { 
  Plus, Edit2, Trash2, X, Check, Key, Shield, Image as ImageIcon, 
  Upload, List, ShoppingBag, Clock, CheckCircle, AlertCircle, 
  MapPin, Sparkles, MessageSquare, Phone, Settings, Send, Database, ExternalLink, Copy, Palette, Camera
} from 'lucide-react';
import { 
  /* Fix: Removed non-existent saveAdminPassword import */
  saveLogo, getStoredLogo, getStoredSpecial, 
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
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings' | 'database'>('menu');
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

  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  const logoFileRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    saveSpecial(siteSpecial);
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSupabaseConfig(sbUrl, sbKey);
    
    setStatusMessage({ text: 'Збережено локально та хмарно!', type: 'success' });
    setTimeout(() => setStatusMessage(null), 2000);
    window.dispatchEvent(new Event('storage'));
  };

  const syncMenuToCloud = async () => {
    if (!sbUrl || !sbKey) {
      alert('Спочатку введіть дані Supabase у розділі Database!');
      return;
    }
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
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value JSONB);
CREATE TABLE IF NOT EXISTS pizzas (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price NUMERIC NOT NULL, image TEXT, category TEXT DEFAULT 'pizza', is_new BOOLEAN DEFAULT false, is_promo BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()));
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, items JSONB NOT NULL, total NUMERIC NOT NULL, date TEXT, status TEXT DEFAULT 'pending', type TEXT, address TEXT, house_number TEXT, phone TEXT, payment_method TEXT, notes TEXT, preparing_start_time BIGINT, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()));
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT, role TEXT DEFAULT 'user', favorites JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()));`;

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto text-black pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
            <div className="flex flex-wrap gap-2 md:gap-4 mt-6">
              <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'menu' ? 'bg-black text-white shadow-xl' : 'bg-gray-100'}`}><List size={16}/> Меню</button>
              <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'orders' ? 'bg-black text-white shadow-xl' : 'bg-gray-100'}`}><ShoppingBag size={16}/> Замовлення</button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'settings' ? 'bg-black text-white shadow-xl' : 'bg-gray-100'}`}><Settings size={16}/> Налаштування</button>
              <button onClick={() => setActiveTab('database')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'database' ? 'bg-green-600 text-white shadow-xl' : 'bg-gray-100'}`}><Database size={16}/> База</button>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors"><X size={24} /></button>
        </div>

        {activeTab === 'database' && (
           <div className="max-w-4xl space-y-6">
             <div className="bg-white p-8 rounded-[3rem] border-2 border-green-500 shadow-xl">
               <h2 className="text-2xl font-black uppercase mb-4">Налаштування Supabase</h2>
               <p className="text-xs text-gray-400 font-bold uppercase mb-8">Це потрібно, щоб меню на ПК та телефоні було однаковим</p>
               <div className="space-y-4">
                 <input className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="Project URL" value={sbUrl} onChange={e=>setSbUrl(e.target.value)} />
                 <input type="password" className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="Anon Key" value={sbKey} onChange={e=>setSbKey(e.target.value)} />
               </div>
               <div className="mt-8 p-6 bg-gray-900 rounded-2xl relative">
                  <button onClick={() => {navigator.clipboard.writeText(sqlCode); alert('SQL скопійовано!')}} className="absolute top-4 right-4 text-white bg-white/10 p-2 rounded-lg hover:bg-white/20"><Copy size={16}/></button>
                  <pre className="text-[10px] font-mono text-green-400 overflow-x-auto">{sqlCode}</pre>
               </div>
             </div>
             <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest">Активувати базу</button>
             <button onClick={syncMenuToCloud} className="w-full bg-black text-white py-4 rounded-[2rem] font-black uppercase text-xs">Залити поточне меню в хмару</button>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-10">
            <div className="bg-white p-8 rounded-[3rem] border-2 border-orange-400 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white"><Palette size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Брендинг</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Логотип (URL або base64)</label>
                    <input className="w-full p-4 border rounded-2xl bg-gray-50/50 font-medium text-xs" value={siteLogo} onChange={e=>setSiteLogo(e.target.value)} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Телефон закладу</label>
                    <input className="w-full p-4 border rounded-2xl bg-gray-50/50 font-black text-lg" value={shopPhone} onChange={e=>setShopPhone(e.target.value)} />
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border-2 border-blue-500 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white"><Send size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Telegram Сповіщення</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                  <input className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="Bot Token" value={tgToken} onChange={e=>setTgToken(e.target.value)} />
                  <input className="w-full p-4 border rounded-2xl bg-gray-50/50" placeholder="Chat ID" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} />
               </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Зберегти всюди</button>
          </div>
        )}

        {activeTab === 'menu' && (
           <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm overflow-x-auto">
             <table className="w-full text-left min-w-[600px]">
                <thead className="bg-black text-white uppercase text-[9px] font-black tracking-widest">
                  <tr><th className="p-5">Піца</th><th className="p-5">Ціна</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50/30 transition-colors">
                      <td className="p-5 flex items-center gap-4">
                        <img src={p.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png'} className="w-12 h-12 object-cover rounded-xl" />
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
               <div key={o.id} className="bg-white p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-xs uppercase bg-black text-white px-2 py-0.5 rounded-lg">{o.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600">{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-[10px] font-black text-orange-500 uppercase mt-1">{o.phone}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-black text-lg">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-2 text-[9px] font-black uppercase rounded-xl border-2">
                      <option value="pending">Новий</option>
                      <option value="preparing">Готується</option>
                      <option value="ready">Готово</option>
                      <option value="completed">Виконано</option>
                      <option value="cancelled">Скасовано</option>
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
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Редагування</h2>
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

      {statusMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest z-[300] shadow-2xl">
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
