
import React, { useState, useRef } from 'react';
import { Pizza, Order, OrderStatus, SiteSpecial } from './types';
import { 
  Edit2, Trash2, X, Send, Settings, Phone, List, ShoppingBag, Upload, Camera, Palette, Sparkles, ImageIcon
} from 'lucide-react';
import { 
  getStoredShopPhone, saveShopPhone, getTelegramConfig, 
  saveTelegramConfig, getStoredLogo, saveLogo, getStoredSpecial, saveSpecial
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
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());
  
  const tgCfg = getTelegramConfig();
  const [tgToken, setTgToken] = useState(tgCfg.token);
  const [tgChatId, setTgChatId] = useState(tgCfg.chatId);
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const specialFileRef = useRef<HTMLInputElement>(null);
  const pizzaFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'special' | 'pizza') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'logo') setSiteLogo(base64);
        else if (target === 'special') setSiteSpecial({ ...siteSpecial, image: base64 });
        else setEditForm(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = () => {
    saveShopPhone(shopPhone);
    saveLogo(siteLogo);
    saveTelegramConfig(tgToken, tgChatId);
    saveSpecial(siteSpecial);
    
    setStatusMessage('Всі зміни збережено!');
    setTimeout(() => setStatusMessage(null), 3000);
    window.dispatchEvent(new Event('storage'));
  };

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
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8">
            {/* РЕДАКТОР АКЦІЇ (HERO SECTION) */}
            <div className="bg-white p-8 border-2 border-orange-400 rounded-[3rem] shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white"><Sparkles size={28} /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Головна Акція (Hero)</h2>
               </div>
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Заголовок</label>
                      <input className="w-full p-4 border rounded-2xl bg-gray-50 font-black text-xl" value={siteSpecial.title} onChange={e=>setSiteSpecial({...siteSpecial, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Опис</label>
                      <textarea className="w-full p-4 border rounded-2xl bg-gray-50 font-medium text-sm h-24 resize-none" value={siteSpecial.description} onChange={e=>setSiteSpecial({...siteSpecial, description: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Картинка банера</label>
                    <div className="relative group cursor-pointer h-40 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200" onClick={()=>specialFileRef.current?.click()}>
                      <img src={siteSpecial.image} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black uppercase text-xs transition-opacity">Змінити фото</div>
                    </div>
                    <input type="file" ref={specialFileRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'special')} />
                    <input className="w-full p-4 border rounded-2xl bg-gray-50 text-[10px] font-bold" placeholder="URL картинки" value={siteSpecial.image} onChange={e=>setSiteSpecial({...siteSpecial, image: e.target.value})} />
                  </div>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 border-2 border-gray-100 rounded-[2.5rem] shadow-sm">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><ImageIcon size={20} className="text-orange-500"/> Логотип</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border">
                    <img src={siteLogo} className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => logoFileRef.current?.click()} className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Файл</button>
                  <input type="file" ref={logoFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                </div>
              </div>

              <div className="bg-white p-8 border-2 border-gray-100 rounded-[2.5rem] shadow-sm">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Phone size={20} className="text-green-500"/> Телефон</h2>
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-black text-lg" value={shopPhone} onChange={e=>setShopPhone(e.target.value)} />
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-blue-100 rounded-[3rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Send size={20} className="text-blue-500"/> Telegram (Лише текст)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Bot Token" value={tgToken} onChange={e=>setTgToken(e.target.value)} />
                <input className="w-full p-4 border rounded-xl bg-gray-50 font-bold" placeholder="Chat ID" value={tgChatId} onChange={e=>setTgChatId(e.target.value)} />
              </div>
            </div>

            <button onClick={handleSaveAll} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-xl hover:bg-black transition-all">Зберегти налаштування</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => {setEditingId('new'); setEditForm({name: '', price: 0, category: 'pizza', image: ''})}} className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] mb-4 shadow-lg">+ Додати товар</button>
            <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr><th className="p-5">Товар</th><th className="p-5">Ціна</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50 transition-colors">
                      <td className="p-5 flex items-center gap-4">
                        <img src={p.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png'} className="w-12 h-12 object-cover rounded-xl" />
                        <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-5 font-black text-sm">{p.price} грн</td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-2.5 bg-blue-500 text-white rounded-xl"><Edit2 size={16}/></button>
                        <button onClick={()=>{if(confirm('Видалити?')) onUpdatePizzas(pizzas.filter(x=>x.id!==p.id))}} className="p-2.5 bg-red-500 text-white rounded-xl"><Trash2 size={16}/></button>
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
            {orders.length === 0 ? <p className="text-center py-20 text-gray-400 font-bold uppercase text-[10px]">Замовлень немає</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-black text-white px-2 py-0.5 rounded-lg font-black text-[10px] uppercase">{o.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                    </div>
                    <p className="font-bold text-sm">{o.items.map(i=>`${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-orange-500 font-black text-[10px] uppercase mt-1">📞 {o.phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-xl">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-3 border-2 rounded-xl font-black text-[10px] uppercase outline-none bg-white">
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
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center relative cursor-pointer" onClick={() => pizzaFileRef.current?.click()}>
                  {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-300" />}
                </div>
                <button onClick={() => pizzaFileRef.current?.click()} className="text-[10px] font-black uppercase text-orange-500">Фото файлом</button>
                <input type="file" ref={pizzaFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'pizza')} />
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
              }} className="flex-grow bg-orange-500 text-white py-5 rounded-2xl font-black uppercase text-xs">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-6 py-5 bg-gray-100 rounded-2xl font-black uppercase text-xs">Скасувати</button>
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
