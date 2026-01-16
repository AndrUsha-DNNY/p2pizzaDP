
import React, { useState, useEffect } from 'react';
import { Pizza, Order, OrderStatus } from './types';
import { Edit2, Trash2, X, Send, Phone, Camera, Sparkles, ImageIcon, Zap, Package, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
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
  const [apiWorks, setApiWorks] = useState<boolean | null>(null);

  useEffect(() => {
    // Перевірка доступності API
    fetch('/api/settings').then(res => setApiWorks(res.ok)).catch(() => setApiWorks(false));
  }, []);

  const handleSaveSettings = async () => {
    setStatus('Збереження у БД...');
    const ok = await saveSettingsToDB(localSettings);
    if (ok) {
      onUpdateSettings(localSettings);
      setStatus('Успішно збережено в базі!');
      setApiWorks(true);
    } else {
      setStatus('Помилка БД (дані збережені лише локально)');
      setApiWorks(false);
    }
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
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${apiWorks ? 'bg-green-500' : apiWorks === false ? 'bg-red-500' : 'bg-gray-300 animate-pulse'}`}></div>
              <span className="text-[10px] font-bold uppercase text-gray-400">
                {apiWorks ? 'БАЗА ДАНИХ ПІДКЛЮЧЕНА' : apiWorks === false ? 'ПОМИЛКА ПІДКЛЮЧЕННЯ (404/Offline)' : 'ПЕРЕВІРКА ПІДКЛЮЧЕННЯ...'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-orange-100 transition-colors"><X size={24}/></button>
        </div>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
          {['menu', 'orders', 'settings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}
            >
              {tab === 'menu' ? 'Меню' : tab === 'orders' ? 'Замовлення' : 'Налаштування'}
            </button>
          ))}
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8">
            {apiWorks === false && (
              <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600">
                <AlertCircle />
                <div className="text-xs font-bold uppercase">
                  Увага: Серверна частина (API) не знайдена. Дані зберігатимуться лише на цьому пристрої. 
                  Для роботи крос-девайс переконайтеся, що проект розгорнуто на Vercel з MONGODB_URI.
                </div>
              </div>
            )}

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
                  <button onClick={() => document.getElementById('logo-up')?.click()} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Завантажити</button>
                  <input id="logo-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                </div>
              </div>
              <div className="bg-white p-8 border-2 rounded-[2.5rem] border-gray-100">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Phone className="text-green-500" /> Телефон</h2>
                <input className="w-full p-4 border rounded-xl font-black text-lg" value={localSettings.phone} onChange={e=>setLocalSettings({...localSettings, phone: e.target.value})} />
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-blue-400 rounded-[3rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-blue-600"><Send /> Telegram Бот</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input className="w-full p-4 border rounded-xl font-bold" placeholder="Token" value={localSettings.tgToken || ''} onChange={e=>setLocalSettings({...localSettings, tgToken: e.target.value})} />
                <input className="w-full p-4 border rounded-xl font-bold" placeholder="Chat ID" value={localSettings.tgChatId || ''} onChange={e=>setLocalSettings({...localSettings, tgChatId: e.target.value})} />
              </div>
              <button onClick={async () => {
                 setStatus('Активація...');
                 const ok = await setupWebhook();
                 setStatus(ok ? 'Готово!' : 'Помилка активації');
                 setTimeout(() => setStatus(null), 3000);
              }} className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-black uppercase text-[10px]">Активувати Webhook</button>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-black transition-all">Зберегти в базу</button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <button onClick={() => {setEditingId('new'); setEditForm({name: '', price: 0, category: 'pizza', image: ''})}} className="bg-green-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px]">+ Додати нову піцу</button>
            <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr><th className="p-5">Товар</th><th className="p-5">Ціна</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-orange-50/30 transition-colors">
                      <td className="p-5 flex items-center gap-4">
                        <img src={p.image || localSettings.logo} className="w-12 h-12 object-cover rounded-xl border" />
                        <span className="font-bold text-sm">{p.name}</span>
                      </td>
                      <td className="p-5 font-black text-sm">{p.price} грн</td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-2 bg-blue-500 text-white rounded-xl"><Edit2 size={16}/></button>
                        <button onClick={async ()=>{if(confirm('Видалити?')) {
                          const newList = pizzas.filter(x=>x.id!==p.id);
                          const ok = await savePizzasToDB(newList);
                          if(ok) onUpdatePizzas(newList);
                        }}} className="p-2 bg-red-500 text-white rounded-xl"><Trash2 size={16}/></button>
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
            {orders.length === 0 ? <p className="text-center py-20 text-gray-400 font-black uppercase text-xs">Замовлень немає</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white px-2 py-0.5 rounded-lg font-black text-[9px] uppercase">{o.id}</span>
                      <span className="text-[10px] font-bold text-gray-300">{o.date}</span>
                    </div>
                    <p className="font-bold text-sm mt-2">{o.items.map(i=>`${i.name} x${i.quantity}`).join(', ')}</p>
                    <p className="text-orange-500 font-black text-[10px] mt-1 uppercase tracking-widest">📞 {o.phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-2xl">{o.total} <span className="text-xs">грн</span></p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-3 border-2 rounded-xl font-black text-[10px] uppercase bg-white">
                      <option value="Нове">Нове</option>
                      <option value="Готується">Готується</option>
                      <option value="Готово">Готово</option>
                      <option value="Виконано">Виконано</option>
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
          <div className="bg-white p-8 rounded-[3.5rem] w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-8">Страва</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center relative cursor-pointer" onClick={() => document.getElementById('pizza-up')?.click()}>
                  {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" /> : <Camera size={32} className="text-gray-300" />}
                </div>
                <input id="pizza-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'pizza')} />
              </div>
              <input className="w-full p-4 border rounded-2xl font-bold" placeholder="Назва" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})}/>
              <input type="number" className="w-full p-4 border rounded-2xl font-black" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price: Number(e.target.value)})}/>
              <textarea className="w-full p-4 border rounded-2xl font-medium text-xs h-28" placeholder="Склад" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/>
            </div>
            <div className="flex gap-4">
              <button onClick={async () => {
                let newList;
                if (editingId === 'new') newList = [{...editForm, id: 'p'+Date.now()} as Pizza, ...pizzas];
                else newList = pizzas.map(p=>p.id===editingId?{...p, ...editForm} as Pizza:p);
                
                setStatus('Збереження...');
                const ok = await savePizzasToDB(newList);
                if(ok) {
                  onUpdatePizzas(newList);
                  setEditingId(null);
                  setStatus('Збережено!');
                } else {
                  setStatus('Помилка сервера!');
                }
                setTimeout(() => setStatus(null), 3000);
              }} className="flex-grow bg-orange-500 text-white py-5 rounded-2xl font-black uppercase text-xs">Зберегти</button>
              <button onClick={()=>setEditingId(null)} className="px-8 py-5 bg-gray-100 rounded-2xl font-black uppercase text-xs">Назад</button>
            </div>
          </div>
        </div>
      )}

      {status && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-4 bg-black text-white rounded-full font-black text-xs uppercase z-[300] shadow-2xl flex items-center gap-2">
          {status.includes('Успішно') || status.includes('Збережено') ? <CheckCircle2 size={16} className="text-green-500" /> : <Zap size={16} className="text-orange-500 animate-pulse" />}
          {status}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
