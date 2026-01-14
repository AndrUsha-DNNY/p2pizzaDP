
import React, { useState, useRef } from 'react';
import { Pizza, Order, OrderStatus, SiteSpecial } from '../types.ts';
import { 
  Plus, Edit2, Trash2, X, Check, Database, Send, Settings, 
  Palette, Phone, ShoppingBag, List, Copy, Upload, Camera
} from 'lucide-react';
import { 
  getStoredSpecial, saveSpecial, getStoredShopPhone, 
  saveShopPhone, getTelegramConfig, saveTelegramConfig, getSupabaseConfig, 
  saveSupabaseConfig, getStoredLogo, saveLogo, getSupabaseHeaders
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
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveAll = () => {
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSupabaseConfig(sbUrl, sbKey);
    
    setStatusMessage('Налаштування збережено!');
    setTimeout(() => setStatusMessage(null), 3000);
    window.dispatchEvent(new Event('storage'));
  };

  const sqlCode = `-- СКОПІЮЙТЕ ЦЕ В SUPABASE SQL EDITOR:
CREATE TABLE IF NOT EXISTS pizzas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image TEXT,
  category TEXT DEFAULT 'pizza',
  is_new BOOLEAN DEFAULT false,
  is_promo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  date TEXT,
  status TEXT DEFAULT 'pending',
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`;

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto text-black pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={24}/></button>
        </div>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
          <button onClick={()=>setActiveTab('menu')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase ${activeTab==='menu'?'bg-black text-white':'bg-gray-100'}`}>Меню</button>
          <button onClick={()=>setActiveTab('orders')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase ${activeTab==='orders'?'bg-black text-white':'bg-gray-100'}`}>Замовлення</button>
          <button onClick={()=>setActiveTab('settings')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase ${activeTab==='settings'?'bg-black text-white':'bg-gray-100'}`}>Налаштування</button>
          <button onClick={()=>setActiveTab('database')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase ${activeTab==='database'?'bg-green-600 text-white':'bg-gray-100'}`}>База Даних</button>
        </div>

        {activeTab === 'database' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white p-8 border-2 border-green-500 rounded-[2rem] shadow-xl">
              <h2 className="text-xl font-black uppercase mb-4">Підключення Supabase</h2>
              <p className="text-xs text-gray-400 mb-6 font-bold uppercase">Ці дані дозволять сайту працювати на всіх пристроях одночасно</p>
              <div className="space-y-4 mb-8">
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Supabase URL" value={sbUrl} onChange={e=>setSbUrl(e.target.value)} />
                <input type="password" className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Supabase Anon Key" value={sbKey} onChange={e=>setSbKey(e.target.value)} />
              </div>
              <div className="p-4 bg-gray-900 rounded-xl relative">
                <pre className="text-[10px] text-green-400 overflow-x-auto">{sqlCode}</pre>
                <button onClick={() => {navigator.clipboard.writeText(sqlCode); alert('Скопійовано!')}} className="absolute top-2 right-2 text-white bg-white/10 p-2 rounded-lg"><Copy size={14}/></button>
              </div>
            </div>
            <button onClick={handleSaveAll} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl">Активувати хмару</button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8">
            <div className="bg-white p-8 border-2 border-orange-200 rounded-[2rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Send size={20} className="text-blue-500"/> Telegram Сповіщення</h2>
              <div className="grid gap-4">
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Bot Token (@BotFather)" value={tgToken} onChange={e=>setTgToken(e.target.value)} />
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Ваш Chat ID (@userinfobot)" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} />
              </div>
              <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase">Сюди будуть приходити всі нові замовлення</p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-100 rounded-[2rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Phone size={20} className="text-green-500"/> Контакти</h2>
              <input className="w-full p-4 border rounded-xl bg-gray-50 font-black text-xl" value={shopPhone} onChange={e=>setShopPhone(e.target.value)} />
            </div>

            <button onClick={handleSaveAll} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase shadow-xl">Зберегти налаштування</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => {setEditingId('new'); setEditForm({name: '', price: 0, category: 'pizza', image: ''})}} className="bg-green-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs mb-4">+ Нова піца</button>
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr><th className="p-4">Назва</th><th className="p-4">Ціна</th><th className="p-4 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 font-black">{p.price} грн</td>
                      <td className="p-4 text-right flex gap-2 justify-end">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-2 bg-blue-500 text-white rounded-lg"><Edit2 size={14}/></button>
                        <button onClick={()=>{if(confirm('Видалити?')) onUpdatePizzas(pizzas.filter(x=>x.id!==p.id))}} className="p-2 bg-red-500 text-white rounded-lg"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? <p className="text-center py-20 text-gray-400 font-bold">Немає замовлень</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <span className="bg-black text-white px-2 py-0.5 rounded font-black text-[10px] uppercase">{o.id}</span>
                    <p className="font-bold text-sm mt-1">{o.items.map(i=>`${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-orange-500 font-black text-[10px] uppercase mt-1">{o.phone} • {o.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-xl">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-2 border rounded-xl font-black text-[10px] uppercase">
                      <option value="pending">Новий</option>
                      <option value="preparing">Готується</option>
                      <option value="ready">Готово</option>
                      <option value="completed">Виконано</option>
                    </select>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md">
            <h2 className="text-2xl font-black uppercase mb-6">Піца</h2>
            <div className="space-y-4 mb-8">
              <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Назва" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})}/>
              <input type="number" className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price: Number(e.target.value)})}/>
              <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="URL картинки" value={editForm.image} onChange={e=>setEditForm({...editForm, image: e.target.value})}/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                if (editingId === 'new') onUpdatePizzas([{...editForm, id: 'p'+Date.now()} as Pizza, ...pizzas]);
                else onUpdatePizzas(pizzas.map(p=>p.id===editingId?{...p, ...editForm} as Pizza:p));
                setEditingId(null);
              }} className="flex-grow bg-orange-500 text-white py-4 rounded-xl font-black uppercase">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-6 py-4 bg-gray-100 rounded-xl font-black uppercase">Скасувати</button>
            </div>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-4 rounded-full font-black text-xs uppercase z-[300] shadow-2xl animate-in fade-in slide-in-from-top">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
