
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.tsx';
import PizzaCard from './components/PizzaCard.tsx';
import Cart from './components/Cart.tsx';
import Auth from './components/Auth.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import CookingTracker from './components/CookingTracker.tsx';
import Footer from './components/Footer.tsx';
import { Pizza, CartItem, Order, User, OrderStatus, SiteSpecial } from './types.ts';
import { 
  getStoredPizzas, savePizzas, getStoredUser, saveUser, 
  getStoredOrders, saveOrders, saveOrder, getStoredSpecial, 
  getTelegramConfig 
} from './store.ts';
import { 
  Clock, CheckCircle2, ShoppingCart, Info, ShoppingBag, MapPin, 
  Phone, Pizza as PizzaIcon, Package, Star, Heart, History, 
  XCircle, Zap, ShieldCheck, Smile, Utensils 
} from 'lucide-react';

interface FlyingPizza {
  id: string;
  image: string;
  startX: number;
  startY: number;
}

const App: React.FC = () => {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [flyingPizzas, setFlyingPizzas] = useState<FlyingPizza[]>([]);
  
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  useEffect(() => {
    setPizzas(getStoredPizzas());
    setUser(getStoredUser());
    setOrders(getStoredOrders());
    setSiteSpecial(getStoredSpecial());
  }, []);

  useEffect(() => {
    if (currentView === 'home' || currentView === 'admin') {
      setSiteSpecial(getStoredSpecial());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  const activePreparingOrder = useMemo(() => {
    return orders.find(o => o.status === 'preparing');
  }, [orders]);

  const sendTelegramNotification = async (order: Order) => {
    const { token, chatId } = getTelegramConfig();
    if (!token || !chatId) return;

    const itemsList = order.items.map(i => `• <b>${i.name}</b> x${i.quantity} (${i.price * i.quantity} грн)`).join('\n');
    const typeStr = order.type === 'delivery' ? '🚀 Доставка' : '🥡 Самовивіз';
    const payStr = order.paymentMethod === 'card_on_receipt' ? '💳 Картою' : '💵 Готівкою';
    
    let message = `🆕 <b>НОВЕ ЗАМОВЛЕННЯ ${order.id}</b>\n\n`;
    message += `${itemsList}\n\n`;
    message += `💰 <b>Сума:</b> ${order.total} грн\n`;
    message += `📍 <b>Тип:</b> ${typeStr}\n`;
    message += `💳 <b>Оплата:</b> ${payStr}\n`;

    if (order.type === 'delivery') {
      message += `🏠 <b>Адреса:</b> ${order.address}, буд. ${order.houseNumber}\n`;
    } else {
      message += `⏰ <b>Час:</b> ${order.pickupTime}\n`;
    }

    if (order.phone) {
      message += `📞 <b>Телефон:</b> ${order.phone}\n`;
    }
    
    if (order.notes) {
      message += `📝 <b>Коментар:</b> <i>${order.notes}</i>\n`;
    }

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (e) {
      console.error('Telegram notification failed', e);
    }
  };

  const handleAddToCart = (pizza: Pizza, rect: DOMRect) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFlyingPizzas(prev => [...prev, { 
      id, 
      image: pizza.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png', 
      startX: rect.left, 
      startY: rect.top 
    }]);

    setTimeout(() => {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === pizza.id);
        if (existing) {
          return prev.map(item => item.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...pizza, quantity: 1 }];
      });
      setFlyingPizzas(prev => prev.filter(p => p.id !== id));
      setNotification(`${pizza.name} додано до кошика!`);
      setTimeout(() => setNotification(null), 2000);
    }, 700);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePlaceOrder = (orderData: Partial<Order>) => {
    const newOrder: Order = {
      id: 'P2P-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      items: cartItems,
      total: orderData.total || 0,
      date: new Date().toLocaleString('uk-UA'),
      type: (orderData.type as any) || 'delivery',
      address: orderData.address,
      houseNumber: orderData.houseNumber,
      phone: orderData.phone,
      pickupTime: orderData.pickupTime,
      paymentMethod: (orderData.paymentMethod as any) || 'cash',
      status: 'pending',
      notes: orderData.notes
    };
    
    saveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    sendTelegramNotification(newOrder); // Sending notification to TG
    
    setCartItems([]);
    setIsCartOpen(false);
    
    alert('Дякуємо! Ваше замовлення прийнято.');
    setCurrentView('history');
  };

  const onUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
            const updated = { ...o, status };
            if (status === 'preparing' && !o.preparingStartTime) {
                updated.preparingStartTime = Date.now();
            }
            return updated;
        }
        return o;
    });
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Скасувати замовлення?')) {
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o);
      setOrders(updatedOrders);
      saveOrders(updatedOrders);
      setNotification("Замовлення скасовано");
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleToggleFavorite = (id: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const updatedUser = { ...user };
    if (updatedUser.favorites.includes(id)) {
      updatedUser.favorites = updatedUser.favorites.filter(favId => favId !== id);
    } else {
      updatedUser.favorites.push(id);
    }
    setUser(updatedUser);
    saveUser(updatedUser);
  };

  const filteredPizzas = useMemo(() => {
    switch (currentView) {
      case 'promotions': return pizzas.filter(p => p.isPromo);
      case 'new': return pizzas.filter(p => p.isNew);
      case 'favorites': return pizzas.filter(p => user?.favorites.includes(p.id));
      case 'box': return pizzas.filter(p => p.category === 'box');
      default: return pizzas.filter(p => p.category === 'pizza');
    }
  }, [currentView, pizzas, user]);

  const navItems = [
    { id: 'home', label: 'Піца', icon: PizzaIcon },
    { id: 'box', label: 'BOX', icon: Package },
    { id: 'promotions', label: 'Акції', icon: Star },
    { id: 'favorites', label: 'Любиме', icon: Heart },
    { id: 'history', label: 'Історія', icon: History, requireAuth: true },
  ];

  const showMobileNav = !isCartOpen && !isAuthOpen && currentView !== 'admin';

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative bg-[#fffaf5] text-black selection:bg-orange-100 selection:text-orange-900">
      <Header 
        user={user} 
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={setCurrentView}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Landing Page Content Only for Home View */}
      {currentView === 'home' && (
        <div className="animate-in fade-in duration-700">
          {/* Hero Section */}
          <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
             <img src={siteSpecial.image} className="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-105 animate-pulse-slow" alt="P2Pizza Hero" />
             <div className="container mx-auto px-4 z-10 text-center text-white">
                <span className="inline-block bg-orange-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 animate-bounce">
                  {siteSpecial.badge}
                </span>
                <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none drop-shadow-2xl">
                  {siteSpecial.title}
                </h1>
                <p className="text-xl md:text-2xl font-medium text-gray-200 max-w-2xl mx-auto mb-10 drop-shadow">
                  {siteSpecial.description}
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                   <button 
                    onClick={() => {
                        const el = document.getElementById('menu-start');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-orange-500 hover:bg-white hover:text-orange-600 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                   >
                     Замовити зараз
                   </button>
                   <button 
                    onClick={() => setCurrentView('promotions')}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-2 border-white/30 px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all active:scale-95"
                   >
                     Наші Акції
                   </button>
                </div>
             </div>
          </section>

          {/* Features Section */}
          <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Чому обирають <span className="text-orange-500">P2PIZZA</span>?</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Ми робимо більше, ніж просто їжу</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                    { icon: Zap, title: "Швидкість", desc: "Приготування за 8 хвилин. Доставка по місту до 40 хвилин." },
                    { icon: ShieldCheck, title: "Якість", desc: "Тільки свіжі інгредієнти від перевірених фермерів." },
                    { icon: Smile, title: "Смак", desc: "Авторські рецепти, які ви не знайдете в інших місцях." }
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-8 rounded-[3rem] bg-[#fffaf5] border border-orange-50 hover:shadow-xl transition-all">
                       <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                          <f.icon size={32} />
                       </div>
                       <h3 className="text-2xl font-black mb-4 uppercase">{f.title}</h3>
                       <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="py-24 bg-[#fffaf5]">
            <div className="container mx-auto px-4">
               <div className="flex flex-col md:flex-row items-center gap-16">
                  <div className="md:w-1/2">
                     <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">Від вашого замовлення до <span className="text-orange-500">першого шматочка</span></h2>
                     <div className="space-y-8">
                        {[
                          { step: "01", title: "Оберіть улюблену піцу", desc: "Перегляньте наше меню та додайте страви до кошика." },
                          { step: "02", title: "Ми починаємо магію", desc: "Наші піцайоло готують ваше замовлення зі свіжого тіста." },
                          { step: "03", title: "Гаряча доставка", desc: "Кур'єр привозить замовлення ще гарячим прямо до дверей." }
                        ].map((s, i) => (
                          <div key={i} className="flex gap-6 items-start">
                             <span className="text-4xl font-black text-orange-200">{s.step}</span>
                             <div>
                                <h4 className="text-xl font-black uppercase mb-1">{s.title}</h4>
                                <p className="text-gray-500 font-medium">{s.desc}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="md:w-1/2 relative">
                     <div className="rounded-[4rem] overflow-hidden shadow-2xl rotate-3">
                        <img src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=800" alt="Cooking" className="w-full h-full object-cover" />
                     </div>
                     <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2rem] shadow-xl border border-orange-50 hidden lg:block animate-bounce-slow">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                              <Utensils size={24} />
                           </div>
                           <div>
                              <p className="font-black text-sm uppercase">1000+ замовлень</p>
                              <p className="text-[10px] text-gray-400 font-bold">Сьогодні у вашому місті</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </section>
        </div>
      )}

      {/* Main Menu Section (Shared for all views except Home-landing) */}
      <main id="menu-start" className="container mx-auto px-4 py-16 min-h-[60vh]">
        {activePreparingOrder && (
          <div className="max-w-xl mx-auto mb-16">
            <div className="flex items-center gap-2 mb-4 justify-center text-orange-600 font-black uppercase text-xs tracking-widest animate-pulse">
                <Info size={16} /> Поточне замовлення {activePreparingOrder.id} - Готується
            </div>
            <CookingTracker startTime={activePreparingOrder.preparingStartTime!} />
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-6">
            {currentView === 'home' && 'Наше Меню'}
            {currentView === 'box' && 'BOX-меню та закуски'}
            {currentView === 'promotions' && 'Акційні пропозиції'}
            {currentView === 'new' && 'Останні новинки'}
            {currentView === 'favorites' && 'Ваше улюблене'}
            {currentView === 'history' && 'Історія замовлень'}
            <div className="h-2 flex-grow bg-orange-100 rounded-full hidden md:block" />
          </h2>
        </div>

        {currentView === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
            {orders.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-orange-50">
                <ShoppingBag className="w-20 h-20 mx-auto text-gray-100 mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Ви ще нічого не замовляли</p>
                <button onClick={() => setCurrentView('home')} className="mt-6 text-orange-500 font-black uppercase text-xs hover:underline">Перейти до меню</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-orange-50 flex flex-col md:flex-row gap-8 items-center transition-all hover:shadow-md">
                  <div className="flex-grow w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg uppercase tracking-widest">{order.id}</span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase">{order.date}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.paymentMethod === 'card_on_receipt' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-700'}`}>
                        {order.paymentMethod === 'card_on_receipt' ? 'Картою' : 'Готівка'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {order.items.map(item => (
                        <span key={item.id} className="bg-[#fffaf5] border border-orange-100 text-orange-600 px-3 py-2 rounded-xl text-xs font-black uppercase">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500"><Clock size={16} className="text-orange-500" /> {order.type === 'delivery' ? 'Доставка' : 'Самовивіз'}</div>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${order.status === 'completed' || order.status === 'delivered' ? 'text-green-600' : order.status === 'cancelled' ? 'text-red-500' : 'text-orange-600'}`}>
                        {order.status === 'completed' || order.status === 'delivered' ? <CheckCircle2 size={16} /> : order.status === 'cancelled' ? <XCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />}
                        {order.status === 'pending' ? 'Очікує' : order.status === 'preparing' ? 'Готується' : order.status === 'ready' ? 'Готово' : order.status === 'delivered' ? 'Доставлено' : order.status === 'cancelled' ? 'Скасовано' : 'Виконано'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right min-w-[160px] border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 flex flex-col items-center md:items-end">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">До сплати</p>
                    <p className="text-3xl font-black text-black mb-6">{order.total} <span className="text-sm font-bold text-orange-500">грн</span></p>
                    
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-100"
                      >
                        <XCircle size={14} /> Скасувати
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 animate-in fade-in duration-500">
            {filteredPizzas.map(pizza => (
              <PizzaCard key={pizza.id} pizza={pizza} onAddToCart={handleAddToCart} isFavorite={user?.favorites.includes(pizza.id) || false} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      {showMobileNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-orange-100 flex items-center justify-around px-2 py-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            if (item.requireAuth && !user) return null;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-orange-500 scale-110' : 'text-gray-400'}`}
              >
                <Icon size={24} className={isActive ? 'fill-orange-50' : ''} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            );
          })}
          <button 
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${cartCount > 0 ? 'text-black' : 'text-gray-400'}`}
          >
            <ShoppingCart size={24} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Кошик</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      )}

      {/* Flying Animation */}
      {flyingPizzas.map(p => (
        <div 
          key={p.id}
          className="fixed z-[200] w-24 h-24 rounded-full shadow-2xl pointer-events-none"
          style={{
            left: p.startX,
            top: p.startY,
            animation: 'flyToCart 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
        >
          <img src={p.image} className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl" alt="Flying Pizza" />
        </div>
      ))}

      <style>{`
        @keyframes flyToCart {
          0% { transform: scale(1.2) rotate(0deg); opacity: 1; }
          40% { transform: scale(0.8) rotate(180deg); opacity: 1; }
          100% { 
            left: calc(100vw - 150px); 
            top: 20px; 
            transform: scale(0.1) rotate(720deg); 
            opacity: 0; 
          }
        }
        @media (max-width: 768px) {
          @keyframes flyToCart {
            0% { transform: scale(1.2) rotate(0deg); opacity: 1; }
            100% { 
              left: calc(100vw - 100px); 
              top: calc(100vh - 80px); 
              transform: scale(0.1) rotate(720deg); 
              opacity: 0; 
            }
          }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 20s infinite ease-in-out;
        }
      `}</style>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveFromCart} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => { setUser(u); saveUser(u); }} onLogout={() => { setUser(null); saveUser(null); }} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={(newPizzas) => { setPizzas(newPizzas); savePizzas(newPizzas); }} orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} onClose={() => setCurrentView('home')} />}

      {notification && (
        <div className="fixed bottom-32 md:bottom-12 right-6 z-[110] bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-right duration-300 border border-orange-500">
          {notification}
        </div>
      )}
    </div>
  );
};

export default App;
