
import React, { useState, useRef } from 'react';
import { Pizza, Order, OrderStatus, SiteSpecial } from '../types';
import { 
  Plus, Edit2, Trash2, X, Check, Key, Shield, Image as ImageIcon, 
  Upload, List, ShoppingBag, Clock, CheckCircle, AlertCircle, 
  MapPin, Sparkles, MessageSquare, Phone, Settings, Send, ExternalLink 
} from 'lucide-react';
import { 
  saveAdminPassword, saveLogo, getStoredLogo, getStoredSpecial, 
  saveSpecial, getStoredShopPhone, saveShopPhone, getTelegramConfig, 
  saveTelegramConfig 
} from '../store';

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
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [shopPhone, setShopPhone] = useState(getStoredShopPhone());
  
  const tgConfig = getTelegramConfig();
  const [tgToken, setTgToken] = useState(tgConfig.token);
  const [tgChatId, setTgChatId] = useState(tgConfig.chatId);
  const [isTestingTg, setIsTestingTg] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  const logoInputRef = useRef<HTMLInputElement>(null);
  const pizzaImageInputRef = useRef<HTMLInputElement>(null);
  const specialImageInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю піцу?')) {
      onUpdatePizzas(pizzas.filter(p => p.id !== id));
    }
  };

  const handleEdit = (pizza: Pizza) => {
    setEditingId(pizza.id);
    setEditForm(pizza);
  };

  const handleSave = () => {
    if (editingId === 'new') {
      const newPizza: Pizza = {
        id: Math.random().toString(36).substr(2, 9),
        name: editForm.name || '',
        description: editForm.description || '',
        price: editForm.price || 0,
        image: editForm.image || 'https://picsum.photos/400/400',
        category: editForm.category || 'pizza',
        isNew: editForm.isNew,
        isPromo: editForm.isPromo,
      };
      onUpdatePizzas([newPizza, ...pizzas]);
    } else {
      onUpdatePizzas(pizzas.map(p => p.id === editingId ? { ...p, ...editForm } as Pizza : p));
    }
    setEditingId(null);
  };

  const handleSaveSiteSettings = () => {
    saveSpecial(siteSpecial);
    saveShopPhone(shopPhone);
    saveTelegramConfig(tgToken, tgChatId);
    setStatusMessage({ text: 'Налаштування оновлено!', type: 'success' });
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const testTelegram = async () => {
    if (!tgToken || !tgChatId) {
      setStatusMessage({ text: 'Спочатку введіть Token та Chat ID', type: 'error' });
      return;
    }
    setIsTestingTg(true);
    try {
      const message = `🔔 <b>ТЕСТОВЕ ПОВІДОМЛЕННЯ</b>\n\nВаш сайт P2PIZZA успішно підключений до Telegram! Тепер сюди будуть приходити нові замовлення.`;
      const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: message, parse_mode: 'HTML' })
      });
      if (response.ok) {
        setStatusMessage({ text: 'Тестове повідомлення надіслано!', type: 'success' });
      } else {
        const errData = await response.json();
        throw new Error(errData.description || 'Помилка Telegram API');
      }
    } catch (e: any) {
      setStatusMessage({ text: `Помилка: ${e.message}`, type: 'error' });
    } finally {
      setIsTestingTg(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handlePasswordChange = () => {
    if (newPass.length < 4) {
      setStatusMessage({ text: 'Пароль занадто короткий', type: 'error' });
      return;
    }
    saveAdminPassword(newPass);
    setStatusMessage({ text: 'Пароль змінено!', type: 'success' });
    setNewPass('');
    setTimeout(() => {
      setStatusMessage(null);
      setIsChangingPass(false);
    }, 2000);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'preparing': return 'bg-orange-100 text-orange-700';
      case 'ready': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-white overflow-y-auto text-black pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-black uppercase">Адмін-панель <span className="text-orange-500">P2PIZZA</span></h1>
            <div className="flex flex-wrap gap-4 mt-4">
              <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'menu' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><List size={18} /> Меню</button>
              <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><ShoppingBag size={18} /> Замовлення</button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><Settings size={18} /> Налаштування</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <button onClick={() => setIsChangingPass(!isChangingPass)} className="bg-gray-100 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"><Key size={18} /> Пароль</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </div>

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-sm uppercase flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {statusMessage.text}
          </div>
        )}

        {activeTab === 'menu' ? (
          <div className="grid gap-6">
            <button onClick={() => { setEditingId('new'); setEditForm({ name: '', description: '', price: 0, category: 'pizza', image: 'https://picsum.photos/400/400' }); }} className="bg-green-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-100">
               <Plus size={20} /> Додати нову позицію
            </button>
            
            {editingId && (
              <div className="bg-white p-8 rounded-3xl border-2 border-orange-200 animate-in fade-in zoom-in duration-200 shadow-xl">
                <h2 className="text-2xl font-black mb-6 text-black uppercase tracking-tight">{editingId === 'new' ? 'Нова піца' : 'Редагування'}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative group">
                      <img src={editForm.image} alt="Pizza" className="w-full h-full object-cover" />
                      <button onClick={() => pizzaImageInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 font-bold"><Upload size={32} />Змінити</button>
                      <input type="file" ref={pizzaImageInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditForm({ ...editForm, image: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input placeholder="Назва" className="px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <input type="number" placeholder="Ціна" className="px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} />
                    <textarea placeholder="Опис" rows={3} className="px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none sm:col-span-2 text-black font-medium" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  </div>
                </div>
                <div className="mt-8 flex gap-4 border-t pt-6">
                  <button onClick={handleSave} className="bg-orange-500 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"><Check size={18} /> Зберегти</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-100 text-black px-10 py-3 rounded-xl font-black uppercase text-xs">Скасувати</button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black text-white uppercase text-[10px] font-black tracking-widest">
                  <tr><th className="p-5">Фото</th><th className="p-5">Назва</th><th className="p-5">Ціна</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(pizza => (
                    <tr key={pizza.id} className="border-b last:border-0 hover:bg-orange-50/30 transition-colors">
                      <td className="p-4"><img src={pizza.image} className="w-16 h-16 object-cover rounded-xl" /></td>
                      <td className="p-4 font-black text-black">{pizza.name}</td>
                      <td className="p-4 font-black text-orange-600">{pizza.price} грн</td>
                      <td className="p-4 text-right flex gap-2 justify-end">
                        <button onClick={() => handleEdit(pizza)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(pizza.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Telegram Card */}
             <div className="bg-white p-8 rounded-[3rem] border-2 border-[#0088cc]/20 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Send size={120} className="text-[#0088cc]" />
                </div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#0088cc] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#0088cc]/20">
                      <Send size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight text-black leading-none">Telegram Сповіщення</h2>
                      <p className="text-[10px] font-black text-[#0088cc] uppercase tracking-widest mt-2">Отримуйте замовлення миттєво</p>
                    </div>
                  </div>
                  <button 
                    onClick={testTelegram}
                    disabled={isTestingTg}
                    className="bg-[#0088cc] text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#006699] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#0088cc]/10"
                  >
                    {isTestingTg ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={16} />}
                    Перевірити бота
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8 relative z-10">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bot API Token</label>
                    <input 
                      type="password"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#0088cc] outline-none text-black font-medium transition-all bg-gray-50/50"
                      placeholder="123456:ABC-DEF..."
                      value={tgToken}
                      onChange={e => setTgToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Мій Chat ID</label>
                    <input 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#0088cc] outline-none text-black font-black transition-all bg-gray-50/50"
                      placeholder="987654321"
                      value={tgChatId}
                      onChange={e => setTgChatId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-[#f0f9ff] p-6 rounded-[2rem] border border-[#0088cc]/10 space-y-4 relative z-10">
                   <h4 className="flex items-center gap-2 text-[#0088cc] font-black uppercase text-xs">
                     <AlertCircle size={16} /> Як це налаштувати?
                   </h4>
                   <div className="grid sm:grid-cols-3 gap-4">
                      <a href="https://t.me/BotFather" target="_blank" className="bg-white p-4 rounded-2xl border border-[#0088cc]/10 hover:border-[#0088cc] transition-all group">
                         <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Крок 1</p>
                         <p className="text-[11px] font-bold text-black leading-tight">Напишіть <span className="text-[#0088cc]">@BotFather</span> у Telegram та створіть нового бота (/newbot).</p>
                         <ExternalLink size={14} className="mt-2 text-gray-300 group-hover:text-[#0088cc]" />
                      </a>
                      <a href="https://t.me/userinfobot" target="_blank" className="bg-white p-4 rounded-2xl border border-[#0088cc]/10 hover:border-[#0088cc] transition-all group">
                         <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Крок 2</p>
                         <p className="text-[11px] font-bold text-black leading-tight">Напишіть <span className="text-[#0088cc]">@userinfobot</span> щоб дізнатися свій унікальний Chat ID.</p>
                         <ExternalLink size={14} className="mt-2 text-gray-300 group-hover:text-[#0088cc]" />
                      </a>
                      <div className="bg-white p-4 rounded-2xl border border-[#0088cc]/10">
                         <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Крок 3</p>
                         <p className="text-[11px] font-bold text-black leading-tight">Вставте дані вище та натисніть кнопку "Зберегти" внизу сторінки.</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Phone Card */}
             <div className="bg-white p-8 rounded-[3rem] border-2 border-orange-100 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100">
                    <Phone size={28} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Контакти закладу</h2>
                </div>
                <div className="space-y-2 max-w-sm">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Телефон для клієнтів</label>
                  <input 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black bg-gray-50/50"
                    placeholder="+380..."
                    value={shopPhone}
                    onChange={e => setShopPhone(e.target.value)}
                  />
                </div>
             </div>

             <div className="flex justify-end pt-4">
                <button onClick={handleSaveSiteSettings} className="bg-black text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-orange-500 transition-all shadow-2xl active:scale-95">
                  <CheckCircle size={20} /> Зберегти всі налаштування
                </button>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
             <div className="p-6 bg-gray-50 border-b flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight">Керування замовленнями</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black text-white uppercase text-[10px] font-black tracking-widest">
                    <tr><th className="p-5">ID / Дата</th><th className="p-5">Деталі</th><th className="p-5">Сума</th><th className="p-5 text-right">Статус</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-orange-50/20 transition-colors">
                        <td className="p-5">
                            <div className="font-black text-xs uppercase">{order.id}</div>
                            <div className="text-[9px] text-gray-400 font-bold">{order.date}</div>
                        </td>
                        <td className="p-5">
                            <div className="flex items-center gap-1 font-bold text-[10px] uppercase">
                                {order.type === 'delivery' ? 'Доставка' : 'Самовивіз'}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500">
                                {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                            </div>
                        </td>
                        <td className="p-5 font-black text-black">{order.total} грн</td>
                        <td className="p-5 text-right">
                            <select 
                                value={order.status}
                                onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className={`px-3 py-2 rounded-full text-[9px] font-black uppercase outline-none cursor-pointer ${getStatusColor(order.status)}`}
                            >
                                <option value="pending">Новий</option>
                                <option value="preparing">Готується</option>
                                <option value="ready">Готово</option>
                                <option value="delivered">Доставлено</option>
                                <option value="completed">Виконано</option>
                                <option value="cancelled">Скасовано</option>
                            </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
