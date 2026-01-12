
import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Truck, Store, ShoppingCart as ShoppingCartIcon, Banknote, CreditCard, MapPin, Home, Phone, Check, ClipboardList } from 'lucide-react';
import { CartItem, Order } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (order: Partial<Order>) => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onPlaceOrder }) => {
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_on_receipt'>('cash');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [minTime, setMinTime] = useState('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 8);
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setMinTime(timeString);
    if (!pickupTime) setPickupTime(timeString);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmOrder = () => {
    if (orderType === 'delivery') {
      if (!address.trim()) {
        alert('Будь ласка, вкажіть вулицю для доставки.');
        return;
      }
      if (!houseNumber.trim()) {
        alert('Будь ласка, вкажіть номер будинку.');
        return;
      }
      if (!phoneNumber.trim() || phoneNumber.length < 10) {
        alert('Будь ласка, вкажіть коректний номер телефону для зв’язку.');
        return;
      }
    }

    onPlaceOrder({ 
      items, 
      total, 
      type: orderType, 
      address: orderType === 'delivery' ? address : undefined,
      houseNumber: orderType === 'delivery' ? houseNumber : undefined,
      phone: orderType === 'delivery' ? phoneNumber : undefined,
      pickupTime: orderType === 'pickup' ? pickupTime : undefined,
      paymentMethod: paymentMethod,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end text-black">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
            <ShoppingCartIcon className="text-orange-500" /> Ваш кошик
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <img src="https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&q=80&w=400" className="w-32 mx-auto rounded-full mb-4 grayscale opacity-50 shadow-inner" alt="empty" />
              <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Ваш кошик порожній...</p>
              <button onClick={onClose} className="mt-4 text-orange-500 font-bold hover:underline">Перейти до меню</button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 p-2 rounded-2xl border border-transparent hover:border-orange-50 transition-colors">
                <img src={item.image} className="w-20 h-20 object-cover rounded-xl shadow-sm border border-gray-100" alt={item.name} />
                <div className="flex-grow">
                  <h4 className="font-black text-lg text-black">{item.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1 gap-3 border border-gray-100">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="text-black hover:text-orange-500 transition-colors"><Minus size={16} /></button>
                      <span className="font-black text-black">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="text-black hover:text-orange-500 transition-colors"><Plus size={16} /></button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-black">{item.price * item.quantity} грн</span>
                      <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {items.length > 0 && (
            <div className="border-t pt-6 space-y-6">
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest mb-3 text-gray-400">Спосіб отримання</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setOrderType('delivery')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-black uppercase text-xs ${orderType === 'delivery' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'}`}
                  >
                    <Truck size={18} /> Доставка
                  </button>
                  <button 
                    onClick={() => setOrderType('pickup')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-black uppercase text-xs ${orderType === 'pickup' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'}`}
                  >
                    <Store size={18} /> Самовивіз
                  </button>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div className="space-y-4 animate-in slide-in-from-top duration-200">
                  <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">Дані для доставки</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Вулиця" 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Будинок та кв." 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                      <input 
                        type="tel" 
                        placeholder="Номер телефону (+380...)" 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {orderType === 'pickup' && (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 animate-in slide-in-from-top duration-200">
                  <label className="block text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">Час самовивозу (мін. 8 хв):</label>
                  <input 
                    type="time" 
                    min={minTime}
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 font-black"
                  />
                </div>
              )}

              <div>
                <h3 className="font-black text-sm uppercase tracking-widest mb-3 text-gray-400">Особливі побажання (Special requests)</h3>
                <div className="relative">
                  <ClipboardList className="absolute left-4 top-4 text-orange-500" size={18} />
                  <textarea 
                    placeholder="Ваші коментарі до замовлення..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-sm min-h-[100px] resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-black text-sm uppercase tracking-widest mb-3 text-gray-400">Спосіб оплати</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                        <Banknote className="text-black" size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-xs uppercase tracking-tight text-black">Готівкою</p>
                        <p className="text-[10px] text-gray-500 font-bold">Оплата при отриманні</p>
                      </div>
                    </div>
                    {paymentMethod === 'cash' && <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('card_on_receipt')}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${paymentMethod === 'card_on_receipt' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                        <CreditCard className="text-black" size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-xs uppercase tracking-tight text-black">Картою</p>
                        <p className="text-[10px] text-gray-500 font-bold">Через термінал при отриманні</p>
                      </div>
                    </div>
                    {paymentMethod === 'card_on_receipt' && <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-white rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Всього до сплати</p>
                <p className="text-3xl font-black text-black">{total} <span className="text-sm font-bold text-orange-500">грн</span></p>
              </div>
            </div>
            
            <button 
              onClick={handleConfirmOrder}
              className="w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-100 bg-orange-500 text-white hover:bg-black mb-safe"
            >
              Підтвердити замовлення
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
