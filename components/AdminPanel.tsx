
import React, { useState, useRef } from 'react';
import { Pizza, Order, OrderStatus, SiteSpecial } from '../types.ts';
import { 
  Plus, Edit2, Trash2, X, Check, Key, Database, Send, Settings, 
  Palette, Camera, Upload, Phone, ShoppingBag, List, Image as ImageIcon
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
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings'>('menu');
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

  const handleSaveSettings = () => {
    saveSpecial(siteSpecial);
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSupabaseConfig(sbUrl, sbKey);
    setStatusMessage('Налаштування збережено!');
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

  const handleDelete = (id: string) => {
    if (confirm('Видалити цю позицію з меню назавжди?')) {
      const newPizzas = pizzas.filter(p => p.id !== id);
      onUpdatePizzas(newPizzas);
      setStatusMessage('Видалено успішно');
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto text-black">
      <div className="container mx-auto px-4 py-8 md:p-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Адмін-панель <span className="text-orange-500">P2P</span></h1>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors shadow-sm"><X size={24}/></button>
        </div>

        <div className="flex gap-2 md:gap-4 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={()=>setActiveTab('menu')} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='menu'?'bg-black text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><List size={18}/> Меню</button>
          <button onClick={()=>setActiveTab('orders')} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='orders'?'bg-black text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><ShoppingBag size={18}/> Замовлення ({orders.length})</button>
          <button onClick={()=>setActiveTab('settings')} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab==='settings'?'bg-orange-500 text-white shadow-xl':'bg-gray-100 text-gray-400'}`}><Settings size={18}/> Налаштування</button>
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8 pb-32">
            <div className="bg-white p-8 border-2 border-orange-400 rounded-[3rem] shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white"><Palette size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Брендинг та Контакти</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Логотип (завантажити фото)</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-gray-100 shadow-inner">
                        <img src={siteLogo} className="w-full h-full object-cover" alt="Logo" />
                      </div>
                      <input type="file" ref={logoFileRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'logo')} />
                      <button onClick={() => logoFileRef.current?.click()} className="bg-black text-white px-5 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:bg-orange-500 transition-all shadow-md"><Upload size={14}/> Вибрати файл</button>
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
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Send size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Telegram Сповіщення</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Bot Token</label>
                    <input className="w-full p-4 border-2 border-gray-50 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold" value={tgToken} onChange={e=>setTgToken(e.target.value)} placeholder="Токен вашого бота" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Chat ID</label>
                    <input className="w-full p-4 border-2 border-gray-50 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} placeholder="ID чату або групи" />
                  </div>
               </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all transform active:scale-95">Зберегти всі налаштування</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="animate-in fade-in duration-500 pb-32">
            <button onClick={()=>{setEditingId('new'); setEditForm({name:'', price:0, category:'pizza', image:'', description: ''});}} className="bg-green-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs mb-8 shadow-xl hover:bg-green-600 transition-colors">+ Додати нову страву</button>
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
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-3 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-colors"><Edit2 size={18}/></button>
                        <button onClick={()=>handleDelete(p.id)} className="p-3 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-colors"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 pb-32 animate-in fade-in duration-500">
            {orders.length === 0 ? <p className="text-center py-24 text-gray-400 font-black uppercase text-xs tracking-widest">Немає активних замовлень</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs uppercase tracking-tighter bg-black text-white px-3 py-1 rounded-xl shadow-sm">{o.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 leading-tight bg-orange-50/50 p-3 rounded-2xl border border-orange-50/50">{o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase text-gray-500">
                       <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg"><Phone size={12}/> {o.phone}</span>
                       {o.address && <span className="bg-gray-50 px-3 py-1 rounded-lg">Адреса: {o.address}, {o.houseNumber}</span>}
                       {o.notes && <span className="bg-yellow-50 px-3 py-1 rounded-lg text-orange-700 italic border border-yellow-100">Коментар: {o.notes}</span>}
                       <span className={`px-3 py-1 rounded-lg border ${o.paymentMethod === 'cash' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>Оплата: {o.paymentMethod === 'cash' ? 'Готівка' : 'Карта'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0">
                    <p className="font-black text-3xl text-orange-600">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="flex-grow md:flex-grow-0 p-4 text-[10px] font-black uppercase rounded-2xl border-2 outline-none cursor-pointer bg-gray-50 hover:bg-white transition-colors">
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
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">{editingId === 'new' ? 'Створення страви' : 'Редагування'}</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Назва</label>
                <input className="w-full p-4 border rounded-2xl bg-gray-50 focus:bg-white focus:border-orange-500 outline-none font-bold" placeholder="Назва страви" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Ціна (грн)</label>
                <input type="number" className="w-full p-4 border rounded-2xl bg-gray-50 focus:bg-white focus:border-orange-500 outline-none font-black" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price:Number(e.target.value)})} />
              </div>
              
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Фото страви</label>
                <div className="flex gap-6 items-center bg-gray-50 p-4 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden flex-shrink-0 border shadow-sm">
                    {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" alt="Preview" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={32}/></div>}
                  </div>
                  <div className="flex-grow space-y-2">
                    <input type="file" ref={pizzaFileRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'pizza')} />
                    <button onClick={() => pizzaFileRef.current?.click()} className="w-full bg-black text-white p-3 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-md"><Camera size={14}/> Вибрати фото з галереї</button>
                    <input className="w-full p-2 border-b text-[10px] font-medium outline-none bg-transparent" placeholder="Або вставте пряме посилання" value={editForm.image} onChange={e=>setEditForm({...editForm, image:e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Опис / Інгредієнти</label>
                <textarea className="w-full p-4 border rounded-2xl bg-gray-50 focus:bg-white focus:border-orange-500 outline-none font-medium text-sm h-32 resize-none" placeholder="Опишіть страву..." value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                if(!editForm.name || !editForm.price) { alert('Назва та ціна обов’язкові!'); return; }
                if (editingId === 'new') {
                  onUpdatePizzas([{...editForm, id: 'p' + Date.now()} as Pizza, ...pizzas]);
                } else {
                  onUpdatePizzas(pizzas.map(p => p.id === editingId ? { ...p, ...editForm } as Pizza : p));
                }
                setEditingId(null);
                setEditForm({});
              }} className="flex-grow bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Зберегти</button>
              <button onClick={()=>{setEditingId(null); setEditForm({});}} className="px-10 py-5 bg-gray-100 rounded-[2rem] font-black uppercase text-xs active:scale-95 transition-all">Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
