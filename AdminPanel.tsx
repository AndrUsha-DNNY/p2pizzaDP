
import React, { useState } from 'react';
import { Pizza, Order, OrderStatus } from './types';
import { Edit2, Trash2, X, Send, Phone, Camera, Sparkles, ImageIcon, Zap, Package } from 'lucide-react';
import { savePizzasToDB, saveSettingsToDB, setupWebhook } from './store';

interface AdminPanelProps {
  pizzas: Pizza[];
  onUpdatePizzas: (pizzas: Pizza[]) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onClose: () => void;
  siteSettings: any;
  onUpdateSettings: (s: any) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ pizzas, onUpdatePizzas, orders, onUpdateOrderStatus, onClose, siteSettings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'settings'>('menu');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Pizza>>({});
  const [localSettings, setLocalSettings] = useState(siteSettings);
  const [status, setStatus] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    setStatus('Зберігання...');
    const ok = await saveSettingsToDB(localSettings);
    if (ok) {
      onUpdateSettings(localSettings);
      setStatus('Сайт оновлено для всіх!');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleToggleWebhook = async () => {
    setStatus('Активація кнопок...');
    await setupWebhook();
    setStatus('Telegram Webhook активний!');
    setTimeout(() => setStatus(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'logo') setLocalSettings({ ...localSettings, logo: base64 });
        else if (target === 'hero') setLocalSettings({ ...localSettings, special: { ...localSettings.special, image: base64 } });
        else setEditForm(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto pb-24 text-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors"><X size={24}/></button>
        </div>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
          {['menu', 'orders', 'settings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}
            >
              {tab === 'menu' ? 'Меню' : tab === 'orders' ? 'Замовлення' : 'Налаштування сайту'}
            </button>
          ))}
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="bg-white p-8 border-2 border-orange-400 rounded-[3rem] shadow-xl">
               <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2 text-orange-600"><Sparkles /> Головний банер</h2>
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <input className="w-full p-4 border rounded-2xl font-black text-xl" placeholder="Заголовок" value={localSettings.special.title} onChange={e=>setLocalSettings({...localSettings, special: {...localSettings.special, title: e.target.value}})} />
                    <textarea className="w-full p-4 border rounded-2xl font-medium text-sm h-24" placeholder="Опис акції" value={localSettings.special.description} onChange={e=>setLocalSettings({...localSettings, special: {...localSettings.special, description: e.target.value}})} />
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('hero-up')?.click()}>
                    <div className="h-44 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200">
                      <img src={localSettings.special.image} className="w-full h-full object-cover" alt="Banner" />
                    </div>
                    <input id="hero-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero')} />
                  </div>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 border-2 rounded-[2.5rem] border-gray-100">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><ImageIcon className="text-orange-500" /> Логотип</h2>
                <div className="flex items-center gap-4">
                  <img src={localSettings.logo} className="w-16 h-16 rounded-xl border object-cover shadow-sm" alt="Logo" />
                  <button onClick={() => document.getElementById('logo-up')?.click()} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-orange-500 transition-colors">Завантажити</button>
                  <input id="logo-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                </div>
              </div>
              <div className="bg-white p-8 border-2 rounded-[2.5rem] border-gray-100">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Phone className="text-green-500" /> Телефон</h2>
                <input className="w-full p-4 border rounded-xl font-black text-lg focus:border-green-500 outline-none" value={localSettings.phone} onChange={e=>setLocalSettings({...localSettings, phone: e.target.value})} />
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-blue-400 rounded-[3rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-blue-600"><Send /> Telegram Бот (Сповіщення)</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input className="w-full p-4 border rounded-xl font-bold" placeholder="Bot Token" value={localSettings.tgToken || ''} onChange={e=>setLocalSettings({...localSettings, tgToken: e.target.value})} />
                <input className="w-full p-4 border rounded-xl font-bold" placeholder="Chat ID" value={localSettings.tgChatId || ''} onChange={e=>setLocalSettings({...localSettings, tgChatId: e.target.value})} />
              </div>
              <button onClick={handleToggleWebhook} className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors border border-blue-100">
                <Zap size={14} /> Увімкнути кнопки в Telegram
              </button>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl shadow-orange-200 hover:bg-black transition-all active:scale-95">Зберегти та оновити сайт для всіх</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <button onClick={() => {setEditingId('new'); setEditForm({name: '', price: 0, category: 'pizza', image: ''})}} className="bg-green-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all">+ Додати нову піцу</button>
            <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr><th className="p-5">Товар</th><th className="p-5">Ціна</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50 transition-colors">
                      <td className="p-5 flex items-center gap-4">
                        <img src={p.image || localSettings.logo} className="w-12 h-12 object-cover rounded-xl border" alt={p.name} />
                        <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-5 font-black text-sm">{p.price} грн</td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-3 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-colors"><Edit2 size={16}/></button>
                        <button onClick={()=>{if(confirm('Видалити піцу?')) onUpdatePizzas(pizzas.filter(x=>x.id!==p.id))}} className="p-3 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {orders.length === 0 ? <p className="text-center py-20 text-gray-400 font-black uppercase text-xs">Замовлень поки немає</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-black text-white px-2 py-0.5 rounded-lg font-black text-[9px] uppercase">{o.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                    </div>
                    <p className="font-bold text-sm">{o.items.map(i=>`${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-orange-500 font-black text-[10px] uppercase mt-1">📞 {o.phone}</p>
                    {o.address && <p className="text-gray-500 font-bold text-[9px] uppercase">🏠 {o.address}, {o.houseNumber}</p>}
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                    <p className="font-black text-2xl">{o.total} грн</p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-3 border-2 rounded-xl font-black text-[10px] uppercase bg-white focus:border-orange-500 outline-none">
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
          <div className="bg-white p-8 rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black uppercase mb-8 tracking-tighter">Налаштування страви</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center relative group cursor-pointer" onClick={() => document.getElementById('pizza-up')?.click()}>
                  {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" alt="Preview" /> : <Camera size={32} className="text-gray-300" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase">Змінити</div>
                </div>
                <input id="pizza-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'pizza')} />
                <div className="flex-grow">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Фото товару</p>
                  <button onClick={() => document.getElementById('pizza-up')?.click()} className="text-[10px] font-black uppercase text-orange-500 hover:underline">Вибрати файл</button>
                </div>
              </div>
              <input className="w-full p-4 border rounded-2xl bg-gray-50 font-bold outline-none focus:bg-white focus:border-orange-500 transition-all" placeholder="Назва страви" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})}/>
              <input type="number" className="w-full p-4 border rounded-2xl bg-gray-50 font-black outline-none focus:bg-white focus:border-orange-500 transition-all" placeholder="Ціна (грн)" value={editForm.price} onChange={e=>setEditForm({...editForm, price: Number(e.target.value)})}/>
              <textarea className="w-full p-4 border rounded-2xl bg-gray-50 font-medium text-xs h-28 resize-none outline-none focus:bg-white focus:border-orange-500 transition-all" placeholder="Опис (склад)" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                if (editingId === 'new') onUpdatePizzas([{...editForm, id: 'p'+Date.now()} as Pizza, ...pizzas]);
                else onUpdatePizzas(pizzas.map(p=>p.id===editingId?{...p, ...editForm} as Pizza:p));
                setEditingId(null);
              }} className="flex-grow bg-orange-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-orange-100 hover:bg-black transition-all">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-8 py-5 bg-gray-100 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all">Скасувати</button>
            </div>
          </div>
        </div>
      )}

      {status && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-4 rounded-full font-black text-xs uppercase z-[300] shadow-2xl animate-in slide-in-from-bottom">
          {status}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
