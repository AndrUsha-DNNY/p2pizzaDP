
import React, { useState, useRef, useEffect } from 'react';
import { Pizza, Category, Order, OrderStatus, SiteSpecial } from './types';
import { 
  Plus, Edit2, Trash2, X, Check, Key, Shield, Image as ImageIcon, 
  Upload, List, ShoppingBag, Clock, CheckCircle, AlertCircle, 
  MapPin, Sparkles, MessageSquare, Phone, Settings, Send 
} from 'lucide-react';
import { 
  saveAdminPassword, saveLogo, getStoredLogo, getStoredSpecial, 
  saveSpecial, getStoredShopPhone, saveShopPhone, getTelegramConfig, 
  saveTelegramConfig 
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
      const message = `🔔 Тестове повідомлення від P2PIZZA!\nВаш бот налаштований вірно.`;
      const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: message, parse_mode: 'HTML' })
      });
      if (response.ok) {
        setStatusMessage({ text: 'Тестове повідомлення надіслано!', type: 'success' });
      } else {
        throw new Error('Помилка Telegram API');
      }
    } catch (e) {
      setStatusMessage({ text: 'Помилка: перевірте Token та Chat ID', type: 'error' });
    } finally {
      setIsTestingTg(false);
      setTimeout(() => setStatusMessage(null), 3000);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveLogo(reader.result as string);
        setStatusMessage({ text: 'Логотип оновлено!', type: 'success' });
        setTimeout(() => setStatusMessage(null), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePizzaImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSiteSpecial({ ...siteSpecial, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({ name: '', description: '', price: 0, category: 'pizza', image: 'https://picsum.photos/400/400' });
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
              <button 
                onClick={() => setActiveTab('menu')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'menu' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
              >
                <List size={18} /> Меню
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
              >
                <ShoppingBag size={18} /> Замовлення
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'settings' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
              >
                <Settings size={18} /> Налаштування
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => setIsChangingPass(!isChangingPass)}
              className="bg-gray-100 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Key size={18} /> Пароль
            </button>
            {activeTab === 'menu' && (
              <button 
                onClick={startNew}
                className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-600 transition-colors"
              >
                <Plus size={18} /> Створити
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </div>

        {isChangingPass && (
          <div className="mb-8 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 mb-4">
               <Shield className="text-blue-500" />
               <h2 className="text-xl font-bold text-black uppercase">Зміна пароля</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input 
                type="password"
                placeholder="Новий пароль"
                className="w-full sm:w-64 px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none bg-white text-black font-medium"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
              />
              <button onClick={handlePasswordChange} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors text-xs uppercase">Оновити</button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-sm uppercase flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {statusMessage.text}
          </div>
        )}

        {activeTab === 'menu' ? (
          <div className="grid gap-6">
            {editingId && (
              <div className="bg-white p-8 rounded-3xl border-2 border-orange-200 animate-in fade-in zoom-in duration-200 shadow-xl">
                <h2 className="text-2xl font-black mb-6 text-black uppercase tracking-tight">{editingId === 'new' ? 'Нова піца' : 'Редагування'}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative group">
                      <img src={editForm.image} alt="Pizza" className="w-full h-full object-cover" />
                      <button onClick={() => pizzaImageInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 font-bold"><Upload size={32} />Змінити</button>
                      <input type="file" ref={pizzaImageInputRef} className="hidden" accept="image/*" onChange={handlePizzaImageUpload} />
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input placeholder="Назва" className="px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <input type="number" placeholder="Ціна" className="px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} />
                    <textarea placeholder="Опис" rows={3} className="px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none sm:col-span-2 text-black font-medium" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                    <div className="flex items-center gap-8 sm:col-span-2">
                       <label className="flex items-center gap-3 font-black uppercase text-[10px] cursor-pointer"><input type="checkbox" className="accent-orange-500 w-5 h-5" checked={editForm.isNew} onChange={e => setEditForm({...editForm, isNew: e.target.checked})} /> Новинка</label>
                       <label className="flex items-center gap-3 font-black uppercase text-[10px] cursor-pointer"><input type="checkbox" className="accent-orange-500 w-5 h-5" checked={editForm.isPromo} onChange={e => setEditForm({...editForm, isPromo: e.target.checked})} /> Акція</label>
                    </div>
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
                  <tr><th className="p-5">Фото</th><th className="p-5">Назва</th><th className="p-5">Ціна</th><th className="p-5">Статус</th><th className="p-5 text-right">Дії</th></tr>
                </thead>
                <tbody>
                  {pizzas.map(pizza => (
                    <tr key={pizza.id} className="border-b last:border-0 hover:bg-orange-50/30 transition-colors">
                      <td className="p-4"><img src={pizza.image} className="w-16 h-16 object-cover rounded-xl" /></td>
                      <td className="p-4 font-black text-black">{pizza.name}</td>
                      <td className="p-4 font-black text-orange-600">{pizza.price} грн</td>
                      <td className="p-4"><div className="flex gap-2">
                        {pizza.isNew && <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">New</span>}
                        {pizza.isPromo && <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">Promo</span>}
                      </div></td>
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
          <div className="max-w-4xl space-y-10">
             <div className="bg-white p-8 rounded-3xl border-2 border-orange-200 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <ImageIcon className="text-orange-500" />
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Загальні налаштування</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Логотип піцерії</label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-orange-100 overflow-hidden flex items-center justify-center">
                            <img src={getStoredLogo()} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                          <button onClick={() => logoInputRef.current?.click()} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition-all text-xs uppercase flex items-center gap-2">
                            <Upload size={14} /> Змінити лого
                          </button>
                          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Телефон піцерії</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                          <input 
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black"
                            placeholder="+380..."
                            value={shopPhone}
                            onChange={e => setShopPhone(e.target.value)}
                          />
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Telegram Integration Card */}
             <div className="bg-gradient-to-br from-[#0088cc]/10 to-white p-8 rounded-3xl border-2 border-[#0088cc]/20 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0088cc] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#0088cc]/20">
                      <Send size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight text-black leading-none">Telegram Бот</h2>
                      <p className="text-[10px] font-black text-[#0088cc] uppercase tracking-widest mt-1">Сповіщення про замовлення</p>
                    </div>
                  </div>
                  <button 
                    onClick={testTelegram}
                    disabled={isTestingTg}
                    className="bg-[#0088cc] text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#006699] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTestingTg ? <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Send size={14} />}
                    Тест
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bot API Token (@BotFather)</label>
                    <input 
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#0088cc] outline-none text-black font-medium text-sm"
                      placeholder="123456:ABC-DEF..."
                      value={tgToken}
                      onChange={e => setTgToken(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Chat ID (@userinfobot)</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#0088cc] outline-none text-black font-black text-sm"
                      placeholder="987654321"
                      value={tgChatId}
                      onChange={e => setTgChatId(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="bg-white/50 p-4 rounded-2xl border border-[#0088cc]/10 text-[10px] font-bold text-gray-500 leading-relaxed">
                  <p className="mb-1 uppercase text-[#0088cc] font-black">Як налаштувати:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Створіть бота через @BotFather та отримайте <b>Token</b>.</li>
                    <li>Почніть діалог з ботом (/start).</li>
                    <li>Дізнайтесь свій <b>Chat ID</b> через @userinfobot та впишіть його сюди.</li>
                    <li>Натисніть "Зберегти" та "Тест".</li>
                  </ol>
                </div>
             </div>

             <div className="bg-white p-8 rounded-3xl border-2 border-orange-200 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="text-orange-500" />
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">Акція на головній сторінці</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Метка акції (Badge)</label>
                       <input 
                         className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black uppercase"
                         value={siteSpecial.badge}
                         onChange={e => setSiteSpecial({...siteSpecial, badge: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Заголовок (H1)</label>
                       <input 
                         className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-black"
                         value={siteSpecial.title}
                         onChange={e => setSiteSpecial({...siteSpecial, title: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Опис акції</label>
                       <textarea 
                         rows={4}
                         className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-500 outline-none text-black font-medium"
                         value={siteSpecial.description}
                         onChange={e => setSiteSpecial({...siteSpecial, description: e.target.value})}
                       />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Фонове зображення</label>
                     <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative group">
                       <img src={siteSpecial.image} alt="Special" className="w-full h-full object-cover brightness-75" />
                       <button onClick={() => specialImageInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 font-bold"><Upload size={32} />Завантажити</button>
                       <input type="file" ref={specialImageInputRef} className="hidden" accept="image/*" onChange={handleSpecialImageUpload} />
                     </div>
                   </div>
                </div>
                
                <div className="mt-10 border-t pt-8 flex justify-end">
                  <button onClick={handleSaveSiteSettings} className="bg-orange-500 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-black transition-all">
                    <Check size={18} /> Зберегти налаштування
                  </button>
                </div>
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
                    <tr><th className="p-5">ID / Дата</th><th className="p-5">Деталі</th><th className="p-5">Оплата</th><th className="p-5">Склад / Коментар</th><th className="p-5">Сума</th><th className="p-5 text-right">Статус</th></tr>
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
                                {order.type === 'delivery' ? <AlertCircle size={10} className="text-orange-500"/> : <CheckCircle size={10} className="text-green-500"/>}
                                {order.type === 'delivery' ? 'Доставка' : 'Самовивіз'}
                            </div>
                            {order.type === 'delivery' && order.address && (
                              <div className="flex items-center gap-1 text-[9px] font-black text-black uppercase mt-1">
                                <MapPin size={10} className="text-orange-500" /> {order.address}, {order.houseNumber}
                              </div>
                            )}
                            {order.pickupTime && <div className="text-[9px] font-black text-orange-500 uppercase">{order.pickupTime}</div>}
                        </td>
                        <td className="p-5">
                          <div className="px-2 py-1 rounded-md text-[9px] font-black uppercase inline-block bg-gray-100 text-gray-700">
                            {order.paymentMethod === 'card_on_receipt' ? 'Картою' : 'Готівка'}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {order.items.map(item => (
                              <span key={item.id} className="bg-gray-100 text-black px-2 py-0.5 rounded text-[10px] font-bold">
                                {item.name} x{item.quantity}
                              </span>
                            ))}
                          </div>
                          {order.notes && (
                            <div className="flex items-start gap-1 bg-orange-50 p-2 rounded-lg border border-orange-100">
                               <MessageSquare size={12} className="text-orange-500 mt-0.5 shrink-0" />
                               <div className="text-[10px] font-medium text-black italic leading-tight">
                                  {order.notes}
                               </div>
                            </div>
                          )}
                        </td>
                        <td className="p-5 font-black text-black">{order.total} грн</td>
                        <td className="p-5 text-right">
                            <select 
                                value={order.status}
                                onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className={`px-2 py-1 rounded-full text-[9px] font-black uppercase outline-none border-none cursor-pointer ${getStatusColor(order.status)}`}
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
