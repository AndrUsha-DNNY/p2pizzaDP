
import React, { useState, useEffect } from 'react';
import { Pizza, Order, OrderStatus } from './types';
import { Edit2, Trash2, X, Send, Phone, Camera, Sparkles, ImageIcon, Zap, Package, AlertCircle, CheckCircle2, RefreshCw, CloudOff, Cloud, Copy } from 'lucide-react';
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
  const [isChecking, setIsChecking] = useState(false);

  // Ваше актуальне посилання
  const MONGO_URI_TEMPLATE = "mongodb+srv://rittefyoutobe_db_user:6WbDYmUawtCozGtg@p2pizza.zcsm9m9.mongodb.net/?appName=p2pizza";

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/settings');
      // Якщо статус 200 - база працює. Якщо 500 або 404 - не налаштовано змінні середовища.
      setApiWorks(res.ok);
    } catch {
      setApiWorks(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus('Скопійовано!');
    setTimeout(() => setStatus(null), 2000);
  };

  const handleSaveSettings = async () => {
    setStatus('Збереження...');
    const ok = await saveSettingsToDB(localSettings);
    onUpdateSettings(localSettings);
    setStatus(ok ? 'Збережено в хмарі!' : 'Збережено лише локально');
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
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto pb-24 text-black animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">P2P <span className="text-orange-500">ADMIN</span></h1>
            <div className="flex items-center gap-3 mt-2">
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${apiWorks ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700 animate-pulse'}`}>
                  {apiWorks ? <Cloud size={10} /> : <CloudOff size={10} />}
                  {apiWorks ? 'БАЗА ДАНИХ АКТИВНА' : 'ПОМИЛКА ПІДКЛЮЧЕННЯ'}
               </div>
               <button 
                onClick={checkConnection} 
                disabled={isChecking}
                className="p-1 hover:bg-gray-100 rounded-full transition-all active:rotate-180 duration-500"
               >
                  <RefreshCw size={12} className={isChecking ? 'animate-spin text-orange-500' : 'text-gray-400'} />
               </button>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-2xl hover:bg-orange-100 transition-all active:scale-90"><X size={24}/></button>
        </div>

        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {['menu', 'orders', 'settings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-white shadow-2xl scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              {tab === 'menu' ? '🍕 Меню' : tab === 'orders' ? '📦 Замовлення' : '⚙️ Налаштування'}
            </button>
          ))}
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
            {!apiWorks && (
              <div className="bg-red-50 border-2 border-red-200 p-8 rounded-[3rem] space-y-6">
                <div className="flex items-center gap-3 text-red-600 font-black uppercase text-sm">
                  <AlertCircle className="animate-pulse" /> БАЗУ НЕ ПІДКЛЮЧЕНО
                </div>
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-red-800/70 uppercase leading-relaxed">
                    На вашому сайті у Vercel не виявлено налаштувань для бази даних. Скопіюйте цей рядок:
                  </p>
                  <div className="flex items-center gap-2 bg-white/50 p-4 rounded-2xl border border-red-100 group">
                    <code className="text-[10px] font-mono font-bold text-red-900 break-all flex-grow">{MONGO_URI_TEMPLATE}</code>
                    <button onClick={() => copyToClipboard(MONGO_URI_TEMPLATE)} className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/80 p-5 rounded-3xl shadow-sm border border-red-100">
                    <span className="text-red-500 font-black text-xs">КРОК 1</span>
                    <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase leading-tight">Зайдіть у <b>Vercel Settings</b> → <b>Environment Variables</b>. Створіть змінну <b>MONGODB_URI</b>.</p>
                  </div>
                  <div className="bg-white/80 p-5 rounded-3xl shadow-sm border border-red-100">
                    <span className="text-red-500 font-black text-xs">КРОК 2</span>
                    <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase leading-tight">Зробіть <b>Redeploy</b> проекту, щоб сервер побачив цей пароль і підключився до бази.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-8 border-2 border-orange-400 rounded-[3rem] shadow-xl">
               <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2 text-orange-600"><Sparkles /> Головний банер</h2>
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Заголовок на головній</label>
                       <input className="w-full p-4 border rounded-2xl font-black text-xl focus:border-orange-500 outline-none transition-all" placeholder="Заголовок" value={localSettings.special.title} onChange={e=>setLocalSettings({...localSettings, special: {...localSettings.special, title: e.target.value}})} />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Текст акції</label>
                       <textarea className="w-full p-4 border rounded-2xl font-medium text-sm h-24 focus:border-orange-500 outline-none transition-all resize-none" placeholder="Опис акції" value={localSettings.special.description} onChange={e=>setLocalSettings({...localSettings, special: {...localSettings.special, description: e.target.value}})} />
                    </div>
                  </div>
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('hero-up')?.click()}>
                    <div className="h-44 rounded-3xl overflow-hidden border-4 border-dashed border-gray-100 group-hover:border-orange-300 transition-all flex items-center justify-center">
                      <img src={localSettings.special.image} className="w-full h-full object-cover" alt="Banner" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Camera className="text-white" size={32} />
                      </div>
                    </div>
                    <input id="hero-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'hero')} />
                  </div>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 border-2 rounded-[3rem] border-gray-100 hover:border-orange-200 transition-all">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><ImageIcon className="text-orange-500" /> Логотип</h2>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-inner">
                    <img src={localSettings.logo} className="w-full h-full object-cover" alt="Logo" />
                  </div>
                  <button onClick={() => document.getElementById('logo-up')?.click()} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-orange-500 transition-all shadow-lg active:scale-95">Завантажити</button>
                  <input id="logo-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                </div>
              </div>
              <div className="bg-white p-8 border-2 rounded-[3rem] border-gray-100 hover:border-green-200 transition-all">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Phone className="text-green-500" /> Телефон</h2>
                <div className="flex flex-col gap-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Номер для замовлень</label>
                   <input className="w-full p-4 border rounded-2xl font-black text-xl focus:border-green-500 outline-none transition-all" value={localSettings.phone} onChange={e=>setLocalSettings({...localSettings, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-blue-400 rounded-[3rem] shadow-sm">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-blue-600"><Send /> Telegram Бот</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input className="w-full p-4 border rounded-2xl font-bold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="Bot Token" value={localSettings.tgToken || ''} onChange={e=>setLocalSettings({...localSettings, tgToken: e.target.value})} />
                <input className="w-full p-4 border rounded-2xl font-bold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all" placeholder="Chat ID" value={localSettings.tgChatId || ''} onChange={e=>setLocalSettings({...localSettings, tgChatId: e.target.value})} />
              </div>
              <button onClick={async () => {
                 setStatus('Активація...');
                 const ok = await setupWebhook();
                 setStatus(ok ? 'Готово!' : 'Помилка активації');
                 setTimeout(() => setStatus(null), 3000);
              }} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-100 transition-all active:scale-[0.98]">Активувати Webhook</button>
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-orange-500 text-white py-8 rounded-[3rem] font-black uppercase shadow-2xl hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98]">
              {apiWorks ? '🔥 Зберегти в хмару MongoDB' : '💾 Зберегти локально'}
            </button>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <button onClick={() => {setEditingId('new'); setEditForm({name: '', price: 0, category: 'pizza', image: ''})}} className="bg-green-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2">
              <Zap size={14} /> Додати нову піцу
            </button>
            <div className="bg-white border-2 border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr><th className="p-6">Товар</th><th className="p-6">Ціна</th><th className="p-6 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-orange-50/50 transition-colors">
                      <td className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border shadow-sm">
                          <img src={p.image || localSettings.logo} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{p.name}</span>
                      </td>
                      <td className="p-6 font-black text-base">{p.price} <span className="text-[10px] text-orange-500">ГРН</span></td>
                      <td className="p-6 text-right space-x-2">
                        <button onClick={()=>{setEditingId(p.id); setEditForm(p);}} className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-100 hover:bg-black transition-all active:scale-90"><Edit2 size={16}/></button>
                        <button onClick={async ()=>{if(confirm('Видалити?')) {
                          const newList = pizzas.filter(x=>x.id!==p.id);
                          const ok = await savePizzasToDB(newList);
                          if(ok) onUpdatePizzas(newList);
                        }}} className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-100 hover:bg-black transition-all active:scale-90"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {orders.length === 0 ? <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-black uppercase text-xs">Замовлень поки немає</p>
              </div> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-black text-white px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-tighter">{o.id}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.date}</span>
                    </div>
                    <p className="font-black text-lg text-gray-900 leading-tight mb-2">{o.items.map(i=>`${i.name} x${i.quantity}`).join(', ')}</p>
                    <div className="flex flex-wrap gap-4">
                       <p className="text-orange-500 font-black text-[10px] uppercase bg-orange-50 px-3 py-1 rounded-lg">📞 {o.phone}</p>
                       <p className="text-gray-500 font-black text-[10px] uppercase bg-gray-50 px-3 py-1 rounded-lg">📍 {o.type === 'delivery' ? 'Доставка' : 'Самовивіз'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <p className="font-black text-3xl whitespace-nowrap">{o.total} <span className="text-sm text-orange-500 font-bold uppercase">грн</span></p>
                    <select value={o.status} onChange={e=>onUpdateOrderStatus(o.id, e.target.value as OrderStatus)} className="p-4 border-2 rounded-2xl font-black text-[10px] uppercase bg-white outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm">
                      <option value="Нове">🆕 Нове</option>
                      <option value="Готується">⏳ Готується</option>
                      <option value="Готово">✅ Готово</option>
                      <option value="Виконано">🏁 Виконано</option>
                    </select>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[4rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-2xl font-black uppercase tracking-tighter">Налаштування <span className="text-orange-500">страви</span></h2>
               <button onClick={()=>setEditingId(null)} className="p-2 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 bg-gray-50 rounded-[2rem] overflow-hidden border-4 border-dashed border-gray-100 flex items-center justify-center relative group cursor-pointer active:scale-95 transition-all" onClick={() => document.getElementById('pizza-up')?.click()}>
                  {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover" /> : <Camera size={36} className="text-gray-300" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                     <Camera className="text-white" size={24} />
                  </div>
                </div>
                <div className="flex-grow">
                   <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Фото товару</p>
                   <p className="text-[9px] font-bold text-gray-300 uppercase leading-tight">PNG або JPG,<br/>макс 500 КБ</p>
                </div>
                <input id="pizza-up" type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'pizza')} />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Назва страви</label>
                 <input className="w-full p-4 border rounded-2xl font-bold bg-gray-50 focus:bg-white focus:border-orange-500 outline-none transition-all" placeholder="Назва" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})}/>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Ціна (ГРН)</label>
                 <input type="number" className="w-full p-4 border rounded-2xl font-black text-xl bg-gray-50 focus:bg-white focus:border-orange-500 outline-none transition-all" placeholder="Ціна" value={editForm.price} onChange={e=>setEditForm({...editForm, price: Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Склад та опис</label>
                 <textarea className="w-full p-4 border rounded-2xl font-medium text-xs h-28 bg-gray-50 focus:bg-white focus:border-orange-500 outline-none transition-all resize-none" placeholder="Склад" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={async () => {
                let newList;
                if (editingId === 'new') newList = [{...editForm, id: 'p'+Date.now()} as Pizza, ...pizzas];
                else newList = pizzas.map(p=>p.id===editingId?{...p, ...editForm} as Pizza:p);
                
                setStatus('Оновлення...');
                const ok = await savePizzasToDB(newList);
                if(ok || !apiWorks) {
                  onUpdatePizzas(newList);
                  setEditingId(null);
                  setStatus('Готово!');
                } else {
                  setStatus('Помилка БД!');
                }
                setTimeout(() => setStatus(null), 3000);
              }} className="flex-grow bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-black transition-all active:scale-95">Зберегти страву</button>
            </div>
          </div>
        </div>
      )}

      {status && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 bg-black text-white rounded-full font-black text-[10px] uppercase z-[300] shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          {status.includes('Скопійовано') || status.includes('Готово') ? <CheckCircle2 size={16} className="text-green-500" /> : <Zap size={16} className="text-orange-500 animate-pulse" />}
          {status}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
