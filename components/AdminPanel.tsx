
import React, { useState, useRef } from 'react';
import { Pizza, Order, OrderStatus } from '../types.ts';
import { 
  Edit2, Trash2, X, Send, Settings, Palette, Phone, ShoppingBag, List, Upload, Camera, Database, Copy, Image as ImageIcon
} from 'lucide-react';
import { 
  getStoredShopPhone, saveShopPhone, getTelegramConfig, 
  saveTelegramConfig, getStoredLogo, saveLogo, getSupabaseConfig, 
  saveSupabaseConfig, setupWebhook, getSupabaseHeaders
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pizzaImageRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'pizza') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'logo') setSiteLogo(base64);
        else setEditForm(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = () => {
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSupabaseConfig(sbUrl, sbKey);
    
    setStatusMessage('Збережено!');
    setTimeout(() => setStatusMessage(null), 3000);
    window.dispatchEvent(new Event('storage'));
  };

  const syncMenu = async () => {
    if (!sbUrl) return alert('Вкажіть Supabase URL');
    try {
      const res = await fetch(`${sbUrl}/rest/v1/pizzas`, {
        method: 'POST',
        headers: { ...getSupabaseHeaders(), 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(pizzas)
      });
      if (res.ok) alert('Меню синхронізовано з хмарою!');
    } catch (e) { alert('Помилка синхронізації'); }
  };

  const sqlCode = `CREATE TABLE pizzas (id TEXT PRIMARY KEY, name TEXT, description TEXT, price NUMERIC, image TEXT, category TEXT, is_new BOOLEAN, is_promo BOOLEAN);
CREATE TABLE orders (id TEXT PRIMARY KEY, items JSONB, total NUMERIC, date TEXT, status TEXT, phone TEXT, address TEXT, house_number TEXT, pickup_time TEXT, payment_method TEXT, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT now());`;

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto text-black pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={24}/></button>
        </div>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={()=>setActiveTab('menu')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase flex-shrink-0 transition-all ${activeTab==='menu'?'bg-black text-white shadow-lg':'bg-gray-100'}`}>Меню</button>
          <button onClick={()=>setActiveTab('orders')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase flex-shrink-0 transition-all ${activeTab==='orders'?'bg-black text-white shadow-lg':'bg-gray-100'}`}>Замовлення</button>
          <button onClick={()=>setActiveTab('settings')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase flex-shrink-0 transition-all ${activeTab==='settings'?'bg-black text-white shadow-lg':'bg-gray-100'}`}>Налаштування</button>
          <button onClick={()=>setActiveTab('database')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase flex-shrink-0 transition-all ${activeTab==='database'?'bg-green-600 text-white shadow-lg':'bg-gray-100'}`}>Database</button>
        </div>

        {activeTab === 'database' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white p-8 border-2 border-green-500 rounded-[2rem] shadow-xl">
              <h2 className="text-xl font-black uppercase mb-4">Спільна База (Supabase)</h2>
              <div className="space-y-4 mb-8">
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Supabase URL" value={sbUrl} onChange={e=>setSbUrl(e.target.value)} />
                <input type="password" className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Anon Key" value={sbKey} onChange={e=>setSbKey(e.target.value)} />
              </div>
              <button onClick={syncMenu} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase mb-4">Залити меню в хмару</button>
              <div className="p-4 bg-gray-900 rounded-xl relative">
                <pre className="text-[10px] text-green-400 overflow-x-auto">{sqlCode}</pre>
                <button onClick={() => {navigator.clipboard.writeText(sqlCode); alert('SQL скопійовано!')}} className="absolute top-2 right-2 text-white bg-white/10 p-2 rounded-lg"><Copy size={14}/></button>
              </div>
            </div>
            <button onClick={handleSaveAll} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl">Зберегти та Активувати</button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8">
            <div className="bg-white p-8 border-2 border-orange-200 rounded-[2rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><ImageIcon size={20} className="text-orange-500"/> Логотип</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border">
                    <img src={siteLogo} className="w-full h-full object-cover" alt="Logo preview" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Завантажити файл</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-orange-200 rounded-[2rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Send size={20} className="text-blue-500"/> Telegram</h2>
              <div className="grid gap-4 mb-4">
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Bot Token" value={tgToken} onChange={e=>setTgToken(e.target.value)} />
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Chat ID" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} />
              </div>
              <button onClick={setupWebhook} className="w-full bg-blue-500 text-white py-3 rounded-xl font-black uppercase text-[10px]">Налаштувати Webhook (кнопки статусу)</button>
            </div>

            <div className="bg-white p-8 border-2 border-gray-100 rounded-[2rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Phone size={20} className="text-green-500"/> Телефон</h2>
              <input className="w-full p-4 border rounded-xl bg-gray-50 font-black text-xl" value={shopPhone} onChange={e=>setShopPhone(e.target.value)} />
            </div>

            <button onClick={handleSaveAll} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-black transition-all">Зберегти налаштування</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => {setEditingId('new'); setEditForm({name: '', price: 0, category: 'pizza', image: ''})}} className="bg-green-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs mb-4 shadow-lg">+ Додати товар</button>
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr><th className="p-4">Товар</th><th className="p-4">Ціна</th><th className="p-4 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png'} className="w-10 h-10 object-cover rounded-lg border" />
                        <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-4 font-black text-sm">{p.price} грн</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-2 bg-blue-500 text-white rounded-lg"><Edit2 size={14}/></button>
                          <button onClick={()=>{if(confirm('Видалити?')) onUpdatePizzas(pizzas.filter(x=>x.id!==p.id))}} className="p-2 bg-red-500 text-white rounded-lg"><Trash2 size={14}/></button>
                        </div>
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
            {orders.length === 0 ? <p className="text-center py-20 text-gray-400 font-bold uppercase text-[10px]">Немає замовлень</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-black text-white px-2 py-0.5 rounded font-black text-[10px] uppercase">{o.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                    </div>
                    <p className="font-bold text-sm">{o.items.map(i=>`${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-orange-500 font-black text-[10px] uppercase mt-1">📞 {o.phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-xl">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-2 border-2 rounded-xl font-black text-[10px] uppercase outline-none bg-white">
                      <option value="Нове">Нове</option>
                      <option value="Готується">Готується</option>
                      <option value="Готово">Готово</option>
                      <option value="Виконано">Виконано</option>
                      <option value="Скасовано">Скасовано</option>
                    </select>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-8 tracking-tighter">Налаштування товару</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center relative cursor-pointer" onClick={() => pizzaImageRef.current?.click()}>
                  {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-300" />}
                </div>
                <button onClick={() => pizzaImageRef.current?.click()} className="text-[10px] font-black uppercase text-orange-500">Завантажити фото</button>
                <input type="file" ref={pizzaImageRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'pizza')} />
              </div>
              <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold outline-none" placeholder="Назва" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})}/>
              <input type="number" className="w-full p-4 border rounded-xl bg-gray-50 font-black outline-none" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price: Number(e.target.value)})}/>
              <textarea className="w-full p-4 border rounded-xl bg-gray-50 font-medium text-xs h-24 outline-none resize-none" placeholder="Опис" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                if (editingId === 'new') onUpdatePizzas([{...editForm, id: 'p'+Date.now()} as Pizza, ...pizzas]);
                else onUpdatePizzas(pizzas.map(p=>p.id===editingId?{...p, ...editForm} as Pizza:p));
                setEditingId(null);
              }} className="flex-grow bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-xs">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-6 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">Скасувати</button>
            </div>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-4 rounded-full font-black text-xs uppercase z-[300] shadow-2xl">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
